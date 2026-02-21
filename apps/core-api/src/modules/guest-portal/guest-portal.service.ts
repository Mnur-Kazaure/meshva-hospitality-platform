import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingSource,
  CancelReason,
  DepositStatus,
  FrontDeskEvents,
  ReservationStatus,
} from '@meshva/contracts';
import { AppRequest } from '../../common/types/request-context';
import { assertValidDateRange } from '../../common/utils/date-range';
import { AuditService } from '../audit/audit.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';
import { CancelReservationDto } from '../reservations/dto/cancel-reservation.dto';
import { UpdateReservationDto } from '../reservations/dto/update-reservation.dto';
import { ReservationsService } from '../reservations/reservations.service';
import { CreateGuestBookingDto } from './dto/create-guest-booking.dto';
import { CancelGuestBookingDto } from './dto/cancel-guest-booking.dto';
import { ModifyGuestBookingDto } from './dto/modify-guest-booking.dto';
import { PublicSearchDto } from './dto/public-search.dto';
import { UpdateGuestProfileDto } from './dto/update-guest-profile.dto';

interface GuestIdentity {
  phone?: string;
  email?: string;
}

interface OwnedReservationContext {
  reservation: Awaited<ReturnType<FrontDeskRepository['listReservations']>>[number];
  property: Awaited<ReturnType<FrontDeskRepository['listPropertiesByTenant']>>[number];
}

const GUEST_MUTATION_BLOCK_HOURS = 24;

