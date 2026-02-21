import {
  AuditLogRecord,
  ConfirmationRecord,
  DailyCloseReportRecord,
  DayControlRecord,
  DiscountRequestRecord,
  FinanceShiftHandoverRecord,
  FolioLineItemRecord,
  GuestRecord,
  HousekeepingTaskRecord,
  MaintenanceTicketRecord,
  MenuCategoryRecord,
  MenuItemRecord,
  IdempotentResponse,
  IdempotencyKeyInput,
  InventoryBlockRecord,
  InventoryOverrideRecord,
  InvoiceRecord,
  OwnerExceptionRecord,
  OwnerExportJobRecord,
  OwnerNoteRecord,
  SubscriptionPlanRecord,
  TenantFeatureFlagRecord,
  TenantRecord,
  TenantSubscriptionRecord,
  UserRecord,
  OverrideRequestRecord,
  PaymentRecord,
  PropertyRecord,
  RatePlanRecord,
  RefundRequestRecord,
  RefundExecutionRecord,
  KitchenOrderRecord,
  KitchenOrderItemRecord,
  QueueJobRecord,
  ReservationRecord,
  RoomRecord,
  RoomTypeRecord,
  ShiftHandoverRecord,
  StayRecord,
  UserPropertyAccessRecord,
  ImpersonationSessionRecord,
} from '../../tenancy/tenancy-store.service';

