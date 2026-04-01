import { InjectionToken } from '@needle-di/core';
import type {
  AddBullet2,
  AddBulletVariant,
  AddSkillItem,
  ApproveBulletVariant,
  BulkChangeJobStatus,
  ChangeJobStatus,
  CreateArchetype2,
  CreateEducation2,
  CreateExperience,
  CreateHeadline2,
  CreateSkillCategory,
  DeleteArchetype2,
  DeleteBullet2,
  DeleteBulletVariant,
  DeleteEducation2,
  DeleteExperience,
  DeleteHeadline2,
  DeleteSkillCategory,
  DeleteSkillItem,
  GenerateCompanyBrief,
  GenerateResume,
  GetCompanyBrief,
  GetJob,
  GetJobCompany,
  GetProfile,
  IngestJobByUrl,
  IngestScrapedJob,
  JobScraper,
  ListArchetypes2,
  ListEducation2,
  ListExperiences,
  ListHeadlines2,
  ListJobs,
  ListSkillCategories,
  ListTags,
  LlmService,
  ResumeContentFactory,
  ResumeRenderer,
  ScrapeAndIngestJobs,
  SetArchetypeContent2,
  SetArchetypeTagProfile2,
  UpdateArchetype2,
  UpdateBullet2,
  UpdateBulletVariant,
  UpdateEducation2,
  UpdateExperience,
  UpdateHeadline2,
  UpdateJobCompany,
  UpdateProfile,
  UpdateSkillCategory,
  UpdateSkillItem,
  WebColorService
} from '@tailoredin/application';
import type {
  ArchetypeRepository2,
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
    WebColorService: new InjectionToken<WebColorService>('DI.Resume.WebColorService'),
    Renderer: new InjectionToken<ResumeRenderer>('DI.Resume.Renderer'),
    ContentFactory: new InjectionToken<ResumeContentFactory>('DI.Resume.ContentFactory'),
    GenerateResume: new InjectionToken<GenerateResume>('DI.Resume.GenerateResume')
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
    List: new InjectionToken<ListHeadlines2>('DI.Headline.List'),
    Create: new InjectionToken<CreateHeadline2>('DI.Headline.Create'),
    Update: new InjectionToken<UpdateHeadline2>('DI.Headline.Update'),
    Delete: new InjectionToken<DeleteHeadline2>('DI.Headline.Delete')
  },

  Tag: {
    Repository: new InjectionToken<TagRepository>('DI.Tag.Repository'),
    List: new InjectionToken<ListTags>('DI.Tag.List')
  },

  Education: {
    Repository: new InjectionToken<EducationRepository>('DI.Education.Repository'),
    ListEducation: new InjectionToken<ListEducation2>('DI.Education.ListEducation'),
    CreateEducation: new InjectionToken<CreateEducation2>('DI.Education.CreateEducation'),
    UpdateEducation: new InjectionToken<UpdateEducation2>('DI.Education.UpdateEducation'),
    DeleteEducation: new InjectionToken<DeleteEducation2>('DI.Education.DeleteEducation')
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
    AddBullet: new InjectionToken<AddBullet2>('DI.Experience.AddBullet'),
    UpdateBullet: new InjectionToken<UpdateBullet2>('DI.Experience.UpdateBullet'),
    DeleteBullet: new InjectionToken<DeleteBullet2>('DI.Experience.DeleteBullet'),
    AddVariant: new InjectionToken<AddBulletVariant>('DI.Experience.AddVariant'),
    UpdateVariant: new InjectionToken<UpdateBulletVariant>('DI.Experience.UpdateVariant'),
    DeleteVariant: new InjectionToken<DeleteBulletVariant>('DI.Experience.DeleteVariant'),
    ApproveVariant: new InjectionToken<ApproveBulletVariant>('DI.Experience.ApproveVariant')
  },

  Archetype2: {
    Repository: new InjectionToken<ArchetypeRepository2>('DI.Archetype2.Repository'),
    List: new InjectionToken<ListArchetypes2>('DI.Archetype2.List'),
    Create: new InjectionToken<CreateArchetype2>('DI.Archetype2.Create'),
    Update: new InjectionToken<UpdateArchetype2>('DI.Archetype2.Update'),
    Delete: new InjectionToken<DeleteArchetype2>('DI.Archetype2.Delete'),
    SetContent: new InjectionToken<SetArchetypeContent2>('DI.Archetype2.SetContent'),
    SetTagProfile: new InjectionToken<SetArchetypeTagProfile2>('DI.Archetype2.SetTagProfile')
  }
};
