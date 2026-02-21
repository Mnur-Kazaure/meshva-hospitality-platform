import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalStatus,
  FrontDeskEvents,
  HousekeepingTaskStatus,
  ManagerEvents,
  ReservationStatus,
  RoomStatus,
  StayStatus,
} from '@meshva/contracts';
import { randomUUID } from 'crypto';
import { AppRequest } from '../../common/types/request-context';
import { assertValidDateRange } from '../../common/utils/date-range';
import { isRoomSellable } from '../../common/utils/room-status';
import { AuditService } from '../audit/audit.service';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';
import { CreateRatePlanDto } from './dto/create-rate-plan.dto';
import { FinalizeNoShowDto } from './dto/finalize-no-show.dto';
import { ForceCancelDto } from './dto/force-cancel.dto';
import { SetOnboardingRoomStatusDto } from './dto/set-onboarding-room-status.dto';
import { UnlockDayDto } from './dto/unlock-day.dto';
import { UpdateRatePlanDto } from './dto/update-rate-plan.dto';
import { ManagerOverviewQueryDto } from './dto/manager-overview-query.dto';

@Injectable()
export class ManagerService {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
    private readonly auditService: AuditService,
  ) {}

  async getOverview(
    propertyId: string,
    request: AppRequest,
    query: ManagerOverviewQueryDto,
  ) {
    const tenantId = request.context.tenantId;
    const targetDate = query.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
    const [reservations, stays, rooms, discountRequests, refundRequests, overrideRequests] =
      await Promise.all([
        this.repository.listReservations({ tenantId, propertyId }),
        this.repository.listStays({ tenantId, propertyId }),
        this.repository.listRooms({ tenantId, propertyId }),
        this.repository.listDiscountRequests({
          tenantId,
          propertyId,
          status: ApprovalStatus.REQUESTED,
        }),
        this.repository.listRefundRequests({
          tenantId,
          propertyId,
          status: ApprovalStatus.REQUESTED,
        }),
        this.repository.listOverrideRequests({
          tenantId,
          propertyId,
          status: ApprovalStatus.REQUESTED,
        }),
      ]);

    const openStays = stays.filter((stay) => stay.status === StayStatus.OPEN);
    const arrivals = reservations.filter((reservation) => reservation.checkIn === targetDate);
    const departures = reservations.filter((reservation) => reservation.checkOut === targetDate);
    const dirtyRooms = rooms.filter((room) => room.status === RoomStatus.DIRTY).length;
    const occupiedRooms = rooms.filter((room) => room.status === RoomStatus.OCCUPIED).length;
    const totalRooms = rooms.length;

    const lastSevenDays = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const exceptions = await this.repository.listAuditLogs({
      tenantId,
      propertyId,
      from: lastSevenDays,
      limit: 200,
    });
    const exceptionCount = exceptions.filter((log) => this.isExceptionAction(log.action)).length;

    return {
      date: targetDate,
      occupancy: {
        occupiedRooms,
        totalRooms,
        occupancyRate: totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(2)) : 0,
      },
      arrivalsCount: arrivals.length,
      departuresCount: departures.length,
      inHouseCount: openStays.length,
      approvalsCount:
        discountRequests.length + refundRequests.length + overrideRequests.length,
      exceptionsCount: exceptionCount,
      dirtyRoomsCount: dirtyRooms,
    };
  }

  async getRoomOversight(propertyId: string, request: AppRequest) {
    const tenantId = request.context.tenantId;
    const [rooms, stays, reservations] = await Promise.all([
      this.repository.listRooms({ tenantId, propertyId }),
      this.repository.listStays({ tenantId, propertyId }),
      this.repository.listReservations({ tenantId, propertyId }),
    ]);

    const openStays = stays.filter((stay) => stay.status === StayStatus.OPEN);
    const roomTypes = await this.repository.listRoomTypes({ tenantId, propertyId });
    const today = new Date().toISOString().slice(0, 10);

    const rows = rooms.map((room) => {
      const roomType = roomTypes.find((type) => type.id === room.roomTypeId);
      const activeStay = openStays.find((stay) => stay.roomId === room.id);
      const occupiedWithClosedStay =
        room.status === RoomStatus.OCCUPIED && !activeStay;
      const readyNotSold =
        isRoomSellable(room.status) &&
        !reservations.some(
          (reservation) =>
            reservation.roomTypeId === room.roomTypeId &&
            reservation.status === ReservationStatus.CONFIRMED &&
            reservation.checkIn <= today &&
            reservation.checkOut > today,
        );

      return {
        roomId: room.id,
        roomNumber: room.roomNumber,
        roomType: roomType?.name ?? 'Unknown',
        status: room.status,
        anomaly: occupiedWithClosedStay
          ? 'OCCUPIED_WITHOUT_OPEN_STAY'
          : room.status === RoomStatus.DIRTY
            ? 'DIRTY_ROOM'
            : readyNotSold
              ? 'READY_NOT_SOLD'
              : null,
      };
    });

    return {
      rows,
      anomalyCount: rows.filter((row) => row.anomaly !== null).length,
    };
  }

  async listRatePlans(propertyId: string, request: AppRequest) {
    return this.repository.listRatePlans({
      tenantId: request.context.tenantId,
      propertyId,
    });
  }

  async createRatePlan(propertyId: string, request: AppRequest, dto: CreateRatePlanDto) {
    await this.assertRoomTypeExists(request.context.tenantId, propertyId, dto.roomTypeId);
    if (dto.effectiveTo) {
      assertValidDateRange(dto.effectiveFrom, dto.effectiveTo);
    }

    const now = new Date().toISOString();
    const created = await this.repository.createRatePlan({
      ratePlan: {
        id: randomUUID(),
        tenantId: request.context.tenantId,
        propertyId,
        roomTypeId: dto.roomTypeId,
        name: dto.name,
        baseRate: dto.baseRate,
        currency: dto.currency ?? 'NGN',
        effectiveFrom: dto.effectiveFrom.slice(0, 10),
        effectiveTo: dto.effectiveTo?.slice(0, 10),
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.RATEPLAN_CREATED,
      entityType: 'RatePlan',
      entityId: created.id,
      propertyId,
      afterJson: created,
    });

    return created;
  }

  async updateRatePlan(
    propertyId: string,
    request: AppRequest,
    ratePlanId: string,
    dto: UpdateRatePlanDto,
  ) {
    const existing = await this.repository.getRatePlan({
      tenantId: request.context.tenantId,
      propertyId,
      ratePlanId,
    });
    if (!existing) {
      throw new NotFoundException('Rate plan not found');
    }

    const nextRoomTypeId = dto.roomTypeId ?? existing.roomTypeId;
    await this.assertRoomTypeExists(request.context.tenantId, propertyId, nextRoomTypeId);

    const nextEffectiveFrom = dto.effectiveFrom?.slice(0, 10) ?? existing.effectiveFrom;
    const nextEffectiveTo = dto.effectiveTo?.slice(0, 10) ?? existing.effectiveTo;
    if (nextEffectiveTo) {
      assertValidDateRange(nextEffectiveFrom, nextEffectiveTo);
    }

    const before = { ...existing };
    existing.roomTypeId = nextRoomTypeId;
    existing.name = dto.name ?? existing.name;
    existing.baseRate = dto.baseRate ?? existing.baseRate;
    existing.currency = dto.currency ?? existing.currency;
    existing.effectiveFrom = nextEffectiveFrom;
    existing.effectiveTo = nextEffectiveTo;
    existing.updatedAt = new Date().toISOString();

    const updated = await this.repository.updateRatePlan({ ratePlan: existing });
    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.RATEPLAN_UPDATED,
      entityType: 'RatePlan',
      entityId: updated.id,
      propertyId,
      beforeJson: before,
      afterJson: updated,
    });

    return updated;
  }

  async confirmReservation(propertyId: string, request: AppRequest, reservationId: string) {
    const reservation = await this.getReservationOrThrow(
      request.context.tenantId,
      propertyId,
      reservationId,
    );

    if (
      reservation.status === ReservationStatus.CANCELLED ||
      reservation.status === ReservationStatus.EXPIRED ||
      reservation.status === ReservationStatus.NO_SHOW
    ) {
      throw new BadRequestException('Reservation cannot be confirmed in current state');
    }

    const before = { ...reservation };
    reservation.status = ReservationStatus.CONFIRMED;
    reservation.updatedAt = new Date().toISOString();
    const updated = await this.repository.updateReservation({ reservation });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.RESERVATION_CONFIRMED_BY_MANAGER,
      entityType: 'Reservation',
      entityId: updated.id,
      propertyId,
      beforeJson: before,
      afterJson: updated,
    });

    return updated;
  }

  async finalizeNoShow(
    propertyId: string,
    request: AppRequest,
    reservationId: string,
    dto: FinalizeNoShowDto,
  ) {
    const reservation = await this.getReservationOrThrow(
      request.context.tenantId,
      propertyId,
      reservationId,
    );

    const today = new Date().toISOString().slice(0, 10);
    if (reservation.checkIn >= today) {
      throw new BadRequestException('No-show can only be finalized after check-in date');
    }

    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Cancelled reservation cannot be marked no-show');
    }

    const openStay = (await this.repository.listStays({
      tenantId: request.context.tenantId,
      propertyId,
    })).find(
      (stay) => stay.reservationId === reservation.id && stay.status === StayStatus.OPEN,
    );
    if (openStay) {
      throw new ConflictException('Reservation has an open stay and cannot be marked no-show');
    }

    const before = { ...reservation };
    reservation.status = ReservationStatus.NO_SHOW;
    reservation.cancelReason = 'NO_SHOW';
    reservation.cancelNotes = dto.reason;
    reservation.updatedAt = new Date().toISOString();
    const updated = await this.repository.updateReservation({ reservation });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.RESERVATION_MARKED_NO_SHOW,
      entityType: 'Reservation',
      entityId: updated.id,
      propertyId,
      beforeJson: before,
      afterJson: updated,
    });

    await this.repository.enqueue('messaging', 'messaging.send', {
      propertyId,
      reservationId: updated.id,
      template: FrontDeskEvents.RESERVATION_CANCELLED,
    });

    return updated;
  }

  async forceCancel(
    propertyId: string,
    request: AppRequest,
    reservationId: string,
    dto: ForceCancelDto,
  ) {
    const reservation = await this.getReservationOrThrow(
      request.context.tenantId,
      propertyId,
      reservationId,
    );

    const openStay = (await this.repository.listStays({
      tenantId: request.context.tenantId,
      propertyId,
    })).find(
      (stay) => stay.reservationId === reservation.id && stay.status === StayStatus.OPEN,
    );
    if (openStay) {
      throw new ConflictException('Reservation has an open stay and cannot be force-cancelled');
    }

    const before = { ...reservation };
    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancelReason = 'MANAGER_FORCE_CANCEL';
    reservation.cancelNotes = dto.reason;
    reservation.updatedAt = new Date().toISOString();
    const updated = await this.repository.updateReservation({ reservation });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.RESERVATION_FORCE_CANCELLED,
      entityType: 'Reservation',
      entityId: updated.id,
      propertyId,
      beforeJson: before,
      afterJson: updated,
    });

    return updated;
  }

  async unlockDay(propertyId: string, request: AppRequest, dto: UnlockDayDto) {
    const before = await this.repository.getDayControl({
      tenantId: request.context.tenantId,
      propertyId,
      date: dto.date.slice(0, 10),
    });
    const now = new Date().toISOString();

    const updated = await this.repository.upsertDayControl({
      control: {
        id: before?.id ?? randomUUID(),
        tenantId: request.context.tenantId,
        propertyId,
        date: dto.date.slice(0, 10),
        isLocked: false,
        unlockedByUserId: request.context.userId,
        unlockReason: dto.reason,
        createdAt: before?.createdAt ?? now,
        updatedAt: now,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.DAY_UNLOCKED_BY_MANAGER,
      entityType: 'DayControl',
      entityId: updated.id,
      propertyId,
      beforeJson: before,
      afterJson: updated,
    });

    await this.repository.enqueue('messaging', 'owner.alert', {
      tenantId: request.context.tenantId,
      propertyId,
      type: ManagerEvents.DAY_UNLOCKED_BY_MANAGER,
      date: updated.date,
      reason: dto.reason,
    });

    return updated;
  }

  async setRoomStatusForOnboarding(
    propertyId: string,
    roomId: string,
    request: AppRequest,
    dto: SetOnboardingRoomStatusDto,
  ) {
    if (![RoomStatus.DIRTY, RoomStatus.VACANT_READY].includes(dto.status)) {
      throw new BadRequestException('Only DIRTY or VACANT_READY are allowed for onboarding room status');
    }

    const room = await this.repository.getRoom({
      tenantId: request.context.tenantId,
      propertyId,
      roomId,
    });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.status === RoomStatus.OCCUPIED && dto.status !== RoomStatus.OCCUPIED) {
      throw new ConflictException('Cannot override OCCUPIED room status through onboarding endpoint');
    }

    const openStayForRoom = (await this.repository.listStays({
      tenantId: request.context.tenantId,
      propertyId,
    })).find((stay) => stay.roomId === roomId && stay.status === StayStatus.OPEN);

    if (dto.status === RoomStatus.VACANT_READY && openStayForRoom) {
      throw new ConflictException('Room has open stay; cannot mark VACANT_READY');
    }

    if (room.status === dto.status) {
      return room;
    }

    const before = { ...room };
    room.status = dto.status;
    const updated = await this.repository.updateRoom(room);

    if (dto.status === RoomStatus.DIRTY) {
      const existingTask = await this.repository.getActiveHousekeepingTaskForRoom({
        tenantId: request.context.tenantId,
        propertyId,
        roomId,
      });
      if (!existingTask) {
        const now = new Date().toISOString();
        const createdTask = await this.repository.createHousekeepingTask({
          task: {
            id: randomUUID(),
            tenantId: request.context.tenantId,
            propertyId,
            roomId,
            stayId: openStayForRoom?.id,
            status: HousekeepingTaskStatus.DIRTY,
            note: 'Day 1 onboarding room status import',
            createdAt: now,
            updatedAt: now,
          },
        });
        await this.auditService.recordMutation(request.context, {
          action: FrontDeskEvents.HOUSEKEEPING_TASK_CREATED,
          entityType: 'HousekeepingTask',
          entityId: createdTask.id,
          propertyId,
          afterJson: createdTask,
        });
      }
    }

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.ROOM_STATUS_SET_FOR_ONBOARDING,
      entityType: 'Room',
      entityId: updated.id,
      propertyId,
      beforeJson: before,
      afterJson: {
        ...updated,
        reason: dto.reason,
      },
    });

    return updated;
  }

  private async getReservationOrThrow(tenantId: string, propertyId: string, reservationId: string) {
    const reservation = await this.repository.getReservation({
      tenantId,
      propertyId,
      reservationId,
    });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    return reservation;
  }

  private async assertRoomTypeExists(tenantId: string, propertyId: string, roomTypeId: string) {
    const roomType = await this.repository.getRoomType({
      tenantId,
      propertyId,
      roomTypeId,
    });
    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }
  }

  private isExceptionAction(action: string): boolean {
    const markers = ['OVERRIDE', 'DISCOUNT', 'REFUND', 'FORCE_CANCEL', 'DAY_UNLOCK'];
    return markers.some((marker) => action.includes(marker));
  }
}