export interface CreateGuestInput {
  tenantId: string;
  propertyId: string;
  fullName: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface UpdateGuestInput {
  fullName?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface CreateReservationInput {
  reservation: ReservationRecord;
}

export interface UpdateReservationInput {
  reservation: ReservationRecord;
}

export interface CreateStayInput {
  stay: StayRecord;
}

export interface UpdateStayInput {
  stay: StayRecord;
}

export interface CreateHousekeepingTaskInput {
  task: HousekeepingTaskRecord;
}

export interface CreateShiftHandoverInput {
  handover: ShiftHandoverRecord;
}

export interface UpdateHousekeepingTaskInput {
  task: HousekeepingTaskRecord;
  expectedUpdatedAt?: string;
}

export interface CreateMaintenanceTicketInput {
  ticket: MaintenanceTicketRecord;
}

export interface UpdateMaintenanceTicketInput {
  ticket: MaintenanceTicketRecord;
}

export interface CreateConfirmationInput {
  confirmation: ConfirmationRecord;
}

export interface CreateAuditLogInput {
  auditLog: AuditLogRecord;
}

export interface CreateRatePlanInput {
  ratePlan: RatePlanRecord;
}

export interface UpdateRatePlanInput {
  ratePlan: RatePlanRecord;
}

export interface CreateMenuCategoryInput {
  category: MenuCategoryRecord;
}

export interface UpdateMenuCategoryInput {
  category: MenuCategoryRecord;
}

export interface CreateMenuItemInput {
  item: MenuItemRecord;
}

export interface UpdateMenuItemInput {
  item: MenuItemRecord;
}

export interface CreateKitchenOrderInput {
  order: KitchenOrderRecord;
}

export interface UpdateKitchenOrderInput {
  order: KitchenOrderRecord;
}

export interface CreateKitchenOrderItemInput {
  item: KitchenOrderItemRecord;
}

export interface CreateDiscountRequestInput {
  request: DiscountRequestRecord;
}

export interface UpdateDiscountRequestInput {
  request: DiscountRequestRecord;
}

export interface CreateRefundRequestInput {
  request: RefundRequestRecord;
}

export interface UpdateRefundRequestInput {
  request: RefundRequestRecord;
}

export interface CreateOverrideRequestInput {
  request: OverrideRequestRecord;
}

export interface UpdateOverrideRequestInput {
  request: OverrideRequestRecord;
}

export interface CreateFolioLineItemInput {
  lineItem: FolioLineItemRecord;
}

export interface CreateInvoiceInput {
  invoice: InvoiceRecord;
}

export interface UpdateInvoiceInput {
  invoice: InvoiceRecord;
}

export interface CreatePaymentInput {
  payment: PaymentRecord;
}

export interface UpdatePaymentInput {
  payment: PaymentRecord;
}

export interface CreateRefundExecutionInput {
  execution: RefundExecutionRecord;
}

export interface CreateDailyCloseReportInput {
  report: DailyCloseReportRecord;
}

export interface UpdateDailyCloseReportInput {
  report: DailyCloseReportRecord;
}

export interface CreateFinanceShiftHandoverInput {
  handover: FinanceShiftHandoverRecord;
}

export interface CreateInventoryBlockInput {
  block: InventoryBlockRecord;
}

export interface CreateInventoryOverrideInput {
  override: InventoryOverrideRecord;
}

export interface UpsertDayControlInput {
  control: DayControlRecord;
}

export interface CreateOwnerExceptionInput {
  exception: OwnerExceptionRecord;
}

export interface UpdateOwnerExceptionInput {
  exception: OwnerExceptionRecord;
}

export interface CreateOwnerNoteInput {
  note: OwnerNoteRecord;
}

export interface CreateOwnerExportJobInput {
  exportJob: OwnerExportJobRecord;
}

export interface UpdateOwnerExportJobInput {
  exportJob: OwnerExportJobRecord;
}

export interface CreateTenantInput {
  tenant: TenantRecord;
}

export interface UpdateTenantInput {
  tenant: TenantRecord;
}

export interface CreatePropertyInput {
  property: PropertyRecord;
}

export interface CreateUserInput {
  user: UserRecord;
}

export interface UpdateUserInput {
  user: UserRecord;
}

export interface CreateUserPropertyAccessInput {
  access: UserPropertyAccessRecord;
}

export interface UpsertUserPropertyAccessInput {
  access: UserPropertyAccessRecord;
}

export interface CreateSubscriptionPlanInput {
  plan: SubscriptionPlanRecord;
}

export interface UpdateSubscriptionPlanInput {
  plan: SubscriptionPlanRecord;
}

export interface CreateTenantSubscriptionInput {
  subscription: TenantSubscriptionRecord;
}

export interface UpdateTenantSubscriptionInput {
  subscription: TenantSubscriptionRecord;
}

export interface CreateTenantFeatureFlagInput {
  featureFlag: TenantFeatureFlagRecord;
}

export interface UpdateTenantFeatureFlagInput {
  featureFlag: TenantFeatureFlagRecord;
}

export interface CreateImpersonationSessionInput {
  session: ImpersonationSessionRecord;
}

export interface UpdateImpersonationSessionInput {
  session: ImpersonationSessionRecord;
}

export interface ReservationLookupQuery {
  tenantId: string;
  propertyId: string;
}

export interface StayLookupQuery {
  tenantId: string;
  propertyId: string;
}

export interface GuestLookupQuery {
  tenantId: string;
  propertyId: string;
}

export interface RoomLookupQuery {
  tenantId: string;
  propertyId: string;
}

export interface FrontDeskRepository {
  // tenancy + property scoping
  getTenant(tenantId: string): Promise<TenantRecord | undefined>;
  listTenants(query?: { status?: string }): Promise<TenantRecord[]>;
  createTenant(input: CreateTenantInput): Promise<TenantRecord>;
  updateTenant(input: UpdateTenantInput): Promise<TenantRecord>;
  isPropertyInTenant(tenantId: string, propertyId: string): Promise<boolean>;
  createProperty(input: CreatePropertyInput): Promise<PropertyRecord>;
  getProperty(tenantId: string, propertyId: string): Promise<PropertyRecord | undefined>;
  listPropertiesByTenant(tenantId: string): Promise<PropertyRecord[]>;
  createUser(input: CreateUserInput): Promise<UserRecord>;
  updateUser(input: UpdateUserInput): Promise<UserRecord>;
  getUserById(query: { tenantId: string; userId: string }): Promise<UserRecord | undefined>;
  getUserByIdGlobal(userId: string): Promise<UserRecord | undefined>;
  listUsersByTenant(query: {
    tenantId: string;
    status?: string;
  }): Promise<UserRecord[]>;
  createUserPropertyAccess(input: CreateUserPropertyAccessInput): Promise<UserPropertyAccessRecord>;
  upsertUserPropertyAccess(input: UpsertUserPropertyAccessInput): Promise<UserPropertyAccessRecord>;
  listUserPropertyAccess(query: {
    tenantId: string;
    userId: string;
  }): Promise<UserPropertyAccessRecord[]>;
  listSubscriptionPlans(query?: {
    isActive?: boolean;
  }): Promise<SubscriptionPlanRecord[]>;
  getSubscriptionPlanById(planId: string): Promise<SubscriptionPlanRecord | undefined>;
  createSubscriptionPlan(input: CreateSubscriptionPlanInput): Promise<SubscriptionPlanRecord>;
  updateSubscriptionPlan(input: UpdateSubscriptionPlanInput): Promise<SubscriptionPlanRecord>;
  createTenantSubscription(input: CreateTenantSubscriptionInput): Promise<TenantSubscriptionRecord>;
  updateTenantSubscription(input: UpdateTenantSubscriptionInput): Promise<TenantSubscriptionRecord>;
  getActiveTenantSubscription(
    tenantId: string,
  ): Promise<TenantSubscriptionRecord | undefined>;
  listTenantSubscriptions(tenantId: string): Promise<TenantSubscriptionRecord[]>;
  listTenantFeatureFlags(tenantId: string): Promise<TenantFeatureFlagRecord[]>;
  getTenantFeatureFlag(query: {
    tenantId: string;
    key: string;
  }): Promise<TenantFeatureFlagRecord | undefined>;
  createTenantFeatureFlag(
    input: CreateTenantFeatureFlagInput,
  ): Promise<TenantFeatureFlagRecord>;
  updateTenantFeatureFlag(
    input: UpdateTenantFeatureFlagInput,
  ): Promise<TenantFeatureFlagRecord>;
  createImpersonationSession(
    input: CreateImpersonationSessionInput,
  ): Promise<ImpersonationSessionRecord>;
  updateImpersonationSession(
    input: UpdateImpersonationSessionInput,
  ): Promise<ImpersonationSessionRecord>;
  getImpersonationSessionById(
    sessionId: string,
  ): Promise<ImpersonationSessionRecord | undefined>;
  listImpersonationSessions(query: {
    tenantId?: string;
    targetUserId?: string;
    status?: string;
    limit?: number;
  }): Promise<ImpersonationSessionRecord[]>;

  // guests
  searchGuests(query: GuestLookupQuery & { search?: string }): Promise<GuestRecord[]>;
  getGuestById(query: GuestLookupQuery & { guestId: string }): Promise<GuestRecord | undefined>;
  createGuest(input: CreateGuestInput): Promise<GuestRecord>;
  updateGuest(query: GuestLookupQuery & { guestId: string; patch: UpdateGuestInput }): Promise<GuestRecord | undefined>;

  // room metadata
  listRoomTypes(query: RoomLookupQuery): Promise<RoomTypeRecord[]>;
  getRoomType(query: RoomLookupQuery & { roomTypeId: string }): Promise<RoomTypeRecord | undefined>;
  listRooms(query: RoomLookupQuery): Promise<RoomRecord[]>;
  getRoom(query: RoomLookupQuery & { roomId: string }): Promise<RoomRecord | undefined>;
  updateRoom(room: RoomRecord): Promise<RoomRecord>;
  listRatePlans(query: RoomLookupQuery): Promise<RatePlanRecord[]>;
  getRatePlan(query: RoomLookupQuery & { ratePlanId: string }): Promise<RatePlanRecord | undefined>;
  createRatePlan(input: CreateRatePlanInput): Promise<RatePlanRecord>;
  updateRatePlan(input: UpdateRatePlanInput): Promise<RatePlanRecord>;
  listMenuCategories(query: RoomLookupQuery): Promise<MenuCategoryRecord[]>;
  getMenuCategory(query: RoomLookupQuery & { categoryId: string }): Promise<MenuCategoryRecord | undefined>;
  createMenuCategory(input: CreateMenuCategoryInput): Promise<MenuCategoryRecord>;
  updateMenuCategory(input: UpdateMenuCategoryInput): Promise<MenuCategoryRecord>;
  listMenuItems(query: RoomLookupQuery & { categoryId?: string }): Promise<MenuItemRecord[]>;
  getMenuItem(query: RoomLookupQuery & { itemId: string }): Promise<MenuItemRecord | undefined>;
  createMenuItem(input: CreateMenuItemInput): Promise<MenuItemRecord>;
  updateMenuItem(input: UpdateMenuItemInput): Promise<MenuItemRecord>;
  listKitchenOrders(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
    from?: string;
    to?: string;
    search?: string;
  }): Promise<KitchenOrderRecord[]>;
  getKitchenOrder(query: {
    tenantId: string;
    propertyId: string;
    orderId: string;
  }): Promise<KitchenOrderRecord | undefined>;
  createKitchenOrder(input: CreateKitchenOrderInput): Promise<KitchenOrderRecord>;
  updateKitchenOrder(input: UpdateKitchenOrderInput): Promise<KitchenOrderRecord>;
  listKitchenOrderItems(query: {
    tenantId: string;
    propertyId: string;
    orderId: string;
  }): Promise<KitchenOrderItemRecord[]>;
  createKitchenOrderItems(input: {
    tenantId: string;
    propertyId: string;
    items: KitchenOrderItemRecord[];
  }): Promise<KitchenOrderItemRecord[]>;
  deleteKitchenOrderItems(query: {
    tenantId: string;
    propertyId: string;
    orderId: string;
  }): Promise<void>;
  generateKitchenOrderCode(propertyId: string): Promise<string>;
  listInvoices(query: {
    tenantId: string;
    propertyId: string;
    search?: string;
    status?: string;
  }): Promise<InvoiceRecord[]>;
  getInvoice(query: {
    tenantId: string;
    propertyId: string;
    invoiceId: string;
  }): Promise<InvoiceRecord | undefined>;
  getOpenInvoiceByStay(query: {
    tenantId: string;
    propertyId: string;
    stayId: string;
  }): Promise<InvoiceRecord | undefined>;
  createInvoice(input: CreateInvoiceInput): Promise<InvoiceRecord>;
  updateInvoice(input: UpdateInvoiceInput): Promise<InvoiceRecord>;
  generateInvoiceNumber(propertyId: string): Promise<string>;

  // reservations
  listReservations(query: ReservationLookupQuery): Promise<ReservationRecord[]>;
  getReservation(query: ReservationLookupQuery & { reservationId: string }): Promise<ReservationRecord | undefined>;
  createReservation(input: CreateReservationInput): Promise<ReservationRecord>;
  updateReservation(input: UpdateReservationInput): Promise<ReservationRecord>;
  generateReservationCode(propertyId: string): Promise<string>;

  // stays + housekeeping
  listStays(query: StayLookupQuery): Promise<StayRecord[]>;
  getStay(query: StayLookupQuery & { stayId: string }): Promise<StayRecord | undefined>;
  createStay(input: CreateStayInput): Promise<StayRecord>;
  updateStay(input: UpdateStayInput): Promise<StayRecord>;
  createHousekeepingTask(input: CreateHousekeepingTaskInput): Promise<HousekeepingTaskRecord>;
  listHousekeepingTasks(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
    assignedUserId?: string;
    roomId?: string;
  }): Promise<HousekeepingTaskRecord[]>;
  getHousekeepingTask(query: {
    tenantId: string;
    propertyId: string;
    taskId: string;
  }): Promise<HousekeepingTaskRecord | undefined>;
  updateHousekeepingTask(
    input: UpdateHousekeepingTaskInput,
  ): Promise<HousekeepingTaskRecord | undefined>;
  getActiveHousekeepingTaskForRoom(query: {
    tenantId: string;
    propertyId: string;
    roomId: string;
  }): Promise<HousekeepingTaskRecord | undefined>;
  createMaintenanceTicket(input: CreateMaintenanceTicketInput): Promise<MaintenanceTicketRecord>;
  listMaintenanceTickets(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
    severity?: string;
    roomId?: string;
  }): Promise<MaintenanceTicketRecord[]>;
  getMaintenanceTicket(query: {
    tenantId: string;
    propertyId: string;
    ticketId: string;
  }): Promise<MaintenanceTicketRecord | undefined>;
  updateMaintenanceTicket(input: UpdateMaintenanceTicketInput): Promise<MaintenanceTicketRecord>;

  // handover
  createShiftHandover(input: CreateShiftHandoverInput): Promise<ShiftHandoverRecord>;
  listShiftHandovers(query: {
    tenantId: string;
    propertyId: string;
    userId?: string;
    shiftType?: string;
  }): Promise<ShiftHandoverRecord[]>;

  // messaging queue + confirmation tracking
  createConfirmation(input: CreateConfirmationInput): Promise<ConfirmationRecord>;
  listConfirmations(query: { tenantId: string; propertyId: string }): Promise<ConfirmationRecord[]>;
  enqueue(queue: string, name: string, payload: Record<string, unknown>): Promise<QueueJobRecord>;
  listQueueJobs(query?: {
    queue?: string;
    name?: string;
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<QueueJobRecord[]>;

  // approvals + financial adjustments
  listDiscountRequests(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
  }): Promise<DiscountRequestRecord[]>;
  getDiscountRequest(query: {
    tenantId: string;
    propertyId: string;
    requestId: string;
  }): Promise<DiscountRequestRecord | undefined>;
  createDiscountRequest(input: CreateDiscountRequestInput): Promise<DiscountRequestRecord>;
  updateDiscountRequest(input: UpdateDiscountRequestInput): Promise<DiscountRequestRecord>;

  listRefundRequests(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
  }): Promise<RefundRequestRecord[]>;
  getRefundRequest(query: {
    tenantId: string;
    propertyId: string;
    requestId: string;
  }): Promise<RefundRequestRecord | undefined>;
  createRefundRequest(input: CreateRefundRequestInput): Promise<RefundRequestRecord>;
  updateRefundRequest(input: UpdateRefundRequestInput): Promise<RefundRequestRecord>;

  listOverrideRequests(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
  }): Promise<OverrideRequestRecord[]>;
  getOverrideRequest(query: {
    tenantId: string;
    propertyId: string;
    requestId: string;
  }): Promise<OverrideRequestRecord | undefined>;
  createOverrideRequest(input: CreateOverrideRequestInput): Promise<OverrideRequestRecord>;
  updateOverrideRequest(input: UpdateOverrideRequestInput): Promise<OverrideRequestRecord>;

  createFolioLineItem(input: CreateFolioLineItemInput): Promise<FolioLineItemRecord>;
  listFolioLineItems(query: {
    tenantId: string;
    propertyId: string;
    invoiceId?: string;
    entityType?: string;
    entityId?: string;
  }): Promise<FolioLineItemRecord[]>;
  listPayments(query: {
    tenantId: string;
    propertyId: string;
    invoiceId?: string;
    date?: string;
  }): Promise<PaymentRecord[]>;
  getPayment(query: {
    tenantId: string;
    propertyId: string;
    paymentId: string;
  }): Promise<PaymentRecord | undefined>;
  createPayment(input: CreatePaymentInput): Promise<PaymentRecord>;
  updatePayment(input: UpdatePaymentInput): Promise<PaymentRecord>;
  getRefundExecutionByRequest(query: {
    tenantId: string;
    propertyId: string;
    refundRequestId: string;
  }): Promise<RefundExecutionRecord | undefined>;
  createRefundExecution(input: CreateRefundExecutionInput): Promise<RefundExecutionRecord>;

  // inventory manager controls
  listInventoryBlocks(query: {
    tenantId: string;
    propertyId: string;
    roomTypeId?: string;
    from?: string;
    to?: string;
  }): Promise<InventoryBlockRecord[]>;
  createInventoryBlock(input: CreateInventoryBlockInput): Promise<InventoryBlockRecord>;
  listInventoryOverrides(query: {
    tenantId: string;
    propertyId: string;
    roomTypeId?: string;
    from?: string;
    to?: string;
  }): Promise<InventoryOverrideRecord[]>;
  createInventoryOverride(input: CreateInventoryOverrideInput): Promise<InventoryOverrideRecord>;

  // day control
  getDayControl(query: {
    tenantId: string;
    propertyId: string;
    date: string;
  }): Promise<DayControlRecord | undefined>;
  upsertDayControl(input: UpsertDayControlInput): Promise<DayControlRecord>;
  listDailyCloseReports(query: {
    tenantId: string;
    propertyId: string;
    date?: string;
    limit?: number;
  }): Promise<DailyCloseReportRecord[]>;
  getDailyCloseReport(query: {
    tenantId: string;
    propertyId: string;
    date: string;
  }): Promise<DailyCloseReportRecord | undefined>;
  createDailyCloseReport(input: CreateDailyCloseReportInput): Promise<DailyCloseReportRecord>;
  updateDailyCloseReport(input: UpdateDailyCloseReportInput): Promise<DailyCloseReportRecord>;
  createFinanceShiftHandover(
    input: CreateFinanceShiftHandoverInput,
  ): Promise<FinanceShiftHandoverRecord>;
  listFinanceShiftHandovers(query: {
    tenantId: string;
    propertyId: string;
    userId?: string;
    shiftType?: string;
  }): Promise<FinanceShiftHandoverRecord[]>;

  // audit + idempotency
  createAuditLog(input: CreateAuditLogInput): Promise<AuditLogRecord>;
  listAuditLogs(query: {
    tenantId: string;
    propertyId: string;
    from?: string;
    to?: string;
    actorUserId?: string;
    action?: string;
    entityType?: string;
    limit?: number;
  }): Promise<AuditLogRecord[]>;
  listAuditLogsByTenant(query: {
    tenantId: string;
    propertyIds?: string[];
    from?: string;
    to?: string;
    actorUserId?: string;
    action?: string;
    entityType?: string;
    limit?: number;
  }): Promise<AuditLogRecord[]>;
  listAuditLogsGlobal(query: {
    tenantIds?: string[];
    from?: string;
    to?: string;
    actorUserId?: string;
    action?: string;
    entityType?: string;
    limit?: number;
  }): Promise<AuditLogRecord[]>;
  createOwnerException(input: CreateOwnerExceptionInput): Promise<OwnerExceptionRecord>;
  listOwnerExceptions(query: {
    tenantId: string;
    propertyIds?: string[];
    type?: string;
    severity?: string;
    from?: string;
    to?: string;
    acknowledged?: boolean;
    limit?: number;
  }): Promise<OwnerExceptionRecord[]>;
  getOwnerException(query: {
    tenantId: string;
    exceptionId: string;
  }): Promise<OwnerExceptionRecord | undefined>;
  updateOwnerException(input: UpdateOwnerExceptionInput): Promise<OwnerExceptionRecord>;
  createOwnerNote(input: CreateOwnerNoteInput): Promise<OwnerNoteRecord>;
  listOwnerNotes(query: {
    tenantId: string;
    exceptionId?: string;
    propertyIds?: string[];
    limit?: number;
  }): Promise<OwnerNoteRecord[]>;
  createOwnerExportJob(input: CreateOwnerExportJobInput): Promise<OwnerExportJobRecord>;
  listOwnerExportJobs(query: {
    tenantId: string;
    requestedByUserId?: string;
    status?: string;
    limit?: number;
  }): Promise<OwnerExportJobRecord[]>;
  getOwnerExportJob(query: {
    tenantId: string;
    exportJobId: string;
  }): Promise<OwnerExportJobRecord | undefined>;
  updateOwnerExportJob(input: UpdateOwnerExportJobInput): Promise<OwnerExportJobRecord>;
  buildIdempotencyCacheKey(input: IdempotencyKeyInput): string;
  getIdempotentResponse(cacheKey: string): Promise<IdempotentResponse | undefined>;
  setIdempotentResponse(cacheKey: string, response: IdempotentResponse): Promise<void>;
}

export const FRONT_DESK_REPOSITORY = Symbol('FRONT_DESK_REPOSITORY');
