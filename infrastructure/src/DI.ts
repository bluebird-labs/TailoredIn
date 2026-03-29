import { InjectionToken } from '@needle-di/core';
import type {
  ChangeJobStatus,
  CompanyRepository,
  GenerateResume,
  GetJob,
  GetTopJob,
  IngestScrapedJob,
  JobElector,
  JobRepository,
  JobScraper,
  LlmService,
  ResumeContentFactory,
  ResumeRenderer,
  ScrapeAndIngestJobs,
  SkillRepository,
  WebColorService
} from '@tailoredin/application';

export const DI = {
  // Job ports
  JobRepository: new InjectionToken<JobRepository>('DI.JobRepository'),
  CompanyRepository: new InjectionToken<CompanyRepository>('DI.CompanyRepository'),
  SkillRepository: new InjectionToken<SkillRepository>('DI.SkillRepository'),
  JobElector: new InjectionToken<JobElector>('DI.JobElector'),
  JobScraper: new InjectionToken<JobScraper>('DI.JobScraper'),

  // Resume ports
  LlmService: new InjectionToken<LlmService>('DI.LlmService'),
  WebColorService: new InjectionToken<WebColorService>('DI.WebColorService'),
  ResumeRenderer: new InjectionToken<ResumeRenderer>('DI.ResumeRenderer'),
  ResumeContentFactory: new InjectionToken<ResumeContentFactory>('DI.ResumeContentFactory'),

  // Job use cases
  IngestScrapedJob: new InjectionToken<IngestScrapedJob>('DI.IngestScrapedJob'),
  ScrapeAndIngestJobs: new InjectionToken<ScrapeAndIngestJobs>('DI.ScrapeAndIngestJobs'),
  GetTopJob: new InjectionToken<GetTopJob>('DI.GetTopJob'),
  GetJob: new InjectionToken<GetJob>('DI.GetJob'),
  ChangeJobStatus: new InjectionToken<ChangeJobStatus>('DI.ChangeJobStatus'),

  // Resume use cases
  GenerateResume: new InjectionToken<GenerateResume>('DI.GenerateResume')
};
