import { InjectionToken } from '@needle-di/core';
import type { IJobElector } from './IJobElector.js';

export const RobotDI = {
  JobElector: new InjectionToken<IJobElector>('RobotDI.JobElector')
};
