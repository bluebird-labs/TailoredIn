import { InjectionToken } from '@needle-di/core';
import type { CompanyRepository } from './ports/CompanyRepository.js';
import type { JobElector } from './ports/JobElector.js';
import type { JobRepository } from './ports/JobRepository.js';
import type { JobScraper } from './ports/JobScraper.js';
import type { SkillRepository } from './ports/SkillRepository.js';
import type { ChangeJobStatus } from './use-cases/ChangeJobStatus.js';
import type { GetJob } from './use-cases/GetJob.js';
import type { GetTopJob } from './use-cases/GetTopJob.js';
import type { IngestScrapedJob } from './use-cases/IngestScrapedJob.js';
import type { ScrapeAndIngestJobs } from './use-cases/ScrapeAndIngestJobs.js';

export const ApplicationJobDI = {
  // Ports
  JobRepository: new InjectionToken<JobRepository>('ApplicationJobDI.JobRepository'),
  CompanyRepository: new InjectionToken<CompanyRepository>('ApplicationJobDI.CompanyRepository'),
  SkillRepository: new InjectionToken<SkillRepository>('ApplicationJobDI.SkillRepository'),
  JobElector: new InjectionToken<JobElector>('ApplicationJobDI.JobElector'),
  JobScraper: new InjectionToken<JobScraper>('ApplicationJobDI.JobScraper'),

  // Use cases
  IngestScrapedJob: new InjectionToken<IngestScrapedJob>('ApplicationJobDI.IngestScrapedJob'),
  ScrapeAndIngestJobs: new InjectionToken<ScrapeAndIngestJobs>('ApplicationJobDI.ScrapeAndIngestJobs'),
  GetTopJob: new InjectionToken<GetTopJob>('ApplicationJobDI.GetTopJob'),
  GetJob: new InjectionToken<GetJob>('ApplicationJobDI.GetJob'),
  ChangeJobStatus: new InjectionToken<ChangeJobStatus>('ApplicationJobDI.ChangeJobStatus')
};
