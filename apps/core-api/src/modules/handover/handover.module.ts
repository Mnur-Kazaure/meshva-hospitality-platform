import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { HandoverService } from './handover.service';
import { ShiftHandoverController } from './handover.controller';

@Module({
  imports: [AuditModule],
  controllers: [ShiftHandoverController],
  providers: [HandoverService],
  exports: [HandoverService],
})
export class HandoverModule {}
