import { Injectable } from '@nestjs/common';
import {
  ApprovalEntityType,
  ApprovalStatus,
  BookingSource,
  DailyCloseStatus,
  DepositStatus,
  DiscountType,
  ExceptionSeverity,
  FolioLineType,
  HousekeepingTaskStatus,
  MaintenanceSeverity,
  MaintenanceTicketStatus,
  OwnerExceptionType,
  OwnerExportFormat,
  OwnerExportStatus,
  OwnerExportType,
  ImpersonationStatus,
  SubscriptionPlanCode,
  OverrideType,
  PaymentMethod,
  PaymentStatus,
  ReservationStatus,
  RoomStatus,
  ShiftType,
  StayStatus,
} from '@meshva/contracts';
import { randomUUID } from 'crypto';

export interface TenantRecord {
  id: string;
  name: string;
  legalName?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  country?: string;
  state?: string;
  city?: string;
  timezone: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyRecord {
  id: string;
  tenantId: string;
  name: string;
  state: string;
  city: string;
  status: 'active' | 'inactive';
}

export interface UserRecord {
  id: string;
  tenantId: string;
  fullName: string;
  phone?: string;
  email?: string;
  passwordHash?: string;
  authProvider: 'password' | 'otp' | 'oauth';
  status: 'active' | 'disabled';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPropertyAccessRecord {
  id: string;
  tenantId: string;
  userId: string;
  propertyId: string;
  accessLevel: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomTypeRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  name: string;
  totalUnits: number;
}

export interface RatePlanRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  roomTypeId: string;
  name: string;
  baseRate: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  roomTypeId: string;
  roomNumber: string;
  status: RoomStatus;
}

export interface MenuCategoryRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  name: string;
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  categoryId: string;
  name: string;
  price: number;
  active: boolean;
  description?: string;
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KitchenOrderRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  code: string;
  stayId: string;
  roomId: string;
  status:
    | 'NEW'
    | 'ACCEPTED'
    | 'IN_PREP'
    | 'READY'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'CANCELLED_WITH_REASON';
  notes?: string;
  totalAmount: number;
  chargePostedAt?: string;
  chargeFolioLineItemId?: string;
  cancelledReason?: string;
  createdByUserId: string;
  updatedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KitchenOrderItemRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  itemNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuestRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  fullName: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  code: string;
  guestId: string;
  guestFullName: string;
  guestPhone?: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  source: BookingSource;
  notes?: string;
  noPhone: boolean;
  depositStatus: DepositStatus;
  status: ReservationStatus;
  cancelReason?: string;
  cancelNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountRequestRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  entityType: ApprovalEntityType.RESERVATION | ApprovalEntityType.STAY;
  entityId: string;
  discountType: DiscountType;
  value: number;
  reason: string;
  status: ApprovalStatus;
  requestedByUserId: string;
  approvedByUserId?: string;
  rejectedByUserId?: string;
  note?: string;
  rejectionReason?: string;
  appliedLineItemId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefundRequestRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  invoiceId: string;
  amount: number;
  reason: string;
  status: ApprovalStatus;
  requestedByUserId: string;
  approvedByUserId?: string;
  rejectedByUserId?: string;
  note?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OverrideRequestRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  overrideType: OverrideType;
  entityType: ApprovalEntityType;
  entityId: string;
  reason: string;
  requestedValue?: Record<string, unknown>;
  status: ApprovalStatus;
  requestedByUserId: string;
  approvedByUserId?: string;
  rejectedByUserId?: string;
  note?: string;
  rejectionReason?: string;
  overrideToken?: string;
  overrideTokenExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolioLineItemRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  invoiceId?: string;
  referenceOrderId?: string;
  entityType: 'RESERVATION' | 'STAY';
  entityId: string;
  lineType: FolioLineType;
  amount: number;
  currency: string;
  description: string;
  createdByUserId: string;
  createdAt: string;
}

export interface InvoiceRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  invoiceNumber: string;
  reservationId?: string;
  stayId?: string;
  guestId?: string;
  issuedOn: string;
  currency: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  invoiceId: string;
  method: PaymentMethod;
  amount: number;
  paymentType: 'PAYMENT' | 'REFUND';
  status: PaymentStatus;
  reference?: string;
  note?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefundExecutionRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  refundRequestId: string;
  paymentId: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  note?: string;
  executedByUserId: string;
  createdAt: string;
}

export interface DailyCloseReportRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  date: string;
  status: DailyCloseStatus;
  expectedCash: number;
  expectedTransfer: number;
  expectedPos: number;
  countedCash: number;
  countedTransfer: number;
  countedPos: number;
  varianceCash: number;
  varianceTransfer: number;
  variancePos: number;
  note?: string;
  closedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceShiftHandoverRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  userId: string;
  shiftType: ShiftType;
  cashOnHand: number;
  pendingRefunds: number;
  notes: string;
  createdAt: string;
}

export interface InventoryBlockRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  roomTypeId: string;
  fromDate: string;
  toDate: string;
  unitsBlocked: number;
  reason: string;
  createdByUserId: string;
  createdAt: string;
}

