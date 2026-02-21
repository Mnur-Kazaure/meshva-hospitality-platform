import { Global, Module } from '@nestjs/common';
import { TenancyModule } from '../tenancy/tenancy.module';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from './repositories/front-desk.repository';
import { FrontDeskMemoryRepository } from './repositories/front-desk.memory.repository';
import { FrontDeskPostgresRepository } from './repositories/front-desk.postgres.repository';
import { PostgresService } from './db/postgres.service';

@Global()
@Module({
  imports: [TenancyModule],
  providers: [
    PostgresService,
    FrontDeskMemoryRepository,
    FrontDeskPostgresRepository,
    {
      provide: FRONT_DESK_REPOSITORY,
      inject: [FrontDeskMemoryRepository, FrontDeskPostgresRepository],
      useFactory: (
        memoryRepository: FrontDeskMemoryRepository,
        postgresRepository: FrontDeskPostgresRepository,
      ): FrontDeskRepository => {
        const mode = (process.env.PERSISTENCE_MODE ?? 'memory').toLowerCase();
        return mode === 'postgres' ? postgresRepository : memoryRepository;
      },
    },
  ],
  exports: [FRONT_DESK_REPOSITORY, PostgresService],
})
export class PersistenceModule {}
