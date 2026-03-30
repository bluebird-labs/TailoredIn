import { InjectionToken } from '@needle-di/core';
import type {
  ChangeJobStatus,
  CreateEducation,
  CreateHeadline,
  DeleteEducation,
  DeleteHeadline,
  GenerateResume,
  GetJob,
  GetTopJob,
  GetUser,
  IngestScrapedJob,
  JobScraper,
  ListEducation,
  ListHeadlines,
  LlmService,
  ResumeContentFactory,
  ResumeRenderer,
  ScrapeAndIngestJobs,
  UpdateEducation,
  UpdateHeadline,
  UpdateUser,
  WebColorService
} from '@tailoredin/application';
import type {
  ArchetypeConfigRepository,
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
    ArchetypeConfigRepository: new InjectionToken<ArchetypeConfigRepository>('DI.Resume.ArchetypeConfigRepository'),
    LlmService: new InjectionToken<LlmService>('DI.Resume.LlmService'),
    WebColorService: new InjectionToken<WebColorService>('DI.Resume.WebColorService'),
    Renderer: new InjectionToken<ResumeRenderer>('DI.Resume.Renderer'),
    ContentFactory: new InjectionToken<ResumeContentFactory>('DI.Resume.ContentFactory'),
    GenerateResume: new InjectionToken<GenerateResume>('DI.Resume.GenerateResume'),
    GetUser: new InjectionToken<GetUser>('DI.Resume.GetUser'),
    UpdateUser: new InjectionToken<UpdateUser>('DI.Resume.UpdateUser'),
    ListEducation: new InjectionToken<ListEducation>('DI.Resume.ListEducation'),
    CreateEducation: new InjectionToken<CreateEducation>('DI.Resume.CreateEducation'),
    UpdateEducation: new InjectionToken<UpdateEducation>('DI.Resume.UpdateEducation'),
    DeleteEducation: new InjectionToken<DeleteEducation>('DI.Resume.DeleteEducation'),
    ListHeadlines: new InjectionToken<ListHeadlines>('DI.Resume.ListHeadlines'),
    CreateHeadline: new InjectionToken<CreateHeadline>('DI.Resume.CreateHeadline'),
    UpdateHeadline: new InjectionToken<UpdateHeadline>('DI.Resume.UpdateHeadline'),
    DeleteHeadline: new InjectionToken<DeleteHeadline>('DI.Resume.DeleteHeadline')
  }
};
