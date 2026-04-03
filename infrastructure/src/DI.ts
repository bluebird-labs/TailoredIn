import { InjectionToken } from '@needle-di/core';
import type {
  AddBullet,
  AddSkillItem,
  BulkChangeJobStatus,
  ChangeJobStatus,
  CreateEducation,
  CreateExperience,
  CreateHeadline,
  CreateSkillCategory,
  CreateTailoredResume,
  DeleteBullet,
  DeleteEducation,
  DeleteExperience,
  DeleteHeadline,
  DeleteSkillCategory,
  DeleteSkillItem,
  GenerateCompanyBrief,
  GenerateResume,
  GenerateResumeMarkdown,
  GenerateResumeProfilePdf,
  GenerateTailoredResumePdf,
  GetCompanyBrief,
  GetJob,
  GetJobCompany,
  GetProfile,
  GetResumeProfile,
  GetTailoredResume,
  IngestJobByUrl,
  IngestScrapedJob,
  JobScraper,
  ListEducation,
  ListExperiences,
  ListHeadlines,
  ListJobs,
  ListSkillCategories,
  ListTags,
  ListTailoredResumes,
  LlmService,
  ResumeContentFactory,
  ResumeProfileRepository,
  ResumeRenderer,
  ResumeTailoringService,
  ScrapeAndIngestJobs,
  StructuredLlmClient,
  SuggestBullets,
  TailoredResumeRepository,
  UpdateBullet,
  UpdateEducation,
  UpdateExperience,
  UpdateHeadline,
  UpdateJobCompany,
  UpdateProfile,
  UpdateResumeProfile,
  UpdateSkillCategory,
  UpdateSkillItem,
  UpdateTailoredResume
} from '@tailoredin/application';
import type {
  CompanyBriefRepository,
  CompanyRepository,
  EducationRepository,
  ExperienceRepository,
  HeadlineRepository,
  JobElector,
  JobRepository,
  ProfileRepository,
  SkillCategoryRepository,
  SkillRepository,
  TagRepository
} from '@tailoredin/domain';

