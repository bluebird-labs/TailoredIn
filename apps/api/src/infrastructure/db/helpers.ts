import Crypto from 'node:crypto';
import Fs from 'node:fs/promises';
import Path from 'node:path';
import type { PrimaryKeyOptions } from '@mikro-orm/core';
import { PrimaryKey } from '@mikro-orm/decorators/es';
import type { Migration } from '@mikro-orm/migrations';
import type { EntityManager, Ref } from '@mikro-orm/postgresql';
import type { BaseEntity } from './BaseEntity.js';

const MIGRATIONS_DIR = Path.resolve(import.meta.dirname, 'migrations');

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

export const getMigrationSql = async (migration: Migration): Promise<string> => {
  const name = migration.constructor.name;
  const fileName = `${name.replace('Migration', 'Migration_')}.sql`;
  const sqlFilePath = Path.resolve(MIGRATIONS_DIR, fileName);
  return Fs.readFile(sqlFilePath, 'utf-8');
};
