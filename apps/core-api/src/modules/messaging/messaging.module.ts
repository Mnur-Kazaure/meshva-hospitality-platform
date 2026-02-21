import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ConfirmationsController } from './confirmations.controller';
import { MessagingService } from './messaging.service';

@Module({
  imports: [AuditModule],
  controllers: [ConfirmationsController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
