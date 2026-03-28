import { EntityManager, PrimaryKey, PrimaryKeyOptions, Ref } from '@mikro-orm/postgresql';
import { BaseEntity } from './BaseEntity.js';
import Crypto from 'crypto';
import { Migration } from '@mikro-orm/migrations';
import * as FS from 'fs/promises';
import { FsUtil } from '@tailoredin/shared';
import Path from 'node:path';
import { PACKAGE_DIR } from './PACKAGE_DIR.js';
import { Collection, EntityKey } from '@mikro-orm/core';

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
  const fileName = name.replace('Migration', 'Migration_') + '.sql';
  const sqlFilePath = Path.resolve(PACKAGE_DIR, 'migrations', fileName);
  const hasSqlFile = await FsUtil.exists(sqlFilePath);

  if (!hasSqlFile) {
    throw new Error(`SQL file not found: ${sqlFilePath}`);
  }

  return FS.readFile(sqlFilePath, 'utf-8');
};

type AnyFunction = (...args: any[]) => any;

type ToJsonType<T> = T extends Date
  ? string
  : T extends AnyFunction
    ? never
    : T extends Array<infer U>
      ? ToJsonType<U>[]
      : T extends object
        ? Exclude<{ [K in keyof T as T[K] extends AnyFunction ? never : K]: ToJsonType<T[K]> }, never>
        : T;

export type EntityProps<T> = Exclude<
  {
    [K in EntityKey<T> as T[K] extends AnyFunction ? never : K]: T[K] extends Collection<infer U>
      ? EntityProps<U>[]
      : T[K] extends RefOrEntity<infer U>
        ? EntityProps<U>
        : ToJsonType<T[K]>;
  },
  never
>;
