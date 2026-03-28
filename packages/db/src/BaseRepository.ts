import type { EntityManager } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';
import type { IDatabaseConnection, PreparedQuery } from '@pgtyped/runtime';
import type { BaseEntity } from './BaseEntity.js';
import type { QueryOpts } from './helpers.js';

export type PgTypedQueryResult<T extends object> = { rows: T[]; rowCount: number };

export class BaseRepository<E extends BaseEntity> extends EntityRepository<E> {
  protected getEm(opts: QueryOpts = {}): EntityManager {
    return opts.em ?? this.em;
  }

  protected async executePgTypedQuery<P extends object, R extends object>(
    opts: QueryOpts = {},
    preparedQuery: PreparedQuery<P, R>,
    params: P
  ): Promise<PgTypedQueryResult<R>> {
    const conn = this.getEm(opts).getConnection();
    const dbConn: IDatabaseConnection = {
      query: async (sql: string, bindings: unknown[]) => {
        const rows = (await conn.execute(sql, bindings as unknown[], 'all')) as R[];
        return { rows, rowCount: rows.length };
      }
    };
    const rows = await preparedQuery.run(params, dbConn);
    return { rows, rowCount: rows.length };
  }
}
