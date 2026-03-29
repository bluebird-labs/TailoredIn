import type { MikroORM } from '@mikro-orm/postgresql';
import { InjectionToken } from '@needle-di/core';
import type { JobSearchHandler } from './JobSearchHandler.js';
import type { LinkedInExplorer, LinkedInExplorerConfig } from './LinkedInExplorer.js';

export const LinkedInDI = {
  Orm: new InjectionToken<MikroORM>('LinkedInDI.Orm'),
  LinkedInExplorer: new InjectionToken<LinkedInExplorer>('LinkedInDI.LinkedInExplorer'),
  LinkedInExplorerConfig: new InjectionToken<LinkedInExplorerConfig>('LinkedInDI.LinkedInExplorerConfig'),
  JobSearchHandler: new InjectionToken<JobSearchHandler>('LinkedInDI.JobSearchHandler')
};
