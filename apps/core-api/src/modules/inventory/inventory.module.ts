import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AvailabilityController } from './availability.controller';
import { ManagerInventoryController } from './manager-inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [AuditModule],
  controllers: [AvailabilityController, ManagerInventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
