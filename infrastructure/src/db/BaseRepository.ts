import type { EntityManager } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/postgresql';
import type { BaseEntity } from './BaseEntity.js';
import type { QueryOpts } from './helpers.js';

export class BaseRepository<E extends BaseEntity> extends EntityRepository<E> {
  protected getEm(opts: QueryOpts = {}): EntityManager {
    return opts.em ?? this.em;
  }
}
