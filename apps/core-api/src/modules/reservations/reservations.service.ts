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
  FrontDeskEvents,
  ReservationStatus,
  RoomStatus,
  StayStatus,
} from '@meshva/contracts';
import { randomUUID } from 'crypto';
import { assertValidDateRange, overlaps } from '../../common/utils/date-range';
import { isRoomSellable } from '../../common/utils/room-status';
import { AppRequest } from '../../common/types/request-context';
import { AuditService } from '../audit/audit.service';
import { InventoryService } from '../inventory/inventory.service';
import { MessagingService } from '../messaging/messaging.service';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ListReservationsDto } from './dto/list-reservations.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
    private readonly messagingService: MessagingService,
  ) {}

  async list(propertyId: string, request: AppRequest, query: ListReservationsDto) {
    const reservations = await this.repository.listReservations({
      tenantId: request.context.tenantId,
      propertyId,
    });

    return reservations
      .filter((reservation) => {
        if (query.status && reservation.status !== query.status) {
          return false;
        }

        if (query.from && reservation.checkOut < query.from) {
          return false;
        }

        if (query.to && reservation.checkIn > query.to) {
          return false;
        }

        if (!query.q) {
          return true;
        }

        const term = query.q.toLowerCase();
        return Boolean(
          reservation.code.toLowerCase().includes(term) ||
            reservation.guestFullName.toLowerCase().includes(term) ||
            reservation.guestPhone?.toLowerCase().includes(term),
        );
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getTodayBoard(propertyId: string, request: AppRequest) {
    const today = new Date().toISOString().slice(0, 10);
    const reservations = (await this.repository.listReservations({
      tenantId: request.context.tenantId,
      propertyId,
    })).filter((reservation) => reservation.status !== ReservationStatus.CANCELLED);

    const stays = await this.repository.listStays({
      tenantId: request.context.tenantId,
      propertyId,
    });
    const rooms = await this.repository.listRooms({
      tenantId: request.context.tenantId,
      propertyId,
    });

    const arrivalsToday = reservations.filter((reservation) => reservation.checkIn === today);
    const departuresToday = reservations.filter((reservation) => reservation.checkOut === today);
    const inHouseCount = stays.filter((stay) => stay.status === StayStatus.OPEN).length;
    const availableRoomsNow = rooms.filter((room) => isRoomSellable(room.status)).length;

    return {
      date: today,
      arrivalsTodayCount: arrivalsToday.length,
      departuresTodayCount: departuresToday.length,
      inHouseCount,
      availableRoomsNow,
      pendingConfirmCount: reservations.filter(
        (reservation) => reservation.status === ReservationStatus.PENDING_CONFIRM,
      ).length,
      arrivalsToday,
      departuresToday,
    };
  }

  async create(propertyId: string, request: AppRequest, dto: CreateReservationDto) {
    assertValidDateRange(dto.checkIn, dto.checkOut);

    const status = dto.status ?? ReservationStatus.CONFIRMED;
    if (![ReservationStatus.CONFIRMED, ReservationStatus.PENDING_CONFIRM].includes(status)) {
      throw new BadRequestException('Front Desk can only create CONFIRMED or PENDING_CONFIRM');
    }

    const availability = await this.inventoryService.checkAvailability({
      tenantId: request.context.tenantId,
      propertyId,
      roomTypeId: dto.roomTypeId,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
    });

    if (availability.availableUnits <= 0) {
      throw new ConflictException('Selected room type is not available for selected dates');
    }

    const guest = await this.resolveGuest(propertyId, request, dto.guest);
    const now = new Date().toISOString();
    const reservation = {
      id: randomUUID(),
      tenantId: request.context.tenantId,
      propertyId,
      code: await this.repository.generateReservationCode(propertyId),
      guestId: guest.id,
      guestFullName: guest.fullName,
      guestPhone: guest.phone,
      roomTypeId: dto.roomTypeId,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      adults: dto.adults ?? 1,
      children: dto.children ?? 0,
      source: dto.source,
      notes: dto.notes,
      noPhone: !guest.phone,
      depositStatus: dto.depositStatus,
      status,
      createdAt: now,
      updatedAt: now,
    };

    const createdReservation = await this.repository.createReservation({ reservation });

    await this.auditService.recordMutation(request.context, {
      action: FrontDeskEvents.RESERVATION_CREATED,
      entityType: 'Reservation',
      entityId: createdReservation.id,
      propertyId,
      afterJson: createdReservation,
    });

    if (guest.phone) {
      await this.messagingService.queueConfirmation({
        tenantId: request.context.tenantId,
        propertyId,
        entityType: ConfirmationEntityType.RESERVATION,
        entityId: createdReservation.id,
        template: ConfirmationTemplate.CONFIRM,
        channel: ConfirmationChannel.WHATSAPP,
        toPhone: guest.phone,
      });
    }

    return createdReservation;
  }

  async update(
    propertyId: string,
    reservationId: string,
    request: AppRequest,
    dto: UpdateReservationDto,
  ) {
    const reservation = await this.getReservationOrThrow(propertyId, reservationId, request);
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Cancelled reservations cannot be modified');
    }

    const nextCheckIn = dto.checkIn ?? reservation.checkIn;
    const nextCheckOut = dto.checkOut ?? reservation.checkOut;
    const nextRoomTypeId = dto.roomTypeId ?? reservation.roomTypeId;

    assertValidDateRange(nextCheckIn, nextCheckOut);

    const availability = await this.inventoryService.checkAvailability({
      tenantId: request.context.tenantId,
      propertyId,
      roomTypeId: nextRoomTypeId,
      checkIn: nextCheckIn,
      checkOut: nextCheckOut,
      excludeReservationId: reservation.id,
    });

    if (availability.availableUnits <= 0) {
      throw new ConflictException('Selected room type is no longer available for selected dates');
    }

    const before = { ...reservation };
    reservation.checkIn = nextCheckIn;
    reservation.checkOut = nextCheckOut;
    reservation.roomTypeId = nextRoomTypeId;
    reservation.adults = dto.adults ?? reservation.adults;
    reservation.children = dto.children ?? reservation.children;
    reservation.notes = dto.notes ?? reservation.notes;

    if (dto.guestUpdate) {
      reservation.guestFullName = dto.guestUpdate.fullName ?? reservation.guestFullName;
      reservation.guestPhone = dto.guestUpdate.phone ?? reservation.guestPhone;
      reservation.noPhone = !reservation.guestPhone;

      await this.repository.updateGuest({
        tenantId: request.context.tenantId,
        propertyId,
        guestId: reservation.guestId,
        patch: {
          fullName: reservation.guestFullName,
          phone: reservation.guestPhone,
          email: dto.guestUpdate.email,
        },
      });
    }

    reservation.updatedAt = new Date().toISOString();
    const updatedReservation = await this.repository.updateReservation({ reservation });

    await this.auditService.recordMutation(request.context, {
      action: FrontDeskEvents.RESERVATION_UPDATED,
      entityType: 'Reservation',
      entityId: updatedReservation.id,
      propertyId,
      beforeJson: before,
      afterJson: updatedReservation,
    });

    if (updatedReservation.guestPhone) {
      await this.messagingService.queueConfirmation({
        tenantId: request.context.tenantId,
        propertyId,
        entityType: ConfirmationEntityType.RESERVATION,
        entityId: updatedReservation.id,
        template: ConfirmationTemplate.MODIFY,
        channel: ConfirmationChannel.WHATSAPP,
        toPhone: updatedReservation.guestPhone,
      });
    }

    return updatedReservation;
  }

  async cancel(
    propertyId: string,
    reservationId: string,
    request: AppRequest,
    dto: CancelReservationDto,
  ) {
    const reservation = await this.getReservationOrThrow(propertyId, reservationId, request);
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Reservation already cancelled');
    }

    const activeStay = (await this.repository.listStays({
      tenantId: request.context.tenantId,
      propertyId,
    })).find(
      (stay) => stay.reservationId === reservation.id && stay.status !== StayStatus.CLOSED,
    );
    if (activeStay) {
      throw new ConflictException('Reservation cannot be cancelled while stay is open');
    }

    const before = { ...reservation };
    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancelReason = dto.reason;
    reservation.cancelNotes = dto.notes;
    reservation.updatedAt = new Date().toISOString();

    const updatedReservation = await this.repository.updateReservation({ reservation });

    await this.auditService.recordMutation(request.context, {
      action: FrontDeskEvents.RESERVATION_CANCELLED,
      entityType: 'Reservation',
      entityId: updatedReservation.id,
      propertyId,
      beforeJson: before,
      afterJson: updatedReservation,
    });

    if (updatedReservation.guestPhone) {
      await this.messagingService.queueConfirmation({
        tenantId: request.context.tenantId,
        propertyId,
        entityType: ConfirmationEntityType.RESERVATION,
        entityId: updatedReservation.id,
        template: ConfirmationTemplate.CANCEL,
        channel: ConfirmationChannel.WHATSAPP,
        toPhone: updatedReservation.guestPhone,
      });
    }

    return updatedReservation;
  }

  private async resolveGuest(
    propertyId: string,
    request: AppRequest,
    input: CreateReservationDto['guest'],
  ) {
    if (input.guestId) {
      const guest = await this.repository.getGuestById({
        tenantId: request.context.tenantId,
        propertyId,
        guestId: input.guestId,
      });

      if (!guest) {
        throw new NotFoundException('Selected guest not found for property');
      }

      return guest;
    }

    return this.repository.createGuest({
      tenantId: request.context.tenantId,
      propertyId,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
    });
  }

  private async getReservationOrThrow(
    propertyId: string,
    reservationId: string,
    request: AppRequest,
  ) {
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

  async hasActiveReservationOverlap(input: {
    tenantId: string;
    propertyId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    excludeReservationId?: string;
  }): Promise<boolean> {
    const activeStatuses = [ReservationStatus.CONFIRMED, ReservationStatus.PENDING_CONFIRM];
    const reservations = await this.repository.listReservations({
      tenantId: input.tenantId,
      propertyId: input.propertyId,
    });

    return reservations.some((reservation) => {
      if (reservation.roomTypeId !== input.roomTypeId) {
        return false;
      }

      if (!activeStatuses.includes(reservation.status)) {
        return false;
      }

      if (input.excludeReservationId && reservation.id === input.excludeReservationId) {
        return false;
      }

      return overlaps(
        {
          checkIn: reservation.checkIn,
          checkOut: reservation.checkOut,
        },
        {
          checkIn: input.checkIn,
          checkOut: input.checkOut,
        },
      );
    });
  }
}
