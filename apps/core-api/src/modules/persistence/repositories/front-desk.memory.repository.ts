import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
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
  InventoryBlockRecord,
  InventoryOverrideRecord,
  InvoiceRecord,
  MaintenanceTicketRecord,
  MenuCategoryRecord,
  MenuItemRecord,
  OwnerExceptionRecord,
  OwnerExportJobRecord,
  OwnerNoteRecord,
  SubscriptionPlanRecord,
  TenantFeatureFlagRecord,
  TenantRecord,
  TenantSubscriptionRecord,
  UserRecord,
  ImpersonationSessionRecord,
  OverrideRequestRecord,
  PaymentRecord,
  PropertyRecord,
  QueueJobRecord,
  RatePlanRecord,
  ReservationRecord,
  RefundRequestRecord,
  RefundExecutionRecord,
  KitchenOrderRecord,
  KitchenOrderItemRecord,
  RoomRecord,
  RoomTypeRecord,
  ShiftHandoverRecord,
  StayRecord,
  TenancyStoreService,
  UserPropertyAccessRecord,
} from '../../tenancy/tenancy-store.service';
import {
  CreateAuditLogInput,
  CreateConfirmationInput,
  CreateDailyCloseReportInput,
  CreateDiscountRequestInput,
  CreateFinanceShiftHandoverInput,
  CreateFolioLineItemInput,
  CreateGuestInput,
  CreateHousekeepingTaskInput,
  CreateInventoryBlockInput,
  CreateInventoryOverrideInput,
  CreateInvoiceInput,
  CreateMaintenanceTicketInput,
  CreateOwnerExceptionInput,
  CreateOwnerExportJobInput,
  CreateOwnerNoteInput,
  CreatePropertyInput,
  CreateSubscriptionPlanInput,
  CreateTenantFeatureFlagInput,
  CreateTenantInput,
  CreateTenantSubscriptionInput,
  CreateUserInput,
  CreateUserPropertyAccessInput,
  CreateImpersonationSessionInput,
  CreateOverrideRequestInput,
  CreatePaymentInput,
  CreateRatePlanInput,
  CreateMenuCategoryInput,
  CreateMenuItemInput,
  CreateKitchenOrderInput,
  CreateReservationInput,
  CreateRefundRequestInput,
  CreateShiftHandoverInput,
  CreateStayInput,
  FrontDeskRepository,
  GuestLookupQuery,
  ReservationLookupQuery,
  RoomLookupQuery,
  StayLookupQuery,
  UpdateDiscountRequestInput,
  UpdateDailyCloseReportInput,
  UpdateGuestInput,
  UpdateInvoiceInput,
  UpdateMaintenanceTicketInput,
  UpdateOwnerExceptionInput,
  UpdateOwnerExportJobInput,
  UpdateSubscriptionPlanInput,
  UpdateTenantFeatureFlagInput,
  UpdateTenantInput,
  UpdateTenantSubscriptionInput,
  UpdateUserInput,
  UpdateImpersonationSessionInput,
  UpsertUserPropertyAccessInput,
  UpdateOverrideRequestInput,
  UpdatePaymentInput,
  UpdateRatePlanInput,
  UpdateMenuCategoryInput,
  UpdateMenuItemInput,
  UpdateKitchenOrderInput,
  UpdateReservationInput,
  UpdateRefundRequestInput,
  UpdateHousekeepingTaskInput,
  UpdateStayInput,
  UpsertDayControlInput,
  CreateRefundExecutionInput,
} from './front-desk.repository';

@Injectable()
export class FrontDeskMemoryRepository implements FrontDeskRepository {
  constructor(private readonly tenancyStore: TenancyStoreService) {}

  async getTenant(tenantId: string): Promise<TenantRecord | undefined> {
    return this.tenancyStore.getTenant(tenantId);
  }

  async listTenants(query?: { status?: string }): Promise<TenantRecord[]> {
    return this.tenancyStore.tenants
      .filter((tenant) => !query?.status || tenant.status === query.status)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createTenant(input: CreateTenantInput): Promise<TenantRecord> {
    this.tenancyStore.tenants.push(input.tenant);
    return input.tenant;
  }

  async updateTenant(input: UpdateTenantInput): Promise<TenantRecord> {
    const index = this.tenancyStore.tenants.findIndex((tenant) => tenant.id === input.tenant.id);
    if (index >= 0) {
      this.tenancyStore.tenants[index] = input.tenant;
    }
    return input.tenant;
  }

  async isPropertyInTenant(tenantId: string, propertyId: string): Promise<boolean> {
    return this.tenancyStore.isPropertyInTenant(tenantId, propertyId);
  }

  async createProperty(input: CreatePropertyInput): Promise<PropertyRecord> {
    this.tenancyStore.properties.push(input.property);
    return input.property;
  }

  async getProperty(tenantId: string, propertyId: string): Promise<PropertyRecord | undefined> {
    return this.tenancyStore.getProperty(tenantId, propertyId);
  }

  async listPropertiesByTenant(tenantId: string): Promise<PropertyRecord[]> {
    return this.tenancyStore.properties.filter((property) => property.tenantId === tenantId);
  }

  async listUserPropertyAccess(query: {
    tenantId: string;
    userId: string;
  }): Promise<UserPropertyAccessRecord[]> {
    return this.tenancyStore.userPropertyAccess.filter(
      (access) => access.tenantId === query.tenantId && access.userId === query.userId,
    );
  }

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    this.tenancyStore.users.push(input.user);
    return input.user;
  }

  async updateUser(input: UpdateUserInput): Promise<UserRecord> {
    const index = this.tenancyStore.users.findIndex(
      (user) => user.id === input.user.id && user.tenantId === input.user.tenantId,
    );
    if (index >= 0) {
      this.tenancyStore.users[index] = input.user;
    }
    return input.user;
  }

  async getUserById(query: { tenantId: string; userId: string }): Promise<UserRecord | undefined> {
    return this.tenancyStore.users.find(
      (user) => user.id === query.userId && user.tenantId === query.tenantId,
    );
  }

  async getUserByIdGlobal(userId: string): Promise<UserRecord | undefined> {
    return this.tenancyStore.users.find((user) => user.id === userId);
  }

