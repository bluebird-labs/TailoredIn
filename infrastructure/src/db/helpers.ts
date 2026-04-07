import Crypto from 'node:crypto';
import type { PrimaryKeyOptions } from '@mikro-orm/core';
import { PrimaryKey } from '@mikro-orm/decorators/es';
import type { EntityManager } from '@mikro-orm/postgresql';

export type QueryOpts = {
  em?: EntityManager;
};

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
