import { InjectionToken } from '@needle-di/core';
import type { IJobElector } from '../job-elector/IJobElector.js';

export const RobotDI = {
  JobElector: new InjectionToken<IJobElector>('RobotDI.JobElector')
};
