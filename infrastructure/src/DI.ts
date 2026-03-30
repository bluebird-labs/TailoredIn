import { InjectionToken } from '@needle-di/core';
import type {
  ChangeJobStatus,
  GenerateResume,
  GetJob,
  GetTopJob,
  IngestScrapedJob,
  JobScraper,
  LlmService,
  ResumeContentFactory,
  ResumeRenderer,
  ScrapeAndIngestJobs,
  WebColorService
} from '@tailoredin/application';
import type {
  CompanyRepository,
  JobElector,
  JobRepository,
  ResumeCompanyRepository,
  ResumeEducationRepository,
  ResumeHeadlineRepository,
  ResumeSkillCategoryRepository,
  SkillRepository,
  UserRepository
} from '@tailoredin/domain';

export const DI = {
  Job: {
    Repository: new InjectionToken<JobRepository>('DI.Job.Repository'),
    CompanyRepository: new InjectionToken<CompanyRepository>('DI.Job.CompanyRepository'),
    SkillRepository: new InjectionToken<SkillRepository>('DI.Job.SkillRepository'),
    Elector: new InjectionToken<JobElector>('DI.Job.Elector'),
    Scraper: new InjectionToken<JobScraper>('DI.Job.Scraper'),
    IngestScrapedJob: new InjectionToken<IngestScrapedJob>('DI.Job.IngestScrapedJob'),
    ScrapeAndIngestJobs: new InjectionToken<ScrapeAndIngestJobs>('DI.Job.ScrapeAndIngestJobs'),
    GetTopJob: new InjectionToken<GetTopJob>('DI.Job.GetTopJob'),
    GetJob: new InjectionToken<GetJob>('DI.Job.GetJob'),
    ChangeJobStatus: new InjectionToken<ChangeJobStatus>('DI.Job.ChangeJobStatus')
  },

  Resume: {
    UserRepository: new InjectionToken<UserRepository>('DI.Resume.UserRepository'),
    CompanyRepository: new InjectionToken<ResumeCompanyRepository>('DI.Resume.CompanyRepository'),
    EducationRepository: new InjectionToken<ResumeEducationRepository>('DI.Resume.EducationRepository'),
    HeadlineRepository: new InjectionToken<ResumeHeadlineRepository>('DI.Resume.HeadlineRepository'),
    SkillCategoryRepository: new InjectionToken<ResumeSkillCategoryRepository>('DI.Resume.SkillCategoryRepository'),
    LlmService: new InjectionToken<LlmService>('DI.Resume.LlmService'),
    WebColorService: new InjectionToken<WebColorService>('DI.Resume.WebColorService'),
    Renderer: new InjectionToken<ResumeRenderer>('DI.Resume.Renderer'),
    ContentFactory: new InjectionToken<ResumeContentFactory>('DI.Resume.ContentFactory'),
    GenerateResume: new InjectionToken<GenerateResume>('DI.Resume.GenerateResume')
  }
};
