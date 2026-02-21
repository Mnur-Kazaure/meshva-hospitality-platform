import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PlatformService } from './platform.service';
import { PlatformSupportController } from './platform-support.controller';
import { PlatformSystemController } from './platform-system.controller';
import { PlatformSubscriptionsController } from './platform-subscriptions.controller';
import { PlatformTenantsController } from './platform-tenants.controller';

@Module({
  imports: [AuditModule],
  controllers: [
    PlatformTenantsController,
    PlatformSubscriptionsController,
    PlatformSystemController,
    PlatformSupportController,
  ],
  providers: [PlatformService],
  exports: [PlatformService],
})
export class PlatformModule {}