  async listUsersByTenant(query: {
    tenantId: string;
    status?: string;
  }): Promise<UserRecord[]> {
    return this.tenancyStore.users
      .filter((user) => {
        if (user.tenantId !== query.tenantId) {
          return false;
        }

        if (query.status && user.status !== query.status) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async createUserPropertyAccess(
    input: CreateUserPropertyAccessInput,
  ): Promise<UserPropertyAccessRecord> {
    this.tenancyStore.userPropertyAccess.push(input.access);
    return input.access;
  }

  async upsertUserPropertyAccess(
    input: UpsertUserPropertyAccessInput,
  ): Promise<UserPropertyAccessRecord> {
    const index = this.tenancyStore.userPropertyAccess.findIndex(
      (access) =>
        access.tenantId === input.access.tenantId &&
        access.userId === input.access.userId &&
        access.propertyId === input.access.propertyId,
    );
    if (index >= 0) {
      this.tenancyStore.userPropertyAccess[index] = input.access;
    } else {
      this.tenancyStore.userPropertyAccess.push(input.access);
    }
    return input.access;
  }

  async listSubscriptionPlans(query?: {
    isActive?: boolean;
  }): Promise<SubscriptionPlanRecord[]> {
    return this.tenancyStore.subscriptionPlans
      .filter((plan) => query?.isActive == null || plan.isActive === query.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getSubscriptionPlanById(planId: string): Promise<SubscriptionPlanRecord | undefined> {
    return this.tenancyStore.subscriptionPlans.find((plan) => plan.id === planId);
  }

  async createSubscriptionPlan(input: CreateSubscriptionPlanInput): Promise<SubscriptionPlanRecord> {
    this.tenancyStore.subscriptionPlans.push(input.plan);
    return input.plan;
  }

  async updateSubscriptionPlan(input: UpdateSubscriptionPlanInput): Promise<SubscriptionPlanRecord> {
    const index = this.tenancyStore.subscriptionPlans.findIndex(
      (plan) => plan.id === input.plan.id,
    );
    if (index >= 0) {
      this.tenancyStore.subscriptionPlans[index] = input.plan;
    }
    return input.plan;
  }

  async createTenantSubscription(
    input: CreateTenantSubscriptionInput,
  ): Promise<TenantSubscriptionRecord> {
    this.tenancyStore.tenantSubscriptions.push(input.subscription);
    return input.subscription;
  }

  async updateTenantSubscription(
    input: UpdateTenantSubscriptionInput,
  ): Promise<TenantSubscriptionRecord> {
    const index = this.tenancyStore.tenantSubscriptions.findIndex(
      (subscription) => subscription.id === input.subscription.id,
    );
    if (index >= 0) {
      this.tenancyStore.tenantSubscriptions[index] = input.subscription;
    }
    return input.subscription;
  }

  async getActiveTenantSubscription(
    tenantId: string,
  ): Promise<TenantSubscriptionRecord | undefined> {
    return this.tenancyStore.tenantSubscriptions.find(
      (subscription) => subscription.tenantId === tenantId && subscription.status === 'ACTIVE',
    );
  }

  async listTenantSubscriptions(tenantId: string): Promise<TenantSubscriptionRecord[]> {
    return this.tenancyStore.tenantSubscriptions
      .filter((subscription) => subscription.tenantId === tenantId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async listTenantFeatureFlags(tenantId: string): Promise<TenantFeatureFlagRecord[]> {
    return this.tenancyStore.tenantFeatureFlags
      .filter((flag) => flag.tenantId === tenantId)
      .sort((a, b) => a.key.localeCompare(b.key));
  }

  async getTenantFeatureFlag(query: {
    tenantId: string;
    key: string;
  }): Promise<TenantFeatureFlagRecord | undefined> {
    return this.tenancyStore.tenantFeatureFlags.find(
      (flag) => flag.tenantId === query.tenantId && flag.key === query.key,
    );
  }

  async createTenantFeatureFlag(
    input: CreateTenantFeatureFlagInput,
  ): Promise<TenantFeatureFlagRecord> {
    this.tenancyStore.tenantFeatureFlags.push(input.featureFlag);
    return input.featureFlag;
  }

  async updateTenantFeatureFlag(
    input: UpdateTenantFeatureFlagInput,
  ): Promise<TenantFeatureFlagRecord> {
    const index = this.tenancyStore.tenantFeatureFlags.findIndex(
      (flag) => flag.id === input.featureFlag.id,
    );
    if (index >= 0) {
      this.tenancyStore.tenantFeatureFlags[index] = input.featureFlag;
    }
    return input.featureFlag;
  }

  async createImpersonationSession(
    input: CreateImpersonationSessionInput,
  ): Promise<ImpersonationSessionRecord> {
    this.tenancyStore.impersonationSessions.push(input.session);
    return input.session;
  }

  async updateImpersonationSession(
    input: UpdateImpersonationSessionInput,
  ): Promise<ImpersonationSessionRecord> {
    const index = this.tenancyStore.impersonationSessions.findIndex(
      (session) => session.id === input.session.id,
    );
    if (index >= 0) {
      this.tenancyStore.impersonationSessions[index] = input.session;
    }
    return input.session;
  }

  async getImpersonationSessionById(
    sessionId: string,
  ): Promise<ImpersonationSessionRecord | undefined> {
    return this.tenancyStore.impersonationSessions.find((session) => session.id === sessionId);
  }

  async listImpersonationSessions(query: {
    tenantId?: string;
    targetUserId?: string;
    status?: string;
    limit?: number;
  }): Promise<ImpersonationSessionRecord[]> {
    return this.tenancyStore.impersonationSessions
      .filter((session) => {
        if (query.tenantId && session.tenantId !== query.tenantId) {
          return false;
        }

        if (query.targetUserId && session.targetUserId !== query.targetUserId) {
          return false;
        }

        if (query.status && session.status !== query.status) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
      .slice(0, query.limit ?? 100);
  }

  async searchGuests(query: GuestLookupQuery & { search?: string }): Promise<GuestRecord[]> {
    const term = query.search?.toLowerCase().trim();

    return this.tenancyStore.guests.filter((guest) => {
      if (guest.tenantId !== query.tenantId || guest.propertyId !== query.propertyId) {
        return false;
      }

      if (!term) {
        return true;
      }

      return (
        guest.fullName.toLowerCase().includes(term) ||
        guest.phone?.toLowerCase().includes(term) ||
        guest.email?.toLowerCase().includes(term)
      );
    });
  }

  async getGuestById(query: GuestLookupQuery & { guestId: string }): Promise<GuestRecord | undefined> {
    return this.tenancyStore.guests.find(
      (guest) =>
        guest.id === query.guestId &&
        guest.tenantId === query.tenantId &&
        guest.propertyId === query.propertyId,
    );
  }

  async createGuest(input: CreateGuestInput): Promise<GuestRecord> {
    const now = new Date().toISOString();
    const guest: GuestRecord = {
      id: randomUUID(),
      tenantId: input.tenantId,
      propertyId: input.propertyId,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    this.tenancyStore.guests.push(guest);
    return guest;
  }

  async updateGuest(
    query: GuestLookupQuery & { guestId: string; patch: UpdateGuestInput },
  ): Promise<GuestRecord | undefined> {
    const guest = await this.getGuestById(query);
    if (!guest) {
      return undefined;
    }

    guest.fullName = query.patch.fullName ?? guest.fullName;
    guest.phone = query.patch.phone ?? guest.phone;
    guest.email = query.patch.email ?? guest.email;
    guest.notes = query.patch.notes ?? guest.notes;
    guest.updatedAt = new Date().toISOString();

    return guest;
  }

  async listRoomTypes(query: RoomLookupQuery): Promise<RoomTypeRecord[]> {
    return this.tenancyStore.roomTypes.filter(
      (item) => item.tenantId === query.tenantId && item.propertyId === query.propertyId,
    );
  }

  async getRoomType(
    query: RoomLookupQuery & { roomTypeId: string },
  ): Promise<RoomTypeRecord | undefined> {
    return this.tenancyStore.getRoomType(query.tenantId, query.propertyId, query.roomTypeId);
  }

  async listRooms(query: RoomLookupQuery): Promise<RoomRecord[]> {
    return this.tenancyStore.rooms.filter(
      (room) => room.tenantId === query.tenantId && room.propertyId === query.propertyId,
    );
  }

  async getRoom(query: RoomLookupQuery & { roomId: string }): Promise<RoomRecord | undefined> {
    return this.tenancyStore.getRoom(query.tenantId, query.propertyId, query.roomId);
  }

  async updateRoom(room: RoomRecord): Promise<RoomRecord> {
    return room;
  }

  async listRatePlans(query: RoomLookupQuery): Promise<RatePlanRecord[]> {
    return this.tenancyStore.ratePlans
      .filter((ratePlan) => ratePlan.tenantId === query.tenantId && ratePlan.propertyId === query.propertyId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getRatePlan(
    query: RoomLookupQuery & { ratePlanId: string },
  ): Promise<RatePlanRecord | undefined> {
    return this.tenancyStore.ratePlans.find(
      (ratePlan) =>
        ratePlan.id === query.ratePlanId &&
        ratePlan.tenantId === query.tenantId &&
        ratePlan.propertyId === query.propertyId,
    );
  }

  async createRatePlan(input: CreateRatePlanInput): Promise<RatePlanRecord> {
    this.tenancyStore.ratePlans.push(input.ratePlan);
    return input.ratePlan;
  }

  async updateRatePlan(input: UpdateRatePlanInput): Promise<RatePlanRecord> {
    return input.ratePlan;
  }

  async listMenuCategories(query: RoomLookupQuery): Promise<MenuCategoryRecord[]> {
    return this.tenancyStore.menuCategories
      .filter(
        (category) =>
          category.tenantId === query.tenantId && category.propertyId === query.propertyId,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getMenuCategory(
    query: RoomLookupQuery & { categoryId: string },
  ): Promise<MenuCategoryRecord | undefined> {
    return this.tenancyStore.menuCategories.find(
      (category) =>
        category.id === query.categoryId &&
        category.tenantId === query.tenantId &&
        category.propertyId === query.propertyId,
    );
  }

  async createMenuCategory(input: CreateMenuCategoryInput): Promise<MenuCategoryRecord> {
    this.tenancyStore.menuCategories.push(input.category);
    return input.category;
  }

  async updateMenuCategory(input: UpdateMenuCategoryInput): Promise<MenuCategoryRecord> {
    const index = this.tenancyStore.menuCategories.findIndex(
      (category) =>
        category.id === input.category.id &&
        category.tenantId === input.category.tenantId &&
        category.propertyId === input.category.propertyId,
    );
    if (index >= 0) {
      this.tenancyStore.menuCategories[index] = input.category;
    }
    return input.category;
  }

  async listMenuItems(query: RoomLookupQuery & { categoryId?: string }): Promise<MenuItemRecord[]> {
    return this.tenancyStore.menuItems
      .filter((item) => {
        if (item.tenantId !== query.tenantId || item.propertyId !== query.propertyId) {
          return false;
        }
        if (query.categoryId && item.categoryId !== query.categoryId) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getMenuItem(
    query: RoomLookupQuery & { itemId: string },
  ): Promise<MenuItemRecord | undefined> {
    return this.tenancyStore.menuItems.find(
      (item) =>
        item.id === query.itemId &&
        item.tenantId === query.tenantId &&
        item.propertyId === query.propertyId,
    );
  }

  async createMenuItem(input: CreateMenuItemInput): Promise<MenuItemRecord> {
    this.tenancyStore.menuItems.push(input.item);
    return input.item;
  }

  async updateMenuItem(input: UpdateMenuItemInput): Promise<MenuItemRecord> {
    const index = this.tenancyStore.menuItems.findIndex(
      (item) =>
        item.id === input.item.id &&
        item.tenantId === input.item.tenantId &&
        item.propertyId === input.item.propertyId,
    );
    if (index >= 0) {
      this.tenancyStore.menuItems[index] = input.item;
    }
    return input.item;
  }

  async listKitchenOrders(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
    from?: string;
    to?: string;
    search?: string;
  }): Promise<KitchenOrderRecord[]> {
    const term = query.search?.trim().toLowerCase();
    return this.tenancyStore.kitchenOrders
      .filter((order) => {
        if (order.tenantId !== query.tenantId || order.propertyId !== query.propertyId) {
          return false;
        }
        if (query.status && order.status !== query.status) {
          return false;
        }
        if (query.from && order.createdAt.slice(0, 10) < query.from) {
          return false;
        }
        if (query.to && order.createdAt.slice(0, 10) > query.to) {
          return false;
        }
        if (term) {
          const matches = [
            order.code,
            order.notes ?? '',
            order.cancelledReason ?? '',
            order.id,
            order.stayId,
            order.roomId,
          ].some((value) => value.toLowerCase().includes(term));
          if (!matches) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getKitchenOrder(query: {
    tenantId: string;
    propertyId: string;
    orderId: string;
  }): Promise<KitchenOrderRecord | undefined> {
    return this.tenancyStore.kitchenOrders.find(
      (order) =>
        order.id === query.orderId &&
        order.tenantId === query.tenantId &&
        order.propertyId === query.propertyId,
    );
  }

  async createKitchenOrder(input: CreateKitchenOrderInput): Promise<KitchenOrderRecord> {
    this.tenancyStore.kitchenOrders.push(input.order);
    return input.order;
  }

  async updateKitchenOrder(input: UpdateKitchenOrderInput): Promise<KitchenOrderRecord> {
    const index = this.tenancyStore.kitchenOrders.findIndex(
      (order) =>
        order.id === input.order.id &&
        order.tenantId === input.order.tenantId &&
        order.propertyId === input.order.propertyId,
    );
    if (index >= 0) {
      this.tenancyStore.kitchenOrders[index] = input.order;
    }
    return input.order;
  }

  async listKitchenOrderItems(query: {
    tenantId: string;
    propertyId: string;
    orderId: string;
  }): Promise<KitchenOrderItemRecord[]> {
    return this.tenancyStore.kitchenOrderItems
      .filter(
        (item) =>
          item.tenantId === query.tenantId &&
          item.propertyId === query.propertyId &&
          item.orderId === query.orderId,
      )
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async createKitchenOrderItems(input: {
    tenantId: string;
    propertyId: string;
    items: KitchenOrderItemRecord[];
  }): Promise<KitchenOrderItemRecord[]> {
    const created = input.items.map((item) => ({
      ...item,
      tenantId: input.tenantId,
      propertyId: input.propertyId,
    }));
    this.tenancyStore.kitchenOrderItems.push(...created);
    return created;
  }

  async deleteKitchenOrderItems(query: {
    tenantId: string;
    propertyId: string;
    orderId: string;
  }): Promise<void> {
    for (let index = this.tenancyStore.kitchenOrderItems.length - 1; index >= 0; index -= 1) {
      const item = this.tenancyStore.kitchenOrderItems[index];
      if (
        item.tenantId === query.tenantId &&
        item.propertyId === query.propertyId &&
        item.orderId === query.orderId
      ) {
        this.tenancyStore.kitchenOrderItems.splice(index, 1);
      }
    }
  }

  async generateKitchenOrderCode(propertyId: string): Promise<string> {
    const max = this.tenancyStore.kitchenOrders
      .filter((order) => order.propertyId === propertyId)
      .map((order) => {
        const parsed = Number(order.code.replace(/^K-/i, ''));
        return Number.isFinite(parsed) ? parsed : 0;
      })
      .reduce((acc, value) => Math.max(acc, value), 1000);
    return `K-${max + 1}`;
  }

  async listInvoices(query: {
    tenantId: string;
    propertyId: string;
    search?: string;
    status?: string;
  }): Promise<InvoiceRecord[]> {
    const search = query.search?.toLowerCase().trim();
    return this.tenancyStore.invoices
      .filter((invoice) => {
        if (invoice.tenantId !== query.tenantId || invoice.propertyId !== query.propertyId) {
          return false;
        }

        if (query.status && invoice.status !== query.status) {
          return false;
        }

        if (!search) {
          return true;
        }

        return (
          invoice.invoiceNumber.toLowerCase().includes(search) ||
          invoice.reservationId?.toLowerCase().includes(search) ||
          invoice.stayId?.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getInvoice(query: {
    tenantId: string;
    propertyId: string;
    invoiceId: string;
  }): Promise<InvoiceRecord | undefined> {
    return this.tenancyStore.invoices.find(
      (invoice) =>
        invoice.id === query.invoiceId &&
        invoice.tenantId === query.tenantId &&
        invoice.propertyId === query.propertyId,
    );
  }

  async getOpenInvoiceByStay(query: {
    tenantId: string;
    propertyId: string;
    stayId: string;
  }): Promise<InvoiceRecord | undefined> {
    return this.tenancyStore.invoices.find(
      (invoice) =>
        invoice.tenantId === query.tenantId &&
        invoice.propertyId === query.propertyId &&
        invoice.stayId === query.stayId &&
        invoice.status === 'OPEN',
    );
  }

  async createInvoice(input: CreateInvoiceInput): Promise<InvoiceRecord> {
    this.tenancyStore.invoices.push(input.invoice);
    return input.invoice;
  }

  async updateInvoice(input: UpdateInvoiceInput): Promise<InvoiceRecord> {
    return input.invoice;
  }

  async listReservations(query: ReservationLookupQuery): Promise<ReservationRecord[]> {
    return this.tenancyStore.reservations.filter(
      (reservation) =>
        reservation.tenantId === query.tenantId && reservation.propertyId === query.propertyId,
    );
  }

  async getReservation(
    query: ReservationLookupQuery & { reservationId: string },
  ): Promise<ReservationRecord | undefined> {
    return this.tenancyStore.reservations.find(
      (reservation) =>
        reservation.id === query.reservationId &&
        reservation.tenantId === query.tenantId &&
        reservation.propertyId === query.propertyId,
    );
  }

  async createReservation(input: CreateReservationInput): Promise<ReservationRecord> {
    this.tenancyStore.reservations.push(input.reservation);
    return input.reservation;
  }

  async updateReservation(input: UpdateReservationInput): Promise<ReservationRecord> {
    return input.reservation;
  }

  async generateReservationCode(propertyId: string): Promise<string> {
    return this.tenancyStore.generateReservationCode(propertyId);
  }

  async generateInvoiceNumber(propertyId: string): Promise<string> {
    return this.tenancyStore.generateInvoiceNumber(propertyId);
  }

  async listStays(query: StayLookupQuery): Promise<StayRecord[]> {
    return this.tenancyStore.stays.filter(
      (stay) => stay.tenantId === query.tenantId && stay.propertyId === query.propertyId,
    );
  }

  async getStay(query: StayLookupQuery & { stayId: string }): Promise<StayRecord | undefined> {
    return this.tenancyStore.stays.find(
      (stay) =>
        stay.id === query.stayId && stay.tenantId === query.tenantId && stay.propertyId === query.propertyId,
    );
  }

  async createStay(input: CreateStayInput): Promise<StayRecord> {
    this.tenancyStore.stays.push(input.stay);
    return input.stay;
  }

  async updateStay(input: UpdateStayInput): Promise<StayRecord> {
    return input.stay;
  }

  async createHousekeepingTask(
    input: CreateHousekeepingTaskInput,
  ): Promise<HousekeepingTaskRecord> {
    this.tenancyStore.housekeepingTasks.push(input.task);
    return input.task;
  }

  async listHousekeepingTasks(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
    assignedUserId?: string;
    roomId?: string;
  }): Promise<HousekeepingTaskRecord[]> {
    return this.tenancyStore.housekeepingTasks
      .filter((task) => {
        if (task.tenantId !== query.tenantId || task.propertyId !== query.propertyId) {
          return false;
        }

        if (query.status && task.status !== query.status) {
          return false;
        }

        if (query.assignedUserId && task.assignedUserId !== query.assignedUserId) {
          return false;
        }

        if (query.roomId && task.roomId !== query.roomId) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getHousekeepingTask(query: {
    tenantId: string;
    propertyId: string;
    taskId: string;
  }): Promise<HousekeepingTaskRecord | undefined> {
    return this.tenancyStore.housekeepingTasks.find(
      (task) =>
        task.id === query.taskId &&
        task.tenantId === query.tenantId &&
        task.propertyId === query.propertyId,
    );
  }

  async updateHousekeepingTask(
    input: UpdateHousekeepingTaskInput,
  ): Promise<HousekeepingTaskRecord | undefined> {
    const index = this.tenancyStore.housekeepingTasks.findIndex(
      (task) =>
        task.id === input.task.id &&
        task.tenantId === input.task.tenantId &&
        task.propertyId === input.task.propertyId,
    );
    if (index < 0) {
      return undefined;
    }

    if (
      input.expectedUpdatedAt &&
      this.tenancyStore.housekeepingTasks[index].updatedAt !== input.expectedUpdatedAt
    ) {
      return undefined;
    }

    this.tenancyStore.housekeepingTasks[index] = input.task;
    return this.tenancyStore.housekeepingTasks[index];
  }

  async getActiveHousekeepingTaskForRoom(query: {
    tenantId: string;
    propertyId: string;
    roomId: string;
  }): Promise<HousekeepingTaskRecord | undefined> {
    return this.tenancyStore.housekeepingTasks
      .filter(
        (task) =>
          task.tenantId === query.tenantId &&
          task.propertyId === query.propertyId &&
          task.roomId === query.roomId &&
          ['DIRTY', 'CLEANING', 'CLEAN'].includes(task.status),
      )
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  }

  async createMaintenanceTicket(input: CreateMaintenanceTicketInput): Promise<MaintenanceTicketRecord> {
    this.tenancyStore.maintenanceTickets.push(input.ticket);
    return input.ticket;
  }

  async listMaintenanceTickets(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
    severity?: string;
    roomId?: string;
  }): Promise<MaintenanceTicketRecord[]> {
    return this.tenancyStore.maintenanceTickets
      .filter((ticket) => {
        if (ticket.tenantId !== query.tenantId || ticket.propertyId !== query.propertyId) {
          return false;
        }

        if (query.status && ticket.status !== query.status) {
          return false;
        }

        if (query.severity && ticket.severity !== query.severity) {
          return false;
        }

        if (query.roomId && ticket.roomId !== query.roomId) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getMaintenanceTicket(query: {
    tenantId: string;
    propertyId: string;
    ticketId: string;
  }): Promise<MaintenanceTicketRecord | undefined> {
    return this.tenancyStore.maintenanceTickets.find(
      (ticket) =>
        ticket.id === query.ticketId &&
        ticket.tenantId === query.tenantId &&
        ticket.propertyId === query.propertyId,
    );
  }

  async updateMaintenanceTicket(input: UpdateMaintenanceTicketInput): Promise<MaintenanceTicketRecord> {
    return input.ticket;
  }

  async createShiftHandover(input: CreateShiftHandoverInput): Promise<ShiftHandoverRecord> {
    this.tenancyStore.shiftHandovers.push(input.handover);
    return input.handover;
  }

  async listShiftHandovers(query: {
    tenantId: string;
    propertyId: string;
    userId?: string;
    shiftType?: string;
  }): Promise<ShiftHandoverRecord[]> {
    return this.tenancyStore.shiftHandovers.filter((handover) => {
      if (handover.tenantId !== query.tenantId || handover.propertyId !== query.propertyId) {
        return false;
      }

      if (query.userId && handover.userId !== query.userId) {
        return false;
      }

      if (query.shiftType && handover.shiftType !== query.shiftType) {
        return false;
      }

      return true;
    });
  }

  async createFinanceShiftHandover(
    input: CreateFinanceShiftHandoverInput,
  ): Promise<FinanceShiftHandoverRecord> {
    this.tenancyStore.financeShiftHandovers.push(input.handover);
    return input.handover;
  }

  async listFinanceShiftHandovers(query: {
    tenantId: string;
    propertyId: string;
    userId?: string;
    shiftType?: string;
  }): Promise<FinanceShiftHandoverRecord[]> {
    return this.tenancyStore.financeShiftHandovers.filter((handover) => {
      if (handover.tenantId !== query.tenantId || handover.propertyId !== query.propertyId) {
        return false;
      }

      if (query.userId && handover.userId !== query.userId) {
        return false;
      }

      if (query.shiftType && handover.shiftType !== query.shiftType) {
        return false;
      }

      return true;
    });
  }

  async createConfirmation(input: CreateConfirmationInput): Promise<ConfirmationRecord> {
    this.tenancyStore.confirmations.push(input.confirmation);
    return input.confirmation;
  }

  async listConfirmations(query: {
    tenantId: string;
    propertyId: string;
  }): Promise<ConfirmationRecord[]> {
    return this.tenancyStore.confirmations.filter(
      (confirmation) =>
        confirmation.tenantId === query.tenantId && confirmation.propertyId === query.propertyId,
    );
  }

  async listDiscountRequests(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
  }): Promise<DiscountRequestRecord[]> {
    return this.tenancyStore.discountRequests
      .filter((request) => {
        if (request.tenantId !== query.tenantId || request.propertyId !== query.propertyId) {
          return false;
        }

        if (query.status && request.status !== query.status) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getDiscountRequest(query: {
    tenantId: string;
    propertyId: string;
    requestId: string;
  }): Promise<DiscountRequestRecord | undefined> {
    return this.tenancyStore.discountRequests.find(
      (request) =>
        request.id === query.requestId &&
        request.tenantId === query.tenantId &&
        request.propertyId === query.propertyId,
    );
  }

  async createDiscountRequest(input: CreateDiscountRequestInput): Promise<DiscountRequestRecord> {
    this.tenancyStore.discountRequests.push(input.request);
    return input.request;
  }

  async updateDiscountRequest(input: UpdateDiscountRequestInput): Promise<DiscountRequestRecord> {
    return input.request;
  }

  async listRefundRequests(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
  }): Promise<RefundRequestRecord[]> {
    return this.tenancyStore.refundRequests
      .filter((request) => {
        if (request.tenantId !== query.tenantId || request.propertyId !== query.propertyId) {
          return false;
        }

        if (query.status && request.status !== query.status) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getRefundRequest(query: {
    tenantId: string;
    propertyId: string;
    requestId: string;
  }): Promise<RefundRequestRecord | undefined> {
    return this.tenancyStore.refundRequests.find(
      (request) =>
        request.id === query.requestId &&
        request.tenantId === query.tenantId &&
        request.propertyId === query.propertyId,
    );
  }

  async createRefundRequest(input: CreateRefundRequestInput): Promise<RefundRequestRecord> {
    this.tenancyStore.refundRequests.push(input.request);
    return input.request;
  }

  async updateRefundRequest(input: UpdateRefundRequestInput): Promise<RefundRequestRecord> {
    return input.request;
  }

  async listOverrideRequests(query: {
    tenantId: string;
    propertyId: string;
    status?: string;
  }): Promise<OverrideRequestRecord[]> {
    return this.tenancyStore.overrideRequests
      .filter((request) => {
        if (request.tenantId !== query.tenantId || request.propertyId !== query.propertyId) {
          return false;
        }

        if (query.status && request.status !== query.status) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getOverrideRequest(query: {
    tenantId: string;
    propertyId: string;
    requestId: string;
  }): Promise<OverrideRequestRecord | undefined> {
    return this.tenancyStore.overrideRequests.find(
      (request) =>
        request.id === query.requestId &&
        request.tenantId === query.tenantId &&
        request.propertyId === query.propertyId,
    );
  }

  async createOverrideRequest(input: CreateOverrideRequestInput): Promise<OverrideRequestRecord> {
    this.tenancyStore.overrideRequests.push(input.request);
    return input.request;
  }

  async updateOverrideRequest(input: UpdateOverrideRequestInput): Promise<OverrideRequestRecord> {
    return input.request;
  }

  async createFolioLineItem(input: CreateFolioLineItemInput): Promise<FolioLineItemRecord> {
    this.tenancyStore.folioLineItems.push(input.lineItem);
    return input.lineItem;
  }

  async listFolioLineItems(query: {
    tenantId: string;
    propertyId: string;
    invoiceId?: string;
    entityType?: string;
    entityId?: string;
  }): Promise<FolioLineItemRecord[]> {
    return this.tenancyStore.folioLineItems
      .filter((item) => {
        if (item.tenantId !== query.tenantId || item.propertyId !== query.propertyId) {
          return false;
        }

        if (query.invoiceId && item.invoiceId !== query.invoiceId) {
          return false;
        }

        if (query.entityType && item.entityType !== query.entityType) {
          return false;
        }

        if (query.entityId && item.entityId !== query.entityId) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async listPayments(query: {
    tenantId: string;
    propertyId: string;
    invoiceId?: string;
    date?: string;
  }): Promise<PaymentRecord[]> {
    return this.tenancyStore.payments
      .filter((payment) => {
        if (payment.tenantId !== query.tenantId || payment.propertyId !== query.propertyId) {
          return false;
        }

        if (query.invoiceId && payment.invoiceId !== query.invoiceId) {
          return false;
        }

        if (query.date && payment.createdAt.slice(0, 10) !== query.date) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getPayment(query: {
    tenantId: string;
    propertyId: string;
    paymentId: string;
  }): Promise<PaymentRecord | undefined> {
    return this.tenancyStore.payments.find(
      (payment) =>
        payment.id === query.paymentId &&
        payment.tenantId === query.tenantId &&
        payment.propertyId === query.propertyId,
    );
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentRecord> {
    this.tenancyStore.payments.push(input.payment);
    return input.payment;
  }

  async updatePayment(input: UpdatePaymentInput): Promise<PaymentRecord> {
    return input.payment;
  }

  async getRefundExecutionByRequest(query: {
    tenantId: string;
    propertyId: string;
    refundRequestId: string;
  }): Promise<RefundExecutionRecord | undefined> {
    return this.tenancyStore.refundExecutions.find(
      (execution) =>
        execution.refundRequestId === query.refundRequestId &&
        execution.tenantId === query.tenantId &&
        execution.propertyId === query.propertyId,
    );
  }

  async createRefundExecution(
    input: CreateRefundExecutionInput,
  ): Promise<RefundExecutionRecord> {
    this.tenancyStore.refundExecutions.push(input.execution);
    return input.execution;
  }

  async listInventoryBlocks(query: {
    tenantId: string;
    propertyId: string;
    roomTypeId?: string;
    from?: string;
    to?: string;
  }): Promise<InventoryBlockRecord[]> {
    return this.tenancyStore.inventoryBlocks
      .filter((block) => {
        if (block.tenantId !== query.tenantId || block.propertyId !== query.propertyId) {
          return false;
        }

        if (query.roomTypeId && block.roomTypeId !== query.roomTypeId) {
          return false;
        }

        if (query.from && block.toDate < query.from) {
          return false;
        }

        if (query.to && block.fromDate > query.to) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async createInventoryBlock(input: CreateInventoryBlockInput): Promise<InventoryBlockRecord> {
    this.tenancyStore.inventoryBlocks.push(input.block);
    return input.block;
  }

  async listInventoryOverrides(query: {
    tenantId: string;
    propertyId: string;
    roomTypeId?: string;
    from?: string;
    to?: string;
  }): Promise<InventoryOverrideRecord[]> {
    return this.tenancyStore.inventoryOverrides
      .filter((override) => {
        if (override.tenantId !== query.tenantId || override.propertyId !== query.propertyId) {
          return false;
        }

        if (query.roomTypeId && override.roomTypeId !== query.roomTypeId) {
          return false;
        }

        if (query.from && override.date < query.from) {
          return false;
        }

        if (query.to && override.date > query.to) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async createInventoryOverride(
    input: CreateInventoryOverrideInput,
  ): Promise<InventoryOverrideRecord> {
    this.tenancyStore.inventoryOverrides.push(input.override);
    return input.override;
  }

  async getDayControl(query: {
    tenantId: string;
    propertyId: string;
    date: string;
  }): Promise<DayControlRecord | undefined> {
    return this.tenancyStore.dayControls.find(
      (control) =>
        control.tenantId === query.tenantId &&
        control.propertyId === query.propertyId &&
        control.date === query.date,
    );
  }

  async upsertDayControl(input: UpsertDayControlInput): Promise<DayControlRecord> {
    const index = this.tenancyStore.dayControls.findIndex(
      (control) =>
        control.tenantId === input.control.tenantId &&
        control.propertyId === input.control.propertyId &&
        control.date === input.control.date,
    );

    if (index >= 0) {
      this.tenancyStore.dayControls[index] = input.control;
      return this.tenancyStore.dayControls[index];
    }

    this.tenancyStore.dayControls.push(input.control);
    return input.control;
  }

  async listDailyCloseReports(query: {
    tenantId: string;
    propertyId: string;
    date?: string;
    limit?: number;
  }): Promise<DailyCloseReportRecord[]> {
    return this.tenancyStore.dailyCloseReports
      .filter((report) => {
        if (report.tenantId !== query.tenantId || report.propertyId !== query.propertyId) {
          return false;
        }

        if (query.date && report.date !== query.date) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, query.limit ?? 100);
  }

  async getDailyCloseReport(query: {
    tenantId: string;
    propertyId: string;
    date: string;
  }): Promise<DailyCloseReportRecord | undefined> {
    return this.tenancyStore.dailyCloseReports.find(
      (report) =>
        report.tenantId === query.tenantId &&
        report.propertyId === query.propertyId &&
        report.date === query.date,
    );
  }

  async createDailyCloseReport(input: CreateDailyCloseReportInput): Promise<DailyCloseReportRecord> {
    this.tenancyStore.dailyCloseReports.push(input.report);
    return input.report;
  }

  async updateDailyCloseReport(input: UpdateDailyCloseReportInput): Promise<DailyCloseReportRecord> {
    return input.report;
  }

  async enqueue(
    queue: string,
    name: string,
    payload: Record<string, unknown>,
  ): Promise<QueueJobRecord> {
    return this.tenancyStore.enqueue(queue, name, payload);
  }

  async listQueueJobs(query?: {
    queue?: string;
    name?: string;
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<QueueJobRecord[]> {
    return this.tenancyStore.queueJobs
      .filter((job) => {
        if (query?.queue && job.queue !== query.queue) {
          return false;
        }

        if (query?.name && job.name !== query.name) {
          return false;
        }

        if (query?.from && job.createdAt < query.from) {
          return false;
        }

        if (query?.to && job.createdAt > query.to) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, query?.limit ?? 100);
  }

  async createAuditLog(input: CreateAuditLogInput): Promise<AuditLogRecord> {
    this.tenancyStore.auditLogs.push(input.auditLog);
    return input.auditLog;
  }

  async listAuditLogs(query: {
    tenantId: string;
    propertyId: string;
    from?: string;
    to?: string;
    actorUserId?: string;
    action?: string;
    entityType?: string;
    limit?: number;
  }): Promise<AuditLogRecord[]> {
    return this.tenancyStore.auditLogs
      .filter((log) => {
        if (log.tenantId !== query.tenantId || log.propertyId !== query.propertyId) {
          return false;
        }

        if (query.from && log.createdAt < query.from) {
          return false;
        }

        if (query.to && log.createdAt > query.to) {
          return false;
        }

        if (query.actorUserId && log.actorUserId !== query.actorUserId) {
          return false;
        }

        if (query.action && log.action !== query.action) {
          return false;
        }

        if (query.entityType && log.entityType !== query.entityType) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, query.limit ?? 100);
  }

  async listAuditLogsByTenant(query: {
    tenantId: string;
    propertyIds?: string[];
    from?: string;
    to?: string;
    actorUserId?: string;
    action?: string;
    entityType?: string;
    limit?: number;
  }): Promise<AuditLogRecord[]> {
    const propertyFilter = query.propertyIds?.length
      ? new Set(query.propertyIds)
      : undefined;

    return this.tenancyStore.auditLogs
      .filter((log) => {
        if (log.tenantId !== query.tenantId) {
          return false;
        }

        if (propertyFilter && (!log.propertyId || !propertyFilter.has(log.propertyId))) {
          return false;
        }

        if (query.from && log.createdAt < query.from) {
          return false;
        }

        if (query.to && log.createdAt > query.to) {
          return false;
        }

        if (query.actorUserId && log.actorUserId !== query.actorUserId) {
          return false;
        }

        if (query.action && log.action !== query.action) {
          return false;
        }

        if (query.entityType && log.entityType !== query.entityType) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, query.limit ?? 100);
  }

  async listAuditLogsGlobal(query: {
    tenantIds?: string[];
    from?: string;
    to?: string;
    actorUserId?: string;
    action?: string;
    entityType?: string;
    limit?: number;
  }): Promise<AuditLogRecord[]> {
    const tenantFilter = query.tenantIds?.length ? new Set(query.tenantIds) : undefined;
    return this.tenancyStore.auditLogs
      .filter((log) => {
        if (tenantFilter && !tenantFilter.has(log.tenantId)) {
          return false;
        }

        if (query.from && log.createdAt < query.from) {
          return false;
        }

        if (query.to && log.createdAt > query.to) {
          return false;
        }

        if (query.actorUserId && log.actorUserId !== query.actorUserId) {
          return false;
        }

        if (query.action && log.action !== query.action) {
          return false;
        }

        if (query.entityType && log.entityType !== query.entityType) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, query.limit ?? 100);
  }

  async createOwnerException(input: CreateOwnerExceptionInput): Promise<OwnerExceptionRecord> {
    if (input.exception.dedupeKey) {
      const existing = this.tenancyStore.ownerExceptions.find(
        (item) =>
          item.tenantId === input.exception.tenantId &&
          item.dedupeKey === input.exception.dedupeKey,
      );
      if (existing) {
        return existing;
      }
    }

    this.tenancyStore.ownerExceptions.push(input.exception);
    return input.exception;
  }

  async listOwnerExceptions(query: {
    tenantId: string;
    propertyIds?: string[];
    type?: string;
    severity?: string;
    from?: string;
    to?: string;
    acknowledged?: boolean;
    limit?: number;
  }): Promise<OwnerExceptionRecord[]> {
    const propertyFilter = query.propertyIds?.length
      ? new Set(query.propertyIds)
      : undefined;

    return this.tenancyStore.ownerExceptions
      .filter((item) => {
        if (item.tenantId !== query.tenantId) {
          return false;
        }

        if (propertyFilter && (!item.propertyId || !propertyFilter.has(item.propertyId))) {
          return false;
        }

        if (query.type && item.type !== query.type) {
          return false;
        }

        if (query.severity && item.severity !== query.severity) {
          return false;
        }

        if (query.from && item.createdAt < query.from) {
          return false;
        }

        if (query.to && item.createdAt > query.to) {
          return false;
        }

        if (query.acknowledged === true && !item.acknowledgedAt) {
          return false;
        }

        if (query.acknowledged === false && item.acknowledgedAt) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, query.limit ?? 100);
  }

  async getOwnerException(query: {
    tenantId: string;
    exceptionId: string;
  }): Promise<OwnerExceptionRecord | undefined> {
    return this.tenancyStore.ownerExceptions.find(
      (item) => item.tenantId === query.tenantId && item.id === query.exceptionId,
    );
  }

  async updateOwnerException(input: UpdateOwnerExceptionInput): Promise<OwnerExceptionRecord> {
    const index = this.tenancyStore.ownerExceptions.findIndex(
      (item) =>
        item.id === input.exception.id && item.tenantId === input.exception.tenantId,
    );

    if (index >= 0) {
      this.tenancyStore.ownerExceptions[index] = input.exception;
    } else {
      this.tenancyStore.ownerExceptions.push(input.exception);
    }

    return input.exception;
  }

  async createOwnerNote(input: CreateOwnerNoteInput): Promise<OwnerNoteRecord> {
    this.tenancyStore.ownerNotes.push(input.note);
    return input.note;
  }

  async listOwnerNotes(query: {
    tenantId: string;
    exceptionId?: string;
    propertyIds?: string[];
    limit?: number;
  }): Promise<OwnerNoteRecord[]> {
    const propertyFilter = query.propertyIds?.length
      ? new Set(query.propertyIds)
      : undefined;

    return this.tenancyStore.ownerNotes
      .filter((item) => {
        if (item.tenantId !== query.tenantId) {
          return false;
        }

        if (query.exceptionId && item.exceptionId !== query.exceptionId) {
          return false;
        }

        if (propertyFilter && (!item.propertyId || !propertyFilter.has(item.propertyId))) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, query.limit ?? 100);
  }

  async createOwnerExportJob(input: CreateOwnerExportJobInput): Promise<OwnerExportJobRecord> {
    this.tenancyStore.ownerExportJobs.push(input.exportJob);
    return input.exportJob;
  }

  async listOwnerExportJobs(query: {
    tenantId: string;
    requestedByUserId?: string;
    status?: string;
    limit?: number;
  }): Promise<OwnerExportJobRecord[]> {
    return this.tenancyStore.ownerExportJobs
      .filter((job) => {
        if (job.tenantId !== query.tenantId) {
          return false;
        }

        if (query.requestedByUserId && job.requestedByUserId !== query.requestedByUserId) {
          return false;
        }

        if (query.status && job.status !== query.status) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, query.limit ?? 100);
  }

  async getOwnerExportJob(query: {
    tenantId: string;
    exportJobId: string;
  }): Promise<OwnerExportJobRecord | undefined> {
    return this.tenancyStore.ownerExportJobs.find(
      (job) => job.tenantId === query.tenantId && job.id === query.exportJobId,
    );
  }

  async updateOwnerExportJob(input: UpdateOwnerExportJobInput): Promise<OwnerExportJobRecord> {
    const index = this.tenancyStore.ownerExportJobs.findIndex(
      (job) =>
        job.id === input.exportJob.id && job.tenantId === input.exportJob.tenantId,
    );

    if (index >= 0) {
      this.tenancyStore.ownerExportJobs[index] = input.exportJob;
    } else {
      this.tenancyStore.ownerExportJobs.push(input.exportJob);
    }

    return input.exportJob;
  }

  buildIdempotencyCacheKey(input: {
    tenantId: string;
    propertyId?: string;
    userId: string;
    method: string;
    path: string;
    idempotencyKey: string;
  }): string {
    return this.tenancyStore.buildIdempotencyCacheKey(input);
  }

  async getIdempotentResponse(cacheKey: string) {
    return this.tenancyStore.getIdempotentResponse(cacheKey);
  }

  async setIdempotentResponse(cacheKey: string, response: { statusCode: number; body: unknown }) {
    this.tenancyStore.setIdempotentResponse(cacheKey, response);
  }
}