export interface InventoryOverrideRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  roomTypeId: string;
  date: string;
  newAvailableUnits: number;
  reason: string;
  createdByUserId: string;
  createdAt: string;
}

export interface DayControlRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  date: string;
  isLocked: boolean;
  unlockedByUserId?: string;
  unlockReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StayRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  reservationId: string;
  guestId: string;
  roomId?: string;
  idNumber?: string;
  status: StayStatus;
  checkInAt: string;
  plannedCheckOut: string;
  checkOutAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HousekeepingTaskRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  roomId: string;
  stayId?: string;
  status: HousekeepingTaskStatus;
  assignedUserId?: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface MaintenanceTicketRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  roomId: string;
  title: string;
  description: string;
  severity: MaintenanceSeverity;
  status: MaintenanceTicketStatus;
  photoUrl?: string;
  reportedByUserId: string;
  resolvedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface ShiftHandoverRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  userId: string;
  shiftType: ShiftType;
  notes: string;
  exceptions: string[];
  createdAt: string;
}

export interface ConfirmationRecord {
  id: string;
  tenantId: string;
  propertyId: string;
  entityType: 'RESERVATION' | 'STAY';
  entityId: string;
  template: string;
  channel: string;
  toPhone?: string;
  language?: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  tenantId: string;
  propertyId?: string;
  actorUserId?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface IdempotentResponse {
  statusCode: number;
  body: unknown;
}

export interface IdempotencyKeyInput {
  tenantId: string;
  propertyId?: string;
  userId: string;
  method: string;
  path: string;
  idempotencyKey: string;
}

export interface QueueJobRecord {
  id: string;
  queue: string;
  name: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface OwnerExceptionRecord {
  id: string;
  tenantId: string;
  propertyId?: string;
  type: OwnerExceptionType;
  severity: ExceptionSeverity;
  sourceAction: string;
  actorUserId?: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadataJson: Record<string, unknown>;
  acknowledgedByUserId?: string;
  acknowledgedAt?: string;
  dedupeKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerNoteRecord {
  id: string;
  tenantId: string;
  propertyId?: string;
  exceptionId: string;
  text: string;
  createdByUserId: string;
  createdAt: string;
}

export interface OwnerExportJobRecord {
  id: string;
  tenantId: string;
  requestedByUserId: string;
  exportType: OwnerExportType;
  format: OwnerExportFormat;
  fromDate: string;
  toDate: string;
  propertyIds: string[];
  filtersJson: Record<string, unknown>;
  status: OwnerExportStatus;
  downloadUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface SubscriptionPlanRecord {
  id: string;
  code: SubscriptionPlanCode;
  name: string;
  description?: string;
  propertyLimit: number;
  userLimit: number;
  featuresJson: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubscriptionRecord {
  id: string;
  tenantId: string;
  subscriptionPlanId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantFeatureFlagRecord {
  id: string;
  tenantId: string;
  key: string;
  enabled: boolean;
  configJson: Record<string, unknown>;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImpersonationSessionRecord {
  id: string;
  tenantId: string;
  targetUserId: string;
  token: string;
  status: ImpersonationStatus;
  startedByUserId: string;
  startedAt: string;
  expiresAt: string;
  endedAt?: string;
  endedByUserId?: string;
  reason?: string;
}

@Injectable()
export class TenancyStoreService {
  readonly tenants: TenantRecord[] = [];
  readonly properties: PropertyRecord[] = [];
  readonly users: UserRecord[] = [];
  readonly userPropertyAccess: UserPropertyAccessRecord[] = [];
  readonly roomTypes: RoomTypeRecord[] = [];
  readonly ratePlans: RatePlanRecord[] = [];
  readonly rooms: RoomRecord[] = [];
  readonly menuCategories: MenuCategoryRecord[] = [];
  readonly menuItems: MenuItemRecord[] = [];
  readonly kitchenOrders: KitchenOrderRecord[] = [];
  readonly kitchenOrderItems: KitchenOrderItemRecord[] = [];
  readonly guests: GuestRecord[] = [];
  readonly reservations: ReservationRecord[] = [];
  readonly discountRequests: DiscountRequestRecord[] = [];
  readonly refundRequests: RefundRequestRecord[] = [];
  readonly overrideRequests: OverrideRequestRecord[] = [];
  readonly invoices: InvoiceRecord[] = [];
  readonly folioLineItems: FolioLineItemRecord[] = [];
  readonly payments: PaymentRecord[] = [];
  readonly refundExecutions: RefundExecutionRecord[] = [];
  readonly inventoryBlocks: InventoryBlockRecord[] = [];
  readonly inventoryOverrides: InventoryOverrideRecord[] = [];
  readonly dayControls: DayControlRecord[] = [];
  readonly dailyCloseReports: DailyCloseReportRecord[] = [];
  readonly financeShiftHandovers: FinanceShiftHandoverRecord[] = [];
  readonly stays: StayRecord[] = [];
  readonly housekeepingTasks: HousekeepingTaskRecord[] = [];
  readonly maintenanceTickets: MaintenanceTicketRecord[] = [];
  readonly shiftHandovers: ShiftHandoverRecord[] = [];
  readonly confirmations: ConfirmationRecord[] = [];
  readonly auditLogs: AuditLogRecord[] = [];
  readonly queueJobs: QueueJobRecord[] = [];
  readonly ownerExceptions: OwnerExceptionRecord[] = [];
  readonly ownerNotes: OwnerNoteRecord[] = [];
  readonly ownerExportJobs: OwnerExportJobRecord[] = [];
  readonly subscriptionPlans: SubscriptionPlanRecord[] = [];
  readonly tenantSubscriptions: TenantSubscriptionRecord[] = [];
  readonly tenantFeatureFlags: TenantFeatureFlagRecord[] = [];
  readonly impersonationSessions: ImpersonationSessionRecord[] = [];

  private readonly idempotentResponses = new Map<string, IdempotentResponse>();
  private reservationCodeCounter = 1000;
  private invoiceNumberCounter = 5000;

  constructor() {
    this.seed();
  }

  isPropertyInTenant(tenantId: string, propertyId: string): boolean {
    return this.properties.some(
      (property) => property.id === propertyId && property.tenantId === tenantId,
    );
  }

  getTenant(tenantId: string): TenantRecord | undefined {
    return this.tenants.find((tenant) => tenant.id === tenantId);
  }

  getProperty(tenantId: string, propertyId: string): PropertyRecord | undefined {
    return this.properties.find(
      (property) => property.id === propertyId && property.tenantId === tenantId,
    );
  }

  getUser(tenantId: string, userId: string): UserRecord | undefined {
    return this.users.find((user) => user.id === userId && user.tenantId === tenantId);
  }

  getRoomType(tenantId: string, propertyId: string, roomTypeId: string): RoomTypeRecord | undefined {
    return this.roomTypes.find(
      (roomType) =>
        roomType.id === roomTypeId &&
        roomType.tenantId === tenantId &&
        roomType.propertyId === propertyId,
    );
  }

  getRoom(tenantId: string, propertyId: string, roomId: string): RoomRecord | undefined {
    return this.rooms.find(
      (room) => room.id === roomId && room.tenantId === tenantId && room.propertyId === propertyId,
    );
  }

  generateReservationCode(propertyId: string): string {
    this.reservationCodeCounter += 1;
    const suffix = propertyId.replace(/-/g, '').slice(0, 4).toUpperCase();
    return `RSV-${suffix}-${this.reservationCodeCounter}`;
  }

  generateInvoiceNumber(propertyId: string): string {
    this.invoiceNumberCounter += 1;
    const suffix = propertyId.replace(/-/g, '').slice(0, 4).toUpperCase();
    return `INV-${suffix}-${this.invoiceNumberCounter}`;
  }

  buildIdempotencyCacheKey(input: IdempotencyKeyInput): string {
    return [
      input.tenantId,
      input.propertyId ?? 'global',
      input.userId,
      input.method.toUpperCase(),
      input.path,
      input.idempotencyKey,
    ].join(':');
  }

  getIdempotentResponse(cacheKey: string): IdempotentResponse | undefined {
    return this.idempotentResponses.get(cacheKey);
  }

  setIdempotentResponse(cacheKey: string, response: IdempotentResponse): void {
    this.idempotentResponses.set(cacheKey, response);
  }

  enqueue(queue: string, name: string, payload: Record<string, unknown>): QueueJobRecord {
    const record: QueueJobRecord = {
      id: randomUUID(),
      queue,
      name,
      payload,
      createdAt: new Date().toISOString(),
    };

    this.queueJobs.push(record);
    return record;
  }

  private seed(): void {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const propertyId = '22222222-2222-2222-2222-222222222222';
    const propertyDutseId = '22222222-2222-2222-2222-222222222223';
    const roomTypeStandard = '33333333-3333-4333-8333-333333333333';
    const roomTypeDeluxe = '44444444-4444-4444-8444-444444444444';
    const roomTypeStandardDutse = '33333333-3333-4333-8333-333333333334';
    const roomTypeDeluxeDutse = '44444444-4444-4444-8444-444444444445';
    const frontDeskUserId = '70000000-0000-4000-8000-000000000001';
    const managerUserId = '70000000-0000-4000-8000-000000000002';
    const financeUserId = '70000000-0000-4000-8000-000000000003';
    const housekeepingUserId = '70000000-0000-4000-8000-000000000004';
    const ownerUserId = '70000000-0000-4000-8000-000000000005';
    const kitchenUserId = '70000000-0000-4000-8000-000000000007';
    const guestAminaId = '62000000-0000-4000-8000-000000000001';
    const guestKhalidId = '62000000-0000-4000-8000-000000000002';
    const reservationPendingId = '63000000-0000-4000-8000-000000000001';
    const reservationConfirmedId = '63000000-0000-4000-8000-000000000002';
    const invoiceId = '67000000-0000-4000-8000-000000000001';
    const kitchenStayId = '6d000000-0000-4000-8000-000000000001';
    const kitchenInvoiceId = '67000000-0000-4000-8000-000000000003';
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const nextTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const createdAt = now.toISOString();

    this.tenants.push({
      id: tenantId,
      name: 'Meshva Hospitality Group',
      primaryEmail: 'owner@meshva.com',
      primaryPhone: '+2348000000000',
      country: 'NG',
      state: 'Kano',
      city: 'Kano',
      timezone: 'Africa/Lagos',
      status: 'active',
      createdAt,
      updatedAt: createdAt,
    });

    this.properties.push({
      id: propertyId,
      tenantId,
      name: 'Meshva Central Kano',
      state: 'Kano',
      city: 'Kano',
      status: 'active',
    });

    this.properties.push({
      id: propertyDutseId,
      tenantId,
      name: 'Meshva Dutse Suites',
      state: 'Jigawa',
      city: 'Dutse',
      status: 'active',
    });

    this.users.push(
      {
        id: frontDeskUserId,
        tenantId,
        fullName: 'Front Desk Agent',
        email: 'frontdesk@meshva.com',
        authProvider: 'otp',
        status: 'active',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: managerUserId,
        tenantId,
        fullName: 'Hotel Manager',
        email: 'manager@meshva.com',
        authProvider: 'otp',
        status: 'active',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: financeUserId,
        tenantId,
        fullName: 'Finance Cashier',
        email: 'finance@meshva.com',
        authProvider: 'otp',
        status: 'active',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: housekeepingUserId,
        tenantId,
        fullName: 'Housekeeping Attendant',
        email: 'housekeeping@meshva.com',
        authProvider: 'otp',
        status: 'active',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: ownerUserId,
        tenantId,
        fullName: 'Portfolio Owner',
        email: 'owner@meshva.com',
        authProvider: 'otp',
        status: 'active',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: kitchenUserId,
        tenantId,
        fullName: 'Kitchen Staff',
        email: 'kitchen@meshva.com',
        authProvider: 'otp',
        status: 'active',
        createdAt,
        updatedAt: createdAt,
      },
    );

    this.userPropertyAccess.push(
      {
        id: '71000000-0000-4000-8000-000000000001',
        tenantId,
        userId: frontDeskUserId,
        propertyId,
        accessLevel: 'operate',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '71000000-0000-4000-8000-000000000002',
        tenantId,
        userId: managerUserId,
        propertyId,
        accessLevel: 'manage',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '71000000-0000-4000-8000-000000000003',
        tenantId,
        userId: financeUserId,
        propertyId,
        accessLevel: 'operate',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '71000000-0000-4000-8000-000000000004',
        tenantId,
        userId: housekeepingUserId,
        propertyId,
        accessLevel: 'operate',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '71000000-0000-4000-8000-000000000005',
        tenantId,
        userId: ownerUserId,
        propertyId,
        accessLevel: 'manage',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '71000000-0000-4000-8000-000000000006',
        tenantId,
        userId: ownerUserId,
        propertyId: propertyDutseId,
        accessLevel: 'manage',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '71000000-0000-4000-8000-000000000007',
        tenantId,
        userId: kitchenUserId,
        propertyId,
        accessLevel: 'operate',
        createdAt,
        updatedAt: createdAt,
      },
    );

    this.roomTypes.push(
      {
        id: roomTypeStandard,
        tenantId,
        propertyId,
        name: 'Standard',
        totalUnits: 5,
      },
      {
        id: roomTypeDeluxe,
        tenantId,
        propertyId,
        name: 'Deluxe',
        totalUnits: 3,
      },
      {
        id: roomTypeStandardDutse,
        tenantId,
        propertyId: propertyDutseId,
        name: 'Standard',
        totalUnits: 4,
      },
      {
        id: roomTypeDeluxeDutse,
        tenantId,
        propertyId: propertyDutseId,
        name: 'Deluxe',
        totalUnits: 2,
      },
    );

    this.rooms.push(
      {
        id: '50000000-0000-4000-8000-000000000001',
        tenantId,
        propertyId,
        roomTypeId: roomTypeStandard,
        roomNumber: '101',
        status: RoomStatus.VACANT_READY,
      },
      {
        id: '50000000-0000-4000-8000-000000000002',
        tenantId,
        propertyId,
        roomTypeId: roomTypeStandard,
        roomNumber: '102',
        status: RoomStatus.VACANT_READY,
      },
      {
        id: '50000000-0000-4000-8000-000000000003',
        tenantId,
        propertyId,
        roomTypeId: roomTypeStandard,
        roomNumber: '103',
        status: RoomStatus.VACANT_READY,
      },
      {
        id: '50000000-0000-4000-8000-000000000004',
        tenantId,
        propertyId,
        roomTypeId: roomTypeStandard,
        roomNumber: '104',
        status: RoomStatus.VACANT_READY,
      },
      {
        id: '50000000-0000-4000-8000-000000000005',
        tenantId,
        propertyId,
        roomTypeId: roomTypeStandard,
        roomNumber: '105',
        status: RoomStatus.VACANT_READY,
      },
      {
        id: '50000000-0000-4000-8000-000000000006',
        tenantId,
        propertyId,
        roomTypeId: roomTypeDeluxe,
        roomNumber: '201',
        status: RoomStatus.VACANT_READY,
      },
      {
        id: '50000000-0000-4000-8000-000000000007',
        tenantId,
        propertyId,
        roomTypeId: roomTypeDeluxe,
        roomNumber: '202',
        status: RoomStatus.VACANT_READY,
      },
      {
        id: '50000000-0000-4000-8000-000000000008',
        tenantId,
        propertyId,
        roomTypeId: roomTypeDeluxe,
        roomNumber: '203',
        status: RoomStatus.VACANT_READY,
      },
      {
        id: '50000000-0000-4000-8000-000000000009',
        tenantId,
        propertyId: propertyDutseId,
        roomTypeId: roomTypeStandardDutse,
        roomNumber: '101',
        status: RoomStatus.VACANT_READY,
      },
      {
        id: '50000000-0000-4000-8000-000000000010',
        tenantId,
        propertyId: propertyDutseId,
        roomTypeId: roomTypeStandardDutse,
        roomNumber: '102',
        status: RoomStatus.VACANT_READY,
      },
      {
        id: '50000000-0000-4000-8000-000000000011',
        tenantId,
        propertyId: propertyDutseId,
        roomTypeId: roomTypeDeluxeDutse,
        roomNumber: '201',
        status: RoomStatus.VACANT_READY,
      },
    );

    this.ratePlans.push(
      {
        id: '61000000-0000-4000-8000-000000000001',
        tenantId,
        propertyId,
        roomTypeId: roomTypeStandard,
        name: 'Standard Rack',
        baseRate: 42000,
        currency: 'NGN',
        effectiveFrom: today,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '61000000-0000-4000-8000-000000000002',
        tenantId,
        propertyId,
        roomTypeId: roomTypeDeluxe,
        name: 'Deluxe Rack',
        baseRate: 65000,
        currency: 'NGN',
        effectiveFrom: today,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '61000000-0000-4000-8000-000000000003',
        tenantId,
        propertyId: propertyDutseId,
        roomTypeId: roomTypeStandardDutse,
        name: 'Standard Rack',
        baseRate: 38000,
        currency: 'NGN',
        effectiveFrom: today,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '61000000-0000-4000-8000-000000000004',
        tenantId,
        propertyId: propertyDutseId,
        roomTypeId: roomTypeDeluxeDutse,
        name: 'Deluxe Rack',
        baseRate: 52000,
        currency: 'NGN',
        effectiveFrom: today,
        createdAt,
        updatedAt: createdAt,
      },
    );

    this.guests.push(
      {
        id: guestAminaId,
        tenantId,
        propertyId,
        fullName: 'Amina Yusuf',
        phone: '+2348011111111',
        email: 'amina@example.com',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: guestKhalidId,
        tenantId,
        propertyId,
        fullName: 'Khalid Musa',
        phone: '+2348022222222',
        createdAt,
        updatedAt: createdAt,
      },
    );

    this.reservations.push(
      {
        id: reservationPendingId,
        tenantId,
        propertyId,
        code: 'RSV-2222-2001',
        guestId: guestAminaId,
        guestFullName: 'Amina Yusuf',
        guestPhone: '+2348011111111',
        roomTypeId: roomTypeStandard,
        checkIn: tomorrow,
        checkOut: nextWeek,
        adults: 1,
        children: 0,
        source: BookingSource.CALL,
        noPhone: false,
        depositStatus: DepositStatus.PROMISED,
        status: ReservationStatus.PENDING_CONFIRM,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: reservationConfirmedId,
        tenantId,
        propertyId,
        code: 'RSV-2222-2002',
        guestId: guestKhalidId,
        guestFullName: 'Khalid Musa',
        guestPhone: '+2348022222222',
        roomTypeId: roomTypeDeluxe,
        checkIn: nextWeek,
        checkOut: nextTwoWeeks,
        adults: 2,
        children: 1,
        source: BookingSource.WHATSAPP,
        noPhone: false,
        depositStatus: DepositStatus.NONE,
        status: ReservationStatus.CONFIRMED,
        createdAt,
        updatedAt: createdAt,
      },
    );

    const kitchenOccupiedRoom = this.rooms.find(
      (room) => room.id === '50000000-0000-4000-8000-000000000006',
    );
    if (kitchenOccupiedRoom) {
      kitchenOccupiedRoom.status = RoomStatus.OCCUPIED;
    }

    this.stays.push({
      id: kitchenStayId,
      tenantId,
      propertyId,
      reservationId: reservationConfirmedId,
      guestId: guestKhalidId,
      roomId: '50000000-0000-4000-8000-000000000006',
      status: StayStatus.OPEN,
      checkInAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      plannedCheckOut: nextWeek,
      notes: 'Demo open stay for kitchen workflow',
      createdAt,
      updatedAt: createdAt,
    });

    this.discountRequests.push({
      id: '64000000-0000-4000-8000-000000000001',
      tenantId,
      propertyId,
      entityType: ApprovalEntityType.RESERVATION,
      entityId: reservationConfirmedId,
      discountType: DiscountType.AMOUNT,
      value: 5000,
      reason: 'Loyal guest discount',
      status: ApprovalStatus.REQUESTED,
      requestedByUserId: frontDeskUserId,
      createdAt,
      updatedAt: createdAt,
    });

    this.overrideRequests.push({
      id: '65000000-0000-4000-8000-000000000001',
      tenantId,
      propertyId,
      overrideType: OverrideType.EXTEND_CONFLICT,
      entityType: ApprovalEntityType.RESERVATION,
      entityId: reservationConfirmedId,
      reason: 'VIP extension request despite limited inventory',
      status: ApprovalStatus.REQUESTED,
      requestedByUserId: frontDeskUserId,
      createdAt,
      updatedAt: createdAt,
    });

    this.invoices.push({
      id: invoiceId,
      tenantId,
      propertyId,
      invoiceNumber: 'INV-2222-5001',
      reservationId: reservationConfirmedId,
      guestId: guestKhalidId,
      issuedOn: today,
      currency: 'NGN',
      status: 'OPEN',
      createdAt,
      updatedAt: createdAt,
    });

    this.invoices.push({
      id: kitchenInvoiceId,
      tenantId,
      propertyId,
      invoiceNumber: 'INV-2222-5003',
      reservationId: reservationConfirmedId,
      stayId: kitchenStayId,
      guestId: guestKhalidId,
      issuedOn: today,
      currency: 'NGN',
      status: 'OPEN',
      createdAt,
      updatedAt: createdAt,
    });

    this.menuCategories.push(
      {
        id: '6e000000-0000-4000-8000-000000000001',
        tenantId,
        propertyId,
        name: 'Main Meals',
        createdByUserId: kitchenUserId,
        updatedByUserId: kitchenUserId,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '6e000000-0000-4000-8000-000000000002',
        tenantId,
        propertyId,
        name: 'Drinks',
        createdByUserId: kitchenUserId,
        updatedByUserId: kitchenUserId,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '6e000000-0000-4000-8000-000000000003',
        tenantId,
        propertyId,
        name: 'Desserts',
        createdByUserId: kitchenUserId,
        updatedByUserId: kitchenUserId,
        createdAt,
        updatedAt: createdAt,
      },
    );

    this.menuItems.push(
      {
        id: '6f000000-0000-4000-8000-000000000001',
        tenantId,
        propertyId,
        categoryId: '6e000000-0000-4000-8000-000000000001',
        name: 'Jollof Rice + Chicken',
        price: 8500,
        active: true,
        description: 'Kitchen signature jollof with grilled chicken.',
        createdByUserId: kitchenUserId,
        updatedByUserId: kitchenUserId,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '6f000000-0000-4000-8000-000000000002',
        tenantId,
        propertyId,
        categoryId: '6e000000-0000-4000-8000-000000000001',
        name: 'Beef Suya Plate',
        price: 7200,
        active: true,
        description: 'Northern style beef suya with onions.',
        createdByUserId: kitchenUserId,
        updatedByUserId: kitchenUserId,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '6f000000-0000-4000-8000-000000000003',
        tenantId,
        propertyId,
        categoryId: '6e000000-0000-4000-8000-000000000002',
        name: 'Bottled Water',
        price: 800,
        active: true,
        description: '50cl table water',
        createdByUserId: kitchenUserId,
        updatedByUserId: kitchenUserId,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '6f000000-0000-4000-8000-000000000004',
        tenantId,
        propertyId,
        categoryId: '6e000000-0000-4000-8000-000000000003',
        name: 'Chocolate Cake Slice',
        price: 2200,
        active: true,
        description: 'Freshly baked cake slice.',
        createdByUserId: kitchenUserId,
        updatedByUserId: kitchenUserId,
        createdAt,
        updatedAt: createdAt,
      },
    );

    this.kitchenOrders.push(
      {
        id: '70010000-0000-4000-8000-000000000001',
        tenantId,
        propertyId,
        code: 'K-1001',
        stayId: kitchenStayId,
        roomId: '50000000-0000-4000-8000-000000000006',
        status: 'NEW',
        notes: 'No pepper',
        totalAmount: 10100,
        createdByUserId: kitchenUserId,
        updatedByUserId: kitchenUserId,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '70010000-0000-4000-8000-000000000002',
        tenantId,
        propertyId,
        code: 'K-1002',
        stayId: kitchenStayId,
        roomId: '50000000-0000-4000-8000-000000000006',
        status: 'IN_PREP',
        notes: 'Extra spice',
        totalAmount: 7200,
        createdByUserId: kitchenUserId,
        updatedByUserId: kitchenUserId,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '70010000-0000-4000-8000-000000000003',
        tenantId,
        propertyId,
        code: 'K-1003',
        stayId: kitchenStayId,
        roomId: '50000000-0000-4000-8000-000000000006',
        status: 'DELIVERED',
        totalAmount: 5000,
        chargePostedAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        chargeFolioLineItemId: '70030000-0000-4000-8000-000000000001',
        createdByUserId: kitchenUserId,
        updatedByUserId: kitchenUserId,
        createdAt,
        updatedAt: createdAt,
      },
    );

    this.kitchenOrderItems.push(
      {
        id: '70020000-0000-4000-8000-000000000001',
        tenantId,
        propertyId,
        orderId: '70010000-0000-4000-8000-000000000001',
        menuItemId: '6f000000-0000-4000-8000-000000000001',
        menuItemName: 'Jollof Rice + Chicken',
        quantity: 1,
        unitPrice: 8500,
        lineTotal: 8500,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '70020000-0000-4000-8000-000000000002',
        tenantId,
        propertyId,
        orderId: '70010000-0000-4000-8000-000000000001',
        menuItemId: '6f000000-0000-4000-8000-000000000003',
        menuItemName: 'Bottled Water',
        quantity: 2,
        unitPrice: 800,
        lineTotal: 1600,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '70020000-0000-4000-8000-000000000003',
        tenantId,
        propertyId,
        orderId: '70010000-0000-4000-8000-000000000002',
        menuItemId: '6f000000-0000-4000-8000-000000000002',
        menuItemName: 'Beef Suya Plate',
        quantity: 1,
        unitPrice: 7200,
        lineTotal: 7200,
        itemNote: 'Extra spice',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '70020000-0000-4000-8000-000000000004',
        tenantId,
        propertyId,
        orderId: '70010000-0000-4000-8000-000000000003',
        menuItemId: '6f000000-0000-4000-8000-000000000003',
        menuItemName: 'Bottled Water',
        quantity: 1,
        unitPrice: 800,
        lineTotal: 800,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '70020000-0000-4000-8000-000000000005',
        tenantId,
        propertyId,
        orderId: '70010000-0000-4000-8000-000000000003',
        menuItemId: '6f000000-0000-4000-8000-000000000002',
        menuItemName: 'Beef Suya Plate',
        quantity: 1,
        unitPrice: 4200,
        lineTotal: 4200,
        createdAt,
        updatedAt: createdAt,
      },
    );

    this.folioLineItems.push(
      {
        id: '68000000-0000-4000-8000-000000000001',
        tenantId,
        propertyId,
        invoiceId,
        entityType: 'RESERVATION',
        entityId: reservationConfirmedId,
        lineType: FolioLineType.CHARGE,
        amount: 65000,
        currency: 'NGN',
        description: 'Room charge - Deluxe Rack',
        createdByUserId: frontDeskUserId,
        createdAt,
      },
      {
        id: '68000000-0000-4000-8000-000000000002',
        tenantId,
        propertyId,
        invoiceId,
        entityType: 'RESERVATION',
        entityId: reservationConfirmedId,
        lineType: FolioLineType.KITCHEN_CHARGE,
        amount: 12000,
        currency: 'NGN',
        description: 'Kitchen charge - room service',
        createdByUserId: frontDeskUserId,
        createdAt,
      },
      {
        id: '70030000-0000-4000-8000-000000000001',
        tenantId,
        propertyId,
        invoiceId: kitchenInvoiceId,
        referenceOrderId: '70010000-0000-4000-8000-000000000003',
        entityType: 'STAY',
        entityId: kitchenStayId,
        lineType: FolioLineType.KITCHEN_CHARGE,
        amount: 5000,
        currency: 'NGN',
        description: 'Kitchen Order #K-1003',
        createdByUserId: kitchenUserId,
        createdAt,
      },
    );

    this.payments.push({
      id: '69000000-0000-4000-8000-000000000001',
      tenantId,
      propertyId,
      invoiceId,
      method: PaymentMethod.CASH,
      amount: 30000,
      paymentType: 'PAYMENT',
      status: PaymentStatus.RECORDED,
      note: 'Initial deposit collected',
      createdByUserId: managerUserId,
      createdAt,
      updatedAt: createdAt,
    });

    this.invoices.push({
      id: '67000000-0000-4000-8000-000000000002',
      tenantId,
      propertyId: propertyDutseId,
      invoiceNumber: 'INV-2223-5002',
      issuedOn: today,
      currency: 'NGN',
      status: 'OPEN',
      createdAt,
      updatedAt: createdAt,
    });

    this.folioLineItems.push({
      id: '68000000-0000-4000-8000-000000000003',
      tenantId,
      propertyId: propertyDutseId,
      invoiceId: '67000000-0000-4000-8000-000000000002',
      entityType: 'RESERVATION',
      entityId: reservationPendingId,
      lineType: FolioLineType.CHARGE,
      amount: 38000,
      currency: 'NGN',
      description: 'Room charge - Standard Rack',
      createdByUserId: managerUserId,
      createdAt,
    });

    this.payments.push({
      id: '69000000-0000-4000-8000-000000000002',
      tenantId,
      propertyId: propertyDutseId,
      invoiceId: '67000000-0000-4000-8000-000000000002',
      method: PaymentMethod.BANK_TRANSFER,
      amount: 20000,
      paymentType: 'PAYMENT',
      status: PaymentStatus.RECORDED,
      note: 'Transfer deposit',
      createdByUserId: financeUserId,
      createdAt,
      updatedAt: createdAt,
    });

    this.refundRequests.push({
      id: '66000000-0000-4000-8000-000000000001',
      tenantId,
      propertyId,
      invoiceId,
      amount: 10000,
      reason: 'Duplicate transfer reversal request',
      status: ApprovalStatus.REQUESTED,
      requestedByUserId: managerUserId,
      createdAt,
      updatedAt: createdAt,
    });

    this.maintenanceTickets.push({
      id: '6b000000-0000-4000-8000-000000000001',
      tenantId,
      propertyId,
      roomId: '50000000-0000-4000-8000-000000000001',
      title: 'Loose shower handle',
      description: 'Shower handle in room 101 is loose and needs tightening.',
      severity: MaintenanceSeverity.MEDIUM,
      status: MaintenanceTicketStatus.OPEN,
      reportedByUserId: frontDeskUserId,
      createdAt,
      updatedAt: createdAt,
    });

    this.dailyCloseReports.push(
      {
        id: '6c000000-0000-4000-8000-000000000001',
        tenantId,
        propertyId,
        date: today,
        status: DailyCloseStatus.LOCKED,
        expectedCash: 30000,
        expectedTransfer: 0,
        expectedPos: 0,
        countedCash: 29800,
        countedTransfer: 0,
        countedPos: 0,
        varianceCash: -200,
        varianceTransfer: 0,
        variancePos: 0,
        closedByUserId: financeUserId,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '6c000000-0000-4000-8000-000000000002',
        tenantId,
        propertyId: propertyDutseId,
        date: today,
        status: DailyCloseStatus.LOCKED,
        expectedCash: 0,
        expectedTransfer: 20000,
        expectedPos: 0,
        countedCash: 0,
        countedTransfer: 20000,
        countedPos: 0,
        varianceCash: 0,
        varianceTransfer: 0,
        variancePos: 0,
        closedByUserId: financeUserId,
        createdAt,
        updatedAt: createdAt,
      },
    );

    this.dayControls.push(
      {
        id: '6d000000-0000-4000-8000-000000000001',
        tenantId,
        propertyId,
        date: today,
        isLocked: true,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '6d000000-0000-4000-8000-000000000002',
        tenantId,
        propertyId: propertyDutseId,
        date: today,
        isLocked: true,
        createdAt,
        updatedAt: createdAt,
      },
    );

    this.ownerExceptions.push(
      {
        id: '6e000000-0000-4000-8000-000000000001',
        tenantId,
        propertyId,
        type: OwnerExceptionType.DAILY_CLOSE_VARIANCE,
        severity: ExceptionSeverity.AMBER,
        sourceAction: 'DAILY_CLOSE_COMPLETED',
        actorUserId: financeUserId,
        entityType: 'DailyCloseReport',
        entityId: '6c000000-0000-4000-8000-000000000001',
        summary: 'Daily close variance detected on cash reconciliation.',
        metadataJson: {
          varianceCash: -200,
          varianceTransfer: 0,
          variancePos: 0,
          date: today,
        },
        createdAt,
        updatedAt: createdAt,
        dedupeKey: `DAILY_CLOSE_VARIANCE:${propertyId}:${today}`,
      },
      {
        id: '6e000000-0000-4000-8000-000000000002',
        tenantId,
        propertyId,
        type: OwnerExceptionType.DAY_UNLOCKED,
        severity: ExceptionSeverity.RED,
        sourceAction: 'DAY_UNLOCKED_BY_MANAGER',
        actorUserId: managerUserId,
        entityType: 'DayControl',
        entityId: '6d000000-0000-4000-8000-000000000001',
        summary: 'Manager unlocked a closed financial day.',
        metadataJson: {
          reason: 'Correction for late transfer posting',
          date: today,
        },
        createdAt,
        updatedAt: createdAt,
        dedupeKey: `DAY_UNLOCKED:${propertyId}:${today}`,
      },
    );

    this.subscriptionPlans.push(
      {
        id: '72000000-0000-4000-8000-000000000001',
        code: SubscriptionPlanCode.STARTER,
        name: 'Starter',
        propertyLimit: 1,
        userLimit: 10,
        featuresJson: {
          kitchen_enabled: false,
          advanced_reporting_enabled: false,
          owner_notes_enabled: false,
        },
        isActive: true,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '72000000-0000-4000-8000-000000000002',
        code: SubscriptionPlanCode.STANDARD,
        name: 'Standard',
        propertyLimit: 3,
        userLimit: 40,
        featuresJson: {
          kitchen_enabled: true,
          advanced_reporting_enabled: false,
          owner_notes_enabled: true,
        },
        isActive: true,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '72000000-0000-4000-8000-000000000003',
        code: SubscriptionPlanCode.PRO,
        name: 'Pro',
        propertyLimit: 25,
        userLimit: 300,
        featuresJson: {
          kitchen_enabled: true,
          advanced_reporting_enabled: true,
          owner_notes_enabled: true,
        },
        isActive: true,
        createdAt,
        updatedAt: createdAt,
      },
    );

    this.tenantSubscriptions.push({
      id: '73000000-0000-4000-8000-000000000001',
      tenantId,
      subscriptionPlanId: '72000000-0000-4000-8000-000000000002',
      effectiveFrom: today,
      status: 'ACTIVE',
      createdByUserId: ownerUserId,
      createdAt,
      updatedAt: createdAt,
    });

    this.tenantFeatureFlags.push(
      {
        id: '74000000-0000-4000-8000-000000000001',
        tenantId,
        key: 'kitchen_enabled',
        enabled: true,
        configJson: {},
        updatedByUserId: ownerUserId,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '74000000-0000-4000-8000-000000000002',
        tenantId,
        key: 'advanced_reporting_enabled',
        enabled: false,
        configJson: {},
        updatedByUserId: ownerUserId,
        createdAt,
        updatedAt: createdAt,
      },
    );
  }
}
