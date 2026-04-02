import { InjectionToken } from '@needle-di/core';
import type {
  AddBullet,
  AddSkillItem,
  BulkChangeJobStatus,
  ChangeJobStatus,
  CreateArchetype,
  CreateEducation,
  CreateExperience,
  CreateHeadline,
  CreateSkillCategory,
  DeleteArchetype,
  DeleteBullet,
  DeleteEducation,
  DeleteExperience,
  DeleteHeadline,
  DeleteSkillCategory,
  DeleteSkillItem,
  GenerateCompanyBrief,
  GenerateResume,
  GenerateResumeFromJob,
  GetCompanyBrief,
  GetJob,
  GetJobCompany,
  GetProfile,
  IngestJobByUrl,
  IngestScrapedJob,
  JobScraper,
  ListArchetypes,
  ListEducation,
  ListExperiences,
  ListHeadlines,
  ListJobs,
  ListSkillCategories,
  ListTags,
  LlmService,
  ResumeContentFactory,
  ResumeRenderer,
  ScrapeAndIngestJobs,
  SetArchetypeContent,
  SetArchetypeTagProfile,
  UpdateArchetype,
  UpdateBullet,
  UpdateEducation,
  UpdateExperience,
  UpdateHeadline,
  UpdateJobCompany,
  UpdateProfile,
  UpdateSkillCategory,
  UpdateSkillItem
} from '@tailoredin/application';
import type {
  ArchetypeRepository,
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
    Renderer: new InjectionToken<ResumeRenderer>('DI.Resume.Renderer'),
    ContentFactory: new InjectionToken<ResumeContentFactory>('DI.Resume.ContentFactory'),
    GenerateResume: new InjectionToken<GenerateResume>('DI.Resume.GenerateResume'),
    GenerateResumeFromJob: new InjectionToken<GenerateResumeFromJob>('DI.Resume.GenerateResumeFromJob')
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
    Repository: new InjectionToken<ArchetypeRepository>('DI.Archetype.Repository'),
    List: new InjectionToken<ListArchetypes>('DI.Archetype.List'),
    Create: new InjectionToken<CreateArchetype>('DI.Archetype.Create'),
    Update: new InjectionToken<UpdateArchetype>('DI.Archetype.Update'),
    Delete: new InjectionToken<DeleteArchetype>('DI.Archetype.Delete'),
    SetContent: new InjectionToken<SetArchetypeContent>('DI.Archetype.SetContent'),
    SetTagProfile: new InjectionToken<SetArchetypeTagProfile>('DI.Archetype.SetTagProfile')
  }
};
