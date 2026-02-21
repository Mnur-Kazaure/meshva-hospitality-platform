import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { KitchenMenuController } from './kitchen-menu.controller';
import { KitchenOrdersController } from './kitchen-orders.controller';
import { KitchenReportsController } from './kitchen-reports.controller';
import { KitchenService } from './kitchen.service';

@Module({
  imports: [AuditModule],
  controllers: [KitchenMenuController, KitchenOrdersController, KitchenReportsController],
  providers: [KitchenService],
})
export class KitchenModule {}
