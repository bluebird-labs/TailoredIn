import type { MikroORM } from '@mikro-orm/postgresql';
import { InjectionToken } from '@needle-di/core';

export const CliDI = {
  Orm: new InjectionToken<MikroORM>('CliDI.Orm')
};
