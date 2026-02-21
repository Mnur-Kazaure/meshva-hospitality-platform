import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConfirmationChannel,
  ConfirmationEntityType,
  ConfirmationTemplate,
  FinanceEvents,
  FrontDeskEvents,
  HousekeepingTaskStatus,
  ReservationStatus,
  RoomStatus,
  StayStatus,
} from '@meshva/contracts';
import { randomUUID } from 'crypto';
import { assertValidDateRange } from '../../common/utils/date-range';
import { isRoomSellable } from '../../common/utils/room-status';
import { AppRequest } from '../../common/types/request-context';
import { AuditService } from '../audit/audit.service';
import { InventoryService } from '../inventory/inventory.service';
import { MessagingService } from '../messaging/messaging.service';
import { ReservationRecord, StayRecord } from '../tenancy/tenancy-store.service';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';
import { ChangeRoomDto } from './dto/change-room.dto';
import { CheckInDto } from './dto/checkin.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { ExtendStayDto } from './dto/extend-stay.dto';

@Injectable()
export class StaysService {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
    private readonly messagingService: MessagingService,
  ) {}

  async checkIn(propertyId: string, request: AppRequest, dto: CheckInDto) {
    const reservation = await this.getReservationOrThrow(propertyId, request, dto.reservationId);
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException('Only CONFIRMED reservations can be checked in');
    }

    const existingOpenStay = (await this.repository.listStays({
      tenantId: request.context.tenantId,
      propertyId,
    })).find(
      (stay) => stay.reservationId === reservation.id && stay.status === StayStatus.OPEN,
    );
    if (existingOpenStay) {
      throw new ConflictException('Reservation already has an open stay');
    }

    const assignedRoom = await this.resolveRoomForCheckIn(
      propertyId,
      request,
      reservation,
      dto.assignRoomId,
    );
    const now = new Date().toISOString();
    const checkInAt = this.resolveCheckInAt(dto.checkInAt, now);
    const stay = {
      id: randomUUID(),
      tenantId: request.context.tenantId,
      propertyId,
      reservationId: reservation.id,
      guestId: reservation.guestId,
      roomId: assignedRoom.id,
      idNumber: dto.idNumber,
      status: StayStatus.OPEN,
      checkInAt,
      plannedCheckOut: reservation.checkOut,
      createdAt: now,
      updatedAt: now,
    };

    const createdStay = await this.repository.createStay({ stay });
    assignedRoom.status = RoomStatus.OCCUPIED;
    await this.repository.updateRoom(assignedRoom);
    const invoice = await this.ensureInvoiceForStay(propertyId, request, reservation.id, createdStay.id, {
      guestId: reservation.guestId,
      issuedOn: checkInAt.slice(0, 10),
      createdAt: now,
      updatedAt: now,
    });

    await this.auditService.recordMutation(request.context, {
      action: FrontDeskEvents.CHECKIN_COMPLETED,
      entityType: 'Stay',
      entityId: createdStay.id,
      propertyId,
      afterJson: {
        stay: createdStay,
        roomId: assignedRoom.id,
        invoiceId: invoice.id,
      },
    });

    return createdStay;
  }

  async changeRoom(propertyId: string, stayId: string, request: AppRequest, dto: ChangeRoomDto) {
    const stay = await this.getOpenStayOrThrow(propertyId, request, stayId);
    const targetRoom = await this.repository.getRoom({
      tenantId: request.context.tenantId,
      propertyId,
      roomId: dto.toRoomId,
    });

    if (!targetRoom) {
      throw new NotFoundException('Target room not found');
    }

    if (!isRoomSellable(targetRoom.status)) {
      throw new ConflictException('Target room is not vacant/ready');
    }

    const reservation = await this.getReservationOrThrow(propertyId, request, stay.reservationId);
    if (targetRoom.roomTypeId !== reservation.roomTypeId) {
      throw new ConflictException('Target room type does not match reservation room type');
    }

    const previousRoom = stay.roomId
      ? await this.repository.getRoom({
          tenantId: request.context.tenantId,
          propertyId,
          roomId: stay.roomId,
        })
      : undefined;

    const before = { ...stay };
    if (previousRoom) {
      previousRoom.status = RoomStatus.DIRTY;
      await this.repository.updateRoom(previousRoom);
      await this.createHousekeepingTask(propertyId, request, previousRoom.id, stay.id, 'Room changed');
    }

    stay.roomId = targetRoom.id;
    stay.updatedAt = new Date().toISOString();
    targetRoom.status = RoomStatus.OCCUPIED;

    const updatedStay = await this.repository.updateStay({ stay });
    await this.repository.updateRoom(targetRoom);

    await this.auditService.recordMutation(request.context, {
      action: FrontDeskEvents.ROOM_CHANGED,
      entityType: 'Stay',
      entityId: updatedStay.id,
      propertyId,
      beforeJson: before,
      afterJson: {
        ...updatedStay,
        reason: dto.reason,
      },
    });

    return updatedStay;
  }

  async extend(propertyId: string, stayId: string, request: AppRequest, dto: ExtendStayDto) {
    const stay = await this.getOpenStayOrThrow(propertyId, request, stayId);
    const reservation = await this.getReservationOrThrow(propertyId, request, stay.reservationId);

    assertValidDateRange(reservation.checkIn, dto.newCheckOut);
    if (new Date(dto.newCheckOut) <= new Date(stay.plannedCheckOut)) {
      throw new BadRequestException('newCheckOut must be later than existing planned checkout');
    }

    const availability = await this.inventoryService.checkAvailability({
      tenantId: request.context.tenantId,
      propertyId,
      roomTypeId: reservation.roomTypeId,
      checkIn: reservation.checkIn,
      checkOut: dto.newCheckOut,
      excludeReservationId: reservation.id,
    });

    if (availability.availableUnits <= 0) {
      throw new ConflictException('Cannot extend stay due to inventory conflict');
    }

    const beforeStay = { ...stay };
    const beforeReservation = { ...reservation };

    stay.plannedCheckOut = dto.newCheckOut;
    stay.updatedAt = new Date().toISOString();
    reservation.checkOut = dto.newCheckOut;
    reservation.updatedAt = new Date().toISOString();

    const updatedStay = await this.repository.updateStay({ stay });
    const updatedReservation = await this.repository.updateReservation({ reservation });

    await this.auditService.recordMutation(request.context, {
      action: FrontDeskEvents.STAY_EXTENDED,
      entityType: 'Stay',
      entityId: updatedStay.id,
      propertyId,
      beforeJson: {
        stay: beforeStay,
        reservation: beforeReservation,
      },
      afterJson: {
        stay: updatedStay,
        reservation: updatedReservation,
      },
    });

    return updatedStay;
  }

  async checkout(propertyId: string, stayId: string, request: AppRequest, dto: CheckoutDto) {
    const stay = await this.getOpenStayOrThrow(propertyId, request, stayId);
    const reservation = await this.getReservationOrThrow(propertyId, request, stay.reservationId);
    const room = stay.roomId
      ? await this.repository.getRoom({
          tenantId: request.context.tenantId,
          propertyId,
          roomId: stay.roomId,
        })
      : undefined;

    const before = { ...stay };
    stay.status = StayStatus.CLOSED;
    stay.checkOutAt = new Date().toISOString();
    stay.notes = dto.notes;
    stay.updatedAt = new Date().toISOString();

    if (room) {
      room.status = RoomStatus.DIRTY;
      await this.repository.updateRoom(room);
      await this.createHousekeepingTask(propertyId, request, room.id, stay.id, 'Checkout room cleanup');
    }

    const updatedStay = await this.repository.updateStay({ stay });

    await this.auditService.recordMutation(request.context, {
      action: FrontDeskEvents.CHECKOUT_COMPLETED,
      entityType: 'Stay',
      entityId: updatedStay.id,
      propertyId,
      beforeJson: before,
      afterJson: {
        ...updatedStay,
        roomStatus: room?.status,
      },
    });

    if (reservation.guestPhone) {
      await this.messagingService.queueConfirmation({
        tenantId: request.context.tenantId,
        propertyId,
        entityType: ConfirmationEntityType.STAY,
        entityId: updatedStay.id,
        template: ConfirmationTemplate.CHECKOUT,
        channel: ConfirmationChannel.WHATSAPP,
        toPhone: reservation.guestPhone,
      });
    }

    return updatedStay;
  }

  private async resolveRoomForCheckIn(
    propertyId: string,
    request: AppRequest,
    reservation: ReservationRecord,
    assignRoomId?: string,
  ) {
    if (assignRoomId) {
      const assignedRoom = await this.repository.getRoom({
        tenantId: request.context.tenantId,
        propertyId,
        roomId: assignRoomId,
      });
      if (!assignedRoom) {
        throw new NotFoundException('Assigned room not found');
      }

      if (!isRoomSellable(assignedRoom.status)) {
        throw new ConflictException('Assigned room is not available for occupancy');
      }

      if (assignedRoom.roomTypeId !== reservation.roomTypeId) {
        throw new ConflictException('Assigned room type does not match reservation room type');
      }

      return assignedRoom;
    }

    const fallbackRoom = (await this.repository.listRooms({
      tenantId: request.context.tenantId,
      propertyId,
    })).find(
      (room) => room.roomTypeId === reservation.roomTypeId && isRoomSellable(room.status),
    );

    if (!fallbackRoom) {
      throw new ConflictException('No vacant room available for this room type');
    }

    return fallbackRoom;
  }

  private async createHousekeepingTask(
    propertyId: string,
    request: AppRequest,
    roomId: string,
    stayId: string,
    note: string,
  ): Promise<void> {
    const existingTask = await this.repository.getActiveHousekeepingTaskForRoom({
      tenantId: request.context.tenantId,
      propertyId,
      roomId,
    });

    if (existingTask) {
      return;
    }

    const now = new Date().toISOString();
    const task = {
      id: randomUUID(),
      tenantId: request.context.tenantId,
      propertyId,
      roomId,
      stayId,
      status: HousekeepingTaskStatus.DIRTY,
      note,
      createdAt: now,
      updatedAt: now,
    };

    const createdTask = await this.repository.createHousekeepingTask({ task });
    await this.auditService.recordMutation(request.context, {
      action: FrontDeskEvents.HOUSEKEEPING_TASK_CREATED,
      entityType: 'HousekeepingTask',
      entityId: createdTask.id,
      propertyId,
      afterJson: createdTask,
    });
  }

  private resolveCheckInAt(input: string | undefined, fallbackIso: string): string {
    if (!input) {
      return fallbackIso;
    }

    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('checkInAt must be a valid ISO date-time string');
    }

    const now = new Date();
    if (parsed.getTime() > now.getTime()) {
      throw new BadRequestException('checkInAt cannot be in the future');
    }

    return parsed.toISOString();
  }

  private async ensureInvoiceForStay(
    propertyId: string,
    request: AppRequest,
    reservationId: string,
    stayId: string,
    input: {
      guestId: string;
      issuedOn: string;
      createdAt: string;
      updatedAt: string;
    },
  ) {
    const tenantId = request.context.tenantId;
    const invoices = await this.repository.listInvoices({ tenantId, propertyId });
    const existing = invoices.find(
      (invoice) => invoice.stayId === stayId || invoice.reservationId === reservationId,
    );
    if (existing) {
      return existing;
    }

    const invoice = await this.repository.createInvoice({
      invoice: {
        id: randomUUID(),
        tenantId,
        propertyId,
        invoiceNumber: await this.repository.generateInvoiceNumber(propertyId),
        reservationId,
        stayId,
        guestId: input.guestId,
        issuedOn: input.issuedOn,
        currency: 'NGN',
        status: 'OPEN',
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: FinanceEvents.INVOICE_CREATED,
      entityType: 'Invoice',
      entityId: invoice.id,
      propertyId,
      afterJson: invoice,
    });

    return invoice;
  }

  private async getReservationOrThrow(
    propertyId: string,
    request: AppRequest,
    reservationId: string,
  ): Promise<ReservationRecord> {
    const reservation = await this.repository.getReservation({
      reservationId,
      tenantId: request.context.tenantId,
      propertyId,
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  private async getOpenStayOrThrow(
    propertyId: string,
    request: AppRequest,
    stayId: string,
  ): Promise<StayRecord> {
    const stay = await this.repository.getStay({
      stayId,
      tenantId: request.context.tenantId,
      propertyId,
    });

    if (!stay) {
      throw new NotFoundException('Stay not found');
    }

    if (stay.status !== StayStatus.OPEN) {
      throw new BadRequestException('Stay is already closed');
    }

    return stay;
  }
}
