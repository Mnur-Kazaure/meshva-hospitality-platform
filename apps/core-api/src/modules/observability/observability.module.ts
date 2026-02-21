import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { ObservabilityController } from './observability.controller';
import { RequestLoggingMiddleware } from './request-logging.middleware';
import { ObservabilityService } from './observability.service';

@Module({
  imports: [PersistenceModule],
  controllers: [ObservabilityController],
  providers: [ObservabilityService, RequestLoggingMiddleware],
  exports: [ObservabilityService, RequestLoggingMiddleware],
})
export class ObservabilityModule {}
