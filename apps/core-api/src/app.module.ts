import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditModule } from './modules/audit/audit.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { GuestsModule } from './modules/guests/guests.module';
import { GuestPortalModule } from './modules/guest-portal/guest-portal.module';
import { HandoverModule } from './modules/handover/handover.module';
import { HousekeepingModule } from './modules/housekeeping/housekeeping.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { ManagerModule } from './modules/manager/manager.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { PersistenceModule } from './modules/persistence/persistence.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { PlatformModule } from './modules/platform/platform.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { StaysModule } from './modules/stays/stays.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { UsersModule } from './modules/users/users.module';
import { RequestContextGuard } from './common/guards/request-context.guard';
import { TenantScopeGuard } from './common/guards/tenant-scope.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { TenantStatusGuard } from './common/guards/tenant-status.guard';
import { CsrfOriginGuard } from './common/guards/csrf-origin.guard';
import { ObservabilityModule } from './modules/observability/observability.module';
import { RequestLoggingMiddleware } from './modules/observability/request-logging.middleware';

@Module({
  imports: [
    PersistenceModule,
    TenancyModule,
    AuthModule,
    RbacModule,
    AuditModule,
    ApprovalsModule,
    UsersModule,
    PropertiesModule,
    GuestsModule,
    GuestPortalModule,
    InventoryModule,
    ReservationsModule,
    StaysModule,
    BillingModule,
    HousekeepingModule,
    RoomsModule,
    ManagerModule,
    MessagingModule,
    ReportingModule,
    HandoverModule,
    KitchenModule,
    PlatformModule,
    ObservabilityModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RequestContextGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantStatusGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfOriginGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantScopeGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
