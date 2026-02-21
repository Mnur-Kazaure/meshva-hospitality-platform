import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { HousekeepingController } from './housekeeping.controller';
import { HousekeepingService } from './housekeeping.service';
import { MaintenanceController } from './maintenance.controller';

@Module({
  imports: [AuditModule],
  controllers: [HousekeepingController, MaintenanceController],
  providers: [HousekeepingService],
  exports: [HousekeepingService],
})
export class HousekeepingModule {}
