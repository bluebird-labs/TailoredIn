import { InjectionToken } from '@needle-di/core';
import type { ResumeGenerator } from './ResumeGenerator.js';

export const ResumeDI = {
  ResumeGenerator: new InjectionToken<ResumeGenerator>('ResumeDI.ResumeGenerator')
};
