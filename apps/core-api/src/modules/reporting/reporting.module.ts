import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { OwnerAuditController } from './owner-audit.controller';
import { OwnerExceptionsController } from './owner-exceptions.controller';
import { OwnerExportsController } from './owner-exports.controller';
import { OwnerReportingController } from './owner-reporting.controller';
import { OwnerService } from './owner.service';

@Module({
  imports: [AuditModule],
  controllers: [
    OwnerReportingController,
    OwnerExceptionsController,
    OwnerAuditController,
    OwnerExportsController,
  ],
  providers: [OwnerService],
  exports: [OwnerService],
})
export class ReportingModule {}
