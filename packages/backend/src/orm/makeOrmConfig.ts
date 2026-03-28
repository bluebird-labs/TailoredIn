import 'dotenv/config';
import { TypeUtil } from '../utils/TypeUtil';
import { ObjectUtil } from '../utils/ObjectUtil';
import { baseOrmConfig } from './baseOrmConfig';

export type OrmConfig = typeof baseOrmConfig;

export const makeOrmConfig = (overrides: TypeUtil.DeepPartial<OrmConfig> = {}): OrmConfig => {
  return ObjectUtil.mergeWithOverrides(baseOrmConfig, overrides);
};
