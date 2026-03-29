import type { MikroORM } from '@mikro-orm/postgresql';
import { InjectionToken } from '@needle-di/core';

export const ApiDI = {
  Orm: new InjectionToken<MikroORM>('ApiDI.Orm')
};
