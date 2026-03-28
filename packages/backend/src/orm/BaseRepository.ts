import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BaseEntity } from './BaseEntity';
import { QueryResult } from 'pg';
import { PreparedQuery } from '@pgtyped/runtime';
import { QueryOpts } from './helpers';

export type KnexRawQueryResult<T extends object> = QueryResult<T>;

export class BaseRepository<E extends BaseEntity> extends EntityRepository<E> {
  protected getEm(opts: QueryOpts = {}): EntityManager {
    return opts.em ?? this.em;
  }

  protected extractPgTypedStatement<P, R>(query: PreparedQuery<P, R>): string {
    // @ts-expect-error TS2341
    return query.queryIR.statement;
  }

  protected async executePgTypedQuery<P extends object, R extends object>(
    opts: QueryOpts = {},
    preparedQuery: PreparedQuery<P, R>,
    params: P
  ): Promise<KnexRawQueryResult<R>> {
    const statement = this.extractPgTypedStatement(preparedQuery);
    return this.getEm(opts).getKnex().raw<KnexRawQueryResult<R>>(statement, params);
  }
}
