import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow, types } from 'pg';

const PG_DATE_OID = 1082;

@Injectable()
export class PostgresService implements OnModuleDestroy {
  private pool: Pool | null = null;

  private getPool(): Pool {
    if (!this.pool) {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL is required for postgres persistence mode');
      }

      // Keep DATE columns timezone-safe by returning raw YYYY-MM-DD strings.
      types.setTypeParser(PG_DATE_OID, (value: string) => value);

      this.pool = new Pool({
        connectionString,
        max: Number(process.env.DB_POOL_MAX ?? 10),
      });
    }

    return this.pool;
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.getPool().query<T>(text, params);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