@Injectable()
export class GuestPortalService {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
    private readonly inventoryService: InventoryService,
    private readonly reservationsService: ReservationsService,
    private readonly auditService: AuditService,
  ) {}

  async search(request: AppRequest, query: PublicSearchDto) {
    assertValidDateRange(query.checkIn, query.checkOut);

    const properties = await this.repository.listPropertiesByTenant(request.context.tenantId);
    const matchedProperties = properties.filter((property) =>
      this.matchesLocation(property, query.location),
    );

    const rows = [] as Array<{
      propertyId: string;
      propertyName: string;
      state: string;
      city: string;
      availableRoomTypes: Array<{
        roomTypeId: string;
        roomTypeName: string;
        availableUnits: number;
        startingPrice?: number;
      }>;
    }>;

    for (const property of matchedProperties) {
      const roomTypes = await this.repository.listRoomTypes({
        tenantId: request.context.tenantId,
        propertyId: property.id,
      });
      const ratePlans = await this.repository.listRatePlans({
        tenantId: request.context.tenantId,
        propertyId: property.id,
      });

      const availableRoomTypes = [] as Array<{
        roomTypeId: string;
        roomTypeName: string;
        availableUnits: number;
        startingPrice?: number;
      }>;

      for (const roomType of roomTypes) {
        const availability = await this.inventoryService.checkAvailability({
          tenantId: request.context.tenantId,
          propertyId: property.id,
          roomTypeId: roomType.id,
          checkIn: query.checkIn,
          checkOut: query.checkOut,
        });

        const availableUnits = availability.availableUnits;
        if (availableUnits <= 0) {
          continue;
        }

        availableRoomTypes.push({
          roomTypeId: roomType.id,
          roomTypeName: roomType.name,
          availableUnits,
          startingPrice: this.resolveStartingPrice(
            ratePlans,
            roomType.id,
            query.checkIn,
            query.checkOut,
          ),
        });
      }

      if (availableRoomTypes.length === 0) {
        continue;
      }

      rows.push({
        propertyId: property.id,
        propertyName: property.name,
        state: property.state,
        city: property.city,
        availableRoomTypes,
      });
    }

    return {
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      count: rows.length,
      rows,
    };
  }

  async getPropertyDetails(request: AppRequest, propertyId: string) {
    const property = await this.repository.getProperty(request.context.tenantId, propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const [roomTypes, ratePlans] = await Promise.all([
      this.repository.listRoomTypes({
        tenantId: request.context.tenantId,
        propertyId,
      }),
      this.repository.listRatePlans({
        tenantId: request.context.tenantId,
        propertyId,
      }),
    ]);

    return {
      property: {
        id: property.id,
        name: property.name,
        state: property.state,
        city: property.city,
      },
      photos: [],
      amenities: [],
      roomTypes: roomTypes.map((roomType) => ({
        id: roomType.id,
        name: roomType.name,
        totalUnits: roomType.totalUnits,
        startingPrice: this.resolveStartingPrice(ratePlans, roomType.id),
      })),
      policies: {
        checkInTime: '14:00',
        checkOutTime: '12:00',
        cancellation: `Free cancellation up to ${GUEST_MUTATION_BLOCK_HOURS} hours before check-in`,
      },
    };
  }

  async createBooking(request: AppRequest, dto: CreateGuestBookingDto) {
    const property = await this.repository.getProperty(request.context.tenantId, dto.propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const existingGuest = await this.findGuestByPhone(request.context.tenantId, dto.propertyId, dto.phone);

    const created = await this.reservationsService.create(dto.propertyId, this.asGuestRequest(request), {
      guest: {
        guestId: existingGuest?.id,
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
      },
      roomTypeId: dto.roomTypeId,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      adults: dto.adults,
      children: dto.children,
      source: BookingSource.ONLINE,
      notes: dto.specialRequest,
      depositStatus: DepositStatus.NONE,
      status: ReservationStatus.CONFIRMED,
    });

    await this.repository.enqueue('reporting', 'reporting.guest-booking-created', {
      tenantId: request.context.tenantId,
      propertyId: dto.propertyId,
      reservationId: created.id,
      source: BookingSource.ONLINE,
    });

    return {
      reservationId: created.id,
      confirmationCode: created.code,
      summary: {
        propertyId: dto.propertyId,
        roomTypeId: created.roomTypeId,
        checkIn: created.checkIn,
        checkOut: created.checkOut,
        fullName: created.guestFullName,
        phone: created.guestPhone,
        status: created.status,
        paymentPolicy: 'PAY_AT_HOTEL',
      },
    };
  }

  async listBookings(request: AppRequest) {
    const owned = await this.collectOwnedReservations(request);
    const today = new Date().toISOString().slice(0, 10);

    const mapped = await Promise.all(
      owned.map(async (item) => ({
        reservationId: item.reservation.id,
        confirmationCode: item.reservation.code,
        propertyId: item.property.id,
        propertyName: item.property.name,
        checkIn: item.reservation.checkIn,
        checkOut: item.reservation.checkOut,
        status: item.reservation.status,
        outstandingBalance: await this.computeOutstandingBalance(
          request.context.tenantId,
          item.property.id,
          item.reservation.id,
        ),
      })),
    );

    const upcoming = mapped
      .filter((reservation) => reservation.checkOut >= today)
      .sort((a, b) => (a.checkIn > b.checkIn ? 1 : -1));
    const history = mapped
      .filter((reservation) => reservation.checkOut < today)
      .sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1));

    return {
      upcoming,
      history,
    };
  }

  async getBookingDetails(request: AppRequest, reservationId: string) {
    const owned = await this.getOwnedReservationOrThrow(request, reservationId);

    return {
      reservation: owned.reservation,
      property: {
        id: owned.property.id,
        name: owned.property.name,
        state: owned.property.state,
        city: owned.property.city,
      },
      canModify: this.canGuestMutateReservation(owned.reservation),
      canCancel: this.canGuestMutateReservation(owned.reservation),
      cancellationPolicy: `Modify/cancel must be at least ${GUEST_MUTATION_BLOCK_HOURS} hours before check-in`,
      outstandingBalance: await this.computeOutstandingBalance(
        request.context.tenantId,
        owned.property.id,
        owned.reservation.id,
      ),
    };
  }

  async modifyBooking(request: AppRequest, reservationId: string, dto: ModifyGuestBookingDto) {
    const owned = await this.getOwnedReservationOrThrow(request, reservationId);
    this.assertGuestCanMutateReservation(owned.reservation, 'modify');

    const updatePayload: UpdateReservationDto = {
      checkIn: dto.newCheckIn,
      checkOut: dto.newCheckOut,
      adults: dto.adults,
      children: dto.children,
    };

    const updated = await this.reservationsService.update(
      owned.property.id,
      reservationId,
      this.asGuestRequest(request),
      updatePayload,
    );

    return {
      reservationId: updated.id,
      confirmationCode: updated.code,
      status: updated.status,
      checkIn: updated.checkIn,
      checkOut: updated.checkOut,
      adults: updated.adults,
      children: updated.children,
    };
  }

  async cancelBooking(request: AppRequest, reservationId: string, dto: CancelGuestBookingDto) {
    const owned = await this.getOwnedReservationOrThrow(request, reservationId);
    this.assertGuestCanMutateReservation(owned.reservation, 'cancel');

    const cancelPayload: CancelReservationDto = {
      reason: CancelReason.GUEST_REQUEST,
      notes: dto.reason,
    };

    const cancelled = await this.reservationsService.cancel(
      owned.property.id,
      reservationId,
      this.asGuestRequest(request),
      cancelPayload,
    );

    return {
      reservationId: cancelled.id,
      confirmationCode: cancelled.code,
      status: cancelled.status,
      cancelReason: cancelled.cancelReason,
    };
  }

  async getProfile(request: AppRequest) {
    const owned = await this.collectOwnedReservations(request);
    const latest = [...owned].sort((a, b) =>
      a.reservation.updatedAt < b.reservation.updatedAt ? 1 : -1,
    )[0];

    if (!latest) {
      const identity = this.getGuestIdentity(request, true);
      return {
        fullName: null,
        phone: identity.phone,
        email: identity.email,
      };
    }

    const guest = await this.repository.getGuestById({
      tenantId: request.context.tenantId,
      propertyId: latest.property.id,
      guestId: latest.reservation.guestId,
    });

    if (!guest) {
      throw new NotFoundException('Guest profile not found');
    }

    return {
      fullName: guest.fullName,
      phone: guest.phone,
      email: guest.email,
    };
  }

  async updateProfile(request: AppRequest, dto: UpdateGuestProfileDto) {
    if (!dto.fullName && !dto.phone && !dto.email) {
      throw new BadRequestException('At least one profile field must be provided');
    }

    const owned = await this.collectOwnedReservations(request);
    if (owned.length === 0) {
      throw new NotFoundException('No guest profile found for current identity');
    }

    const uniqueGuests = new Map<string, { propertyId: string; guestId: string }>();
    for (const item of owned) {
      const key = `${item.property.id}:${item.reservation.guestId}`;
      if (!uniqueGuests.has(key)) {
        uniqueGuests.set(key, {
          propertyId: item.property.id,
          guestId: item.reservation.guestId,
        });
      }
    }

    for (const match of uniqueGuests.values()) {
      await this.repository.updateGuest({
        tenantId: request.context.tenantId,
        propertyId: match.propertyId,
        guestId: match.guestId,
        patch: {
          fullName: dto.fullName,
          phone: dto.phone,
          email: dto.email,
        },
      });
    }

    await this.auditService.recordMutation(
      {
        ...request.context,
        role: 'Guest',
      },
      {
        action: FrontDeskEvents.GUEST_PROFILE_UPDATED,
        entityType: 'GuestProfile',
        entityId: request.context.userId,
        afterJson: {
          fullName: dto.fullName,
          phone: dto.phone,
          email: dto.email,
          updatedGuestRecords: uniqueGuests.size,
        },
      },
    );

    return this.getProfile(request);
  }

  private async collectOwnedReservations(request: AppRequest): Promise<OwnedReservationContext[]> {
    const identity = this.getGuestIdentity(request, true);
    const properties = await this.repository.listPropertiesByTenant(request.context.tenantId);
    const guestCache = new Map<
      string,
      Awaited<ReturnType<FrontDeskRepository['getGuestById']>>
    >();
    const owned: OwnedReservationContext[] = [];

    for (const property of properties) {
      const reservations = await this.repository.listReservations({
        tenantId: request.context.tenantId,
        propertyId: property.id,
      });

      for (const reservation of reservations) {
        if (await this.isOwnedByIdentity(request.context.tenantId, property.id, reservation, identity, guestCache)) {
          owned.push({ reservation, property });
        }
      }
    }

    return owned;
  }

  private async getOwnedReservationOrThrow(request: AppRequest, reservationId: string) {
    const owned = await this.collectOwnedReservations(request);
    const match = owned.find((item) => item.reservation.id === reservationId);
    if (!match) {
      throw new NotFoundException('Booking not found for guest identity');
    }

    return match;
  }

  private getGuestIdentity(request: AppRequest, strict = false): GuestIdentity {
    const phoneHeader = this.readHeader(request.headers['x-guest-phone']);
    const emailHeader = this.readHeader(request.headers['x-guest-email']);

    const identity: GuestIdentity = {
      phone: this.normalizePhone(phoneHeader),
      email: emailHeader?.trim().toLowerCase(),
    };

    if (strict && !identity.phone && !identity.email) {
      throw new BadRequestException('x-guest-phone or x-guest-email header is required');
    }

    return identity;
  }

  private readHeader(header: string | string[] | undefined): string | undefined {
    if (typeof header === 'string') {
      return header;
    }

    if (Array.isArray(header)) {
      return header[0];
    }

    return undefined;
  }

  private normalizePhone(phone: string | undefined): string | undefined {
    if (!phone) {
      return undefined;
    }

    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length > 0 ? digitsOnly : undefined;
  }

  private async isOwnedByIdentity(
    tenantId: string,
    propertyId: string,
    reservation: OwnedReservationContext['reservation'],
    identity: GuestIdentity,
    guestCache: Map<string, Awaited<ReturnType<FrontDeskRepository['getGuestById']>>>,
  ): Promise<boolean> {
    if (identity.phone) {
      const reservationPhone = this.normalizePhone(reservation.guestPhone);
      if (reservationPhone && reservationPhone === identity.phone) {
        return true;
      }
    }

    if (!identity.email) {
      return false;
    }

    const cacheKey = `${propertyId}:${reservation.guestId}`;
    let guest = guestCache.get(cacheKey);
    if (guest === undefined) {
      guest = await this.repository.getGuestById({
        tenantId,
        propertyId,
        guestId: reservation.guestId,
      });
      guestCache.set(cacheKey, guest);
    }

    return guest?.email?.trim().toLowerCase() === identity.email;
  }

  private matchesLocation(
    property: Awaited<ReturnType<FrontDeskRepository['listPropertiesByTenant']>>[number],
    location?: string,
  ): boolean {
    if (!location) {
      return true;
    }

    const term = location.trim().toLowerCase();
    if (!term) {
      return true;
    }

    return (
      property.name.toLowerCase().includes(term) ||
      property.state.toLowerCase().includes(term) ||
      property.city.toLowerCase().includes(term)
    );
  }

  private resolveStartingPrice(
    ratePlans: Awaited<ReturnType<FrontDeskRepository['listRatePlans']>>,
    roomTypeId: string,
    checkIn?: string,
    checkOut?: string,
  ): number | undefined {
    const eligible = ratePlans
      .filter((plan) => {
        if (plan.roomTypeId !== roomTypeId) {
          return false;
        }

        if (!checkIn || !checkOut) {
          return true;
        }

        const startsBeforeOrOnCheckIn = plan.effectiveFrom <= checkIn;
        const endsOnOrAfterCheckout =
          plan.effectiveTo === undefined || plan.effectiveTo >= checkOut;
        return startsBeforeOrOnCheckIn && endsOnOrAfterCheckout;
      })
      .map((plan) => plan.baseRate);

    if (eligible.length === 0) {
      return undefined;
    }

    return Number(Math.min(...eligible).toFixed(2));
  }

  private asGuestRequest(request: AppRequest): AppRequest {
    request.context.role = 'Guest';
    return request;
  }

  private canGuestMutateReservation(
    reservation: OwnedReservationContext['reservation'],
  ): boolean {
    if (![ReservationStatus.CONFIRMED, ReservationStatus.PENDING_CONFIRM].includes(reservation.status)) {
      return false;
    }

    const hoursUntilCheckIn = this.hoursUntilCheckIn(reservation.checkIn);
    return hoursUntilCheckIn >= GUEST_MUTATION_BLOCK_HOURS;
  }

  private assertGuestCanMutateReservation(
    reservation: OwnedReservationContext['reservation'],
    action: 'modify' | 'cancel',
  ): void {
    if (![ReservationStatus.CONFIRMED, ReservationStatus.PENDING_CONFIRM].includes(reservation.status)) {
      throw new ConflictException(`Booking cannot be ${action}d in current status`);
    }

    const hoursUntilCheckIn = this.hoursUntilCheckIn(reservation.checkIn);
    if (hoursUntilCheckIn < GUEST_MUTATION_BLOCK_HOURS) {
      throw new BadRequestException(
        `Booking ${action} is only allowed ${GUEST_MUTATION_BLOCK_HOURS}h before check-in`,
      );
    }
  }

  private hoursUntilCheckIn(checkInDate: string): number {
    const now = new Date();
    const checkIn = new Date(`${checkInDate}T00:00:00.000Z`);
    return (checkIn.getTime() - now.getTime()) / (60 * 60 * 1000);
  }

  private async findGuestByPhone(
    tenantId: string,
    propertyId: string,
    phone: string,
  ) {
    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) {
      return undefined;
    }

    const guests = await this.repository.searchGuests({
      tenantId,
      propertyId,
      search: phone,
    });

    return guests.find((guest) => this.normalizePhone(guest.phone) === normalizedPhone);
  }

  private async computeOutstandingBalance(
    tenantId: string,
    propertyId: string,
    reservationId: string,
  ): Promise<number> {
    const invoices = await this.repository.listInvoices({
      tenantId,
      propertyId,
    });

    const invoice = invoices.find((item) => item.reservationId === reservationId);
    if (!invoice) {
      return 0;
    }

    const [lineItems, payments] = await Promise.all([
      this.repository.listFolioLineItems({
        tenantId,
        propertyId,
        invoiceId: invoice.id,
      }),
      this.repository.listPayments({
        tenantId,
        propertyId,
        invoiceId: invoice.id,
      }),
    ]);

    const totalCharges = lineItems.reduce((sum, lineItem) => sum + lineItem.amount, 0);
    const netPayments = payments.reduce((sum, payment) => {
      if (payment.paymentType === 'REFUND') {
        return sum - payment.amount;
      }
      return sum + payment.amount;
    }, 0);

    return Number(Math.max(0, totalCharges - netPayments).toFixed(2));
  }
}
