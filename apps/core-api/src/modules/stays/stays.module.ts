import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { InventoryModule } from '../inventory/inventory.module';
import { MessagingModule } from '../messaging/messaging.module';
import { StaysController } from './stays.controller';
import { StaysService } from './stays.service';

@Module({
  imports: [AuditModule, InventoryModule, MessagingModule],
  controllers: [StaysController],
  providers: [StaysService],
})
export class StaysModule {}
