import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ManagerEvents, ReservationStatus } from '@meshva/contracts';
import { randomUUID } from 'crypto';
import { AppRequest } from '../../common/types/request-context';
import { assertValidDateRange } from '../../common/utils/date-range';
import { AuditService } from '../audit/audit.service';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';
import { CreateInventoryBlockDto } from './dto/create-inventory-block.dto';
import { CreateInventoryOverrideDto } from './dto/create-inventory-override.dto';
import { ListInventoryCalendarDto } from './dto/list-inventory-calendar.dto';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
    private readonly auditService: AuditService,
  ) {}

  async checkAvailability(input: {
    tenantId: string;
    propertyId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    excludeReservationId?: string;
  }): Promise<{ availableUnits: number; blockedReason?: string }> {
    assertValidDateRange(input.checkIn, input.checkOut);
    const toInclusive = this.addDays(input.checkOut, -1);
    const entries = await this.computeCalendarEntries({
      tenantId: input.tenantId,
      propertyId: input.propertyId,
      roomTypeId: input.roomTypeId,
      from: input.checkIn,
      to: toInclusive,
      excludeReservationId: input.excludeReservationId,
    });

    const availableUnits = entries.reduce(
      (minimum, entry) => Math.min(minimum, entry.availableUnits),
      Number.MAX_SAFE_INTEGER,
    );
    const normalizedAvailability =
      availableUnits === Number.MAX_SAFE_INTEGER ? 0 : Math.max(0, availableUnits);

    return {
      availableUnits: normalizedAvailability,
      blockedReason: normalizedAvailability === 0 ? 'NO_INVENTORY' : undefined,
    };
  }

  async getCalendar(propertyId: string, request: AppRequest, query: ListInventoryCalendarDto) {
    if (query.to < query.from) {
      throw new BadRequestException('to must be on or after from');
    }

    const entries = await this.computeCalendarEntries({
      tenantId: request.context.tenantId,
      propertyId,
      roomTypeId: query.roomTypeId,
      from: query.from,
      to: query.to,
    });

    return {
      roomTypeId: query.roomTypeId,
      from: query.from,
      to: query.to,
      entries,
    };
  }

  async createBlock(propertyId: string, request: AppRequest, dto: CreateInventoryBlockDto) {
    if (dto.to < dto.from) {
      throw new BadRequestException('to must be on or after from');
    }

    const roomType = await this.repository.getRoomType({
      tenantId: request.context.tenantId,
      propertyId,
      roomTypeId: dto.roomTypeId,
    });
    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }

    if (dto.unitsBlocked > roomType.totalUnits) {
      throw new BadRequestException('unitsBlocked cannot exceed total units');
    }

    const created = await this.repository.createInventoryBlock({
      block: {
        id: randomUUID(),
        tenantId: request.context.tenantId,
        propertyId,
        roomTypeId: dto.roomTypeId,
        fromDate: dto.from,
        toDate: dto.to,
        unitsBlocked: dto.unitsBlocked,
        reason: dto.reason,
        createdByUserId: request.context.userId,
        createdAt: new Date().toISOString(),
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.INVENTORY_BLOCK_CREATED,
      entityType: 'InventoryBlock',
      entityId: created.id,
      propertyId,
      afterJson: created,
    });

    return created;
  }

  async createOverride(
    propertyId: string,
    request: AppRequest,
    dto: CreateInventoryOverrideDto,
  ) {
    const roomType = await this.repository.getRoomType({
      tenantId: request.context.tenantId,
      propertyId,
      roomTypeId: dto.roomTypeId,
    });
    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }

    if (dto.newAvailableUnits > roomType.totalUnits) {
      throw new BadRequestException('newAvailableUnits cannot exceed total units');
    }

    const created = await this.repository.createInventoryOverride({
      override: {
        id: randomUUID(),
        tenantId: request.context.tenantId,
        propertyId,
        roomTypeId: dto.roomTypeId,
        date: dto.date,
        newAvailableUnits: dto.newAvailableUnits,
        reason: dto.reason,
        createdByUserId: request.context.userId,
        createdAt: new Date().toISOString(),
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.INVENTORY_OVERRIDDEN,
      entityType: 'InventoryOverride',
      entityId: created.id,
      propertyId,
      afterJson: created,
    });

    return created;
  }

  private async computeCalendarEntries(input: {
    tenantId: string;
    propertyId: string;
    roomTypeId: string;
    from: string;
    to: string;
    excludeReservationId?: string;
  }) {
    const roomType = await this.repository.getRoomType({
      tenantId: input.tenantId,
      propertyId: input.propertyId,
      roomTypeId: input.roomTypeId,
    });
    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }

    const [reservations, blocks, overrides] = await Promise.all([
      this.repository.listReservations({
        tenantId: input.tenantId,
        propertyId: input.propertyId,
      }),
      this.repository.listInventoryBlocks({
        tenantId: input.tenantId,
        propertyId: input.propertyId,
        roomTypeId: input.roomTypeId,
        from: input.from,
        to: input.to,
      }),
      this.repository.listInventoryOverrides({
        tenantId: input.tenantId,
        propertyId: input.propertyId,
        roomTypeId: input.roomTypeId,
        from: input.from,
        to: input.to,
      }),
    ]);

    const activeStatuses = [ReservationStatus.CONFIRMED, ReservationStatus.PENDING_CONFIRM];
    const dates = this.enumerateDates(input.from, input.to);

    return dates.map((date) => {
      const reservedCount = reservations.filter((reservation) => {
        if (reservation.roomTypeId !== input.roomTypeId) {
          return false;
        }

        if (!activeStatuses.includes(reservation.status)) {
          return false;
        }

        if (input.excludeReservationId && reservation.id === input.excludeReservationId) {
          return false;
        }

        return reservation.checkIn <= date && reservation.checkOut > date;
      }).length;

      const blockedUnits = blocks
        .filter((block) => block.fromDate <= date && block.toDate >= date)
        .reduce((sum, block) => sum + block.unitsBlocked, 0);

      const appliedOverride = overrides
        .filter((override) => override.date === date)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];

      const derivedAvailable = Math.max(0, roomType.totalUnits - reservedCount - blockedUnits);
      const availableUnits = appliedOverride
        ? Math.max(0, appliedOverride.newAvailableUnits)
        : derivedAvailable;

      return {
        date,
        totalUnits: roomType.totalUnits,
        reservedCount,
        blockedUnits,
        overrideUnits: appliedOverride?.newAvailableUnits,
        availableUnits,
      };
    });
  }

  private enumerateDates(from: string, to: string): string[] {
    if (to < from) {
      throw new BadRequestException('Invalid date range');
    }

    const dates: string[] = [];
    let cursor = from;
    while (cursor <= to) {
      dates.push(cursor);
      cursor = this.addDays(cursor, 1);
    }
    return dates;
  }

  private addDays(date: string, days: number): string {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date');
    }
    parsed.setUTCDate(parsed.getUTCDate() + days);
    return parsed.toISOString().slice(0, 10);
  }
}
