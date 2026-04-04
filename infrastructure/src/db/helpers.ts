import Crypto from 'node:crypto';
import type { PrimaryKeyOptions } from '@mikro-orm/core';
import { PrimaryKey } from '@mikro-orm/decorators/es';
import type { EntityManager, Ref } from '@mikro-orm/postgresql';
import type { BaseEntity } from './BaseEntity.js';

export type QueryOpts = {
  em?: EntityManager;
};

export type RefOrEntity<E extends BaseEntity> = Ref<E> | E;

export const UuidPrimaryKey = <T extends object>(
  options: Omit<PrimaryKeyOptions<T>, 'type' | 'default' | 'defaultRaw'> = {}
) => {
  return PrimaryKey<T>({
    ...options,
    type: 'uuid',
    defaultRaw: 'uuid_generate_v4()'
  });
};

export const generateUuid = () => {
  return Crypto.randomUUID();
};
