import { Global, Module } from '@nestjs/common';
import { TenancyStoreService } from './tenancy-store.service';

@Global()
@Module({
  providers: [TenancyStoreService],
  exports: [TenancyStoreService],
})
export class TenancyModule {}
