import { ObjectUtil, type TypeUtil } from '@tailoredin/shared';
import { baseOrmConfig } from './baseOrmConfig.js';

export type OrmConfig = typeof baseOrmConfig;

export const makeOrmConfig = (overrides: TypeUtil.DeepPartial<OrmConfig> = {}): OrmConfig => {
  return ObjectUtil.mergeWithOverrides(baseOrmConfig, overrides);
};