export const DI = {
  Llm: {
    StructuredClient: new InjectionToken<StructuredLlmClient>('DI.Llm.StructuredClient')
  },

  Job: {
    Repository: new InjectionToken<JobRepository>('DI.Job.Repository'),
    CompanyRepository: new InjectionToken<CompanyRepository>('DI.Job.CompanyRepository'),
    SkillRepository: new InjectionToken<SkillRepository>('DI.Job.SkillRepository'),
    Elector: new InjectionToken<JobElector>('DI.Job.Elector'),
    Scraper: new InjectionToken<JobScraper>('DI.Job.Scraper'),
    IngestJobByUrl: new InjectionToken<IngestJobByUrl>('DI.Job.IngestJobByUrl'),
    IngestScrapedJob: new InjectionToken<IngestScrapedJob>('DI.Job.IngestScrapedJob'),
    ScrapeAndIngestJobs: new InjectionToken<ScrapeAndIngestJobs>('DI.Job.ScrapeAndIngestJobs'),
    GetJob: new InjectionToken<GetJob>('DI.Job.GetJob'),
    ChangeJobStatus: new InjectionToken<ChangeJobStatus>('DI.Job.ChangeJobStatus'),
    BulkChangeJobStatus: new InjectionToken<BulkChangeJobStatus>('DI.Job.BulkChangeJobStatus'),
    ListJobs: new InjectionToken<ListJobs>('DI.Job.ListJobs'),
    GetJobCompany: new InjectionToken<GetJobCompany>('DI.Job.GetJobCompany'),
    UpdateJobCompany: new InjectionToken<UpdateJobCompany>('DI.Job.UpdateJobCompany')
  },

  Resume: {
    LlmService: new InjectionToken<LlmService | null>('DI.Resume.LlmService'),
    Renderer: new InjectionToken<ResumeRenderer>('DI.Resume.Renderer'),
    ContentFactory: new InjectionToken<ResumeContentFactory>('DI.Resume.ContentFactory'),
    GenerateResume: new InjectionToken<GenerateResume>('DI.Resume.GenerateResume'),
    GenerateResumeMarkdown: new InjectionToken<GenerateResumeMarkdown>('DI.Resume.GenerateResumeMarkdown'),
    TailoringService: new InjectionToken<ResumeTailoringService>('DI.Resume.TailoringService')
  },

  ResumeProfile: {
    Repository: new InjectionToken<ResumeProfileRepository>('DI.ResumeProfile.Repository'),
    Get: new InjectionToken<GetResumeProfile>('DI.ResumeProfile.Get'),
    Update: new InjectionToken<UpdateResumeProfile>('DI.ResumeProfile.Update'),
    GeneratePdf: new InjectionToken<GenerateResumeProfilePdf>('DI.ResumeProfile.GeneratePdf')
  },

  TailoredResume: {
    Repository: new InjectionToken<TailoredResumeRepository>('DI.TailoredResume.Repository'),
    Create: new InjectionToken<CreateTailoredResume>('DI.TailoredResume.Create'),
    Get: new InjectionToken<GetTailoredResume>('DI.TailoredResume.Get'),
    List: new InjectionToken<ListTailoredResumes>('DI.TailoredResume.List'),
    Update: new InjectionToken<UpdateTailoredResume>('DI.TailoredResume.Update'),
    GeneratePdf: new InjectionToken<GenerateTailoredResumePdf>('DI.TailoredResume.GeneratePdf')
  },

  Profile: {
    Repository: new InjectionToken<ProfileRepository>('DI.Profile.Repository'),
    GetProfile: new InjectionToken<GetProfile>('DI.Profile.GetProfile'),
    UpdateProfile: new InjectionToken<UpdateProfile>('DI.Profile.UpdateProfile')
  },

  CompanyBrief: {
    Repository: new InjectionToken<CompanyBriefRepository>('DI.CompanyBrief.Repository'),
    GenerateCompanyBrief: new InjectionToken<GenerateCompanyBrief>('DI.CompanyBrief.GenerateCompanyBrief'),
    GetCompanyBrief: new InjectionToken<GetCompanyBrief>('DI.CompanyBrief.GetCompanyBrief')
  },

  Headline: {
    Repository: new InjectionToken<HeadlineRepository>('DI.Headline.Repository'),
    List: new InjectionToken<ListHeadlines>('DI.Headline.List'),
    Create: new InjectionToken<CreateHeadline>('DI.Headline.Create'),
    Update: new InjectionToken<UpdateHeadline>('DI.Headline.Update'),
    Delete: new InjectionToken<DeleteHeadline>('DI.Headline.Delete')
  },

  Tag: {
    Repository: new InjectionToken<TagRepository>('DI.Tag.Repository'),
    List: new InjectionToken<ListTags>('DI.Tag.List')
  },

  Education: {
    Repository: new InjectionToken<EducationRepository>('DI.Education.Repository'),
    ListEducation: new InjectionToken<ListEducation>('DI.Education.ListEducation'),
    CreateEducation: new InjectionToken<CreateEducation>('DI.Education.CreateEducation'),
    UpdateEducation: new InjectionToken<UpdateEducation>('DI.Education.UpdateEducation'),
    DeleteEducation: new InjectionToken<DeleteEducation>('DI.Education.DeleteEducation')
  },

  SkillCategory: {
    Repository: new InjectionToken<SkillCategoryRepository>('DI.SkillCategory.Repository'),
    ListSkillCategories: new InjectionToken<ListSkillCategories>('DI.SkillCategory.ListSkillCategories'),
    CreateSkillCategory: new InjectionToken<CreateSkillCategory>('DI.SkillCategory.CreateSkillCategory'),
    UpdateSkillCategory: new InjectionToken<UpdateSkillCategory>('DI.SkillCategory.UpdateSkillCategory'),
    DeleteSkillCategory: new InjectionToken<DeleteSkillCategory>('DI.SkillCategory.DeleteSkillCategory'),
    AddSkillItem: new InjectionToken<AddSkillItem>('DI.SkillCategory.AddSkillItem'),
    UpdateSkillItem: new InjectionToken<UpdateSkillItem>('DI.SkillCategory.UpdateSkillItem'),
    DeleteSkillItem: new InjectionToken<DeleteSkillItem>('DI.SkillCategory.DeleteSkillItem')
  },

  Experience: {
    Repository: new InjectionToken<ExperienceRepository>('DI.Experience.Repository'),
    List: new InjectionToken<ListExperiences>('DI.Experience.List'),
    Create: new InjectionToken<CreateExperience>('DI.Experience.Create'),
    Update: new InjectionToken<UpdateExperience>('DI.Experience.Update'),
    Delete: new InjectionToken<DeleteExperience>('DI.Experience.Delete'),
    AddBullet: new InjectionToken<AddBullet>('DI.Experience.AddBullet'),
    UpdateBullet: new InjectionToken<UpdateBullet>('DI.Experience.UpdateBullet'),
    DeleteBullet: new InjectionToken<DeleteBullet>('DI.Experience.DeleteBullet')
  },

  Archetype: {
    SuggestBullets: new InjectionToken<SuggestBullets>('DI.Archetype.SuggestBullets')
  }
};
