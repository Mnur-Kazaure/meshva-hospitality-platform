import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { ManagerAuditController } from './manager-audit.controller';

@Module({
  providers: [AuditService],
  exports: [AuditService],
  controllers: [AuditController, ManagerAuditController],
})
export class AuditModule {}
