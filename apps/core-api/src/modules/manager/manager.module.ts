import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { HousekeepingModule } from '../housekeeping/housekeeping.module';
import { DayControlController } from './day-control.controller';
import { ManagerMaintenanceController } from './manager-maintenance.controller';
import { ManagerOpsController } from './manager-ops.controller';
import { ManagerRoomsController } from './manager-rooms.controller';
import { ManagerReservationsController } from './manager-reservations.controller';
import { ManagerService } from './manager.service';
import { RatePlansController } from './rate-plans.controller';

@Module({
  imports: [AuditModule, HousekeepingModule],
  controllers: [
    ManagerOpsController,
    ManagerRoomsController,
    RatePlansController,
    ManagerReservationsController,
    DayControlController,
    ManagerMaintenanceController,
  ],
  providers: [ManagerService],
  exports: [ManagerService],
})
export class ManagerModule {}
