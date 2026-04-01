import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import {
  AddBullet,
  AddSkillItem,
  BulkChangeJobStatus,
  ChangeJobStatus,
  CreateArchetype,
  CreateCompany,
  CreateEducation,
  CreateEducation2,
  CreateHeadline,
  CreateHeadline2,
  CreatePosition,
  CreateSkillCategory,
  DeleteArchetype,
  DeleteBullet,
  DeleteCompany,
  DeleteEducation,
  DeleteEducation2,
  DeleteHeadline,
  DeleteHeadline2,
  DeletePosition,
  DeleteSkillCategory,
  DeleteSkillItem,
  GenerateCompanyBrief,
  GenerateResume,
  GetCompanyBrief,
  GetJob,
  GetJobCompany,
  GetProfile,
  GetUser,
  IngestJobByUrl,
  IngestScrapedJob,
  ListArchetypes,
  ListCompanies,
  ListEducation,
  ListEducation2,
  ListHeadlines,
  ListHeadlines2,
  ListJobs,
  ListSkillCategories,
  ListTags,
  ReplaceLocations,
  SetArchetypeEducation,
  SetArchetypePositions,
  SetArchetypeSkills,
  UpdateArchetype,
  UpdateBullet,
  UpdateCompany,
  UpdateEducation,
  UpdateEducation2,
  UpdateHeadline,
  UpdateHeadline2,
  UpdateJobCompany,
  UpdatePosition,
  UpdateProfile,
  UpdateSkillCategory,
  UpdateSkillItem,
  UpdateUser
} from '@tailoredin/application';
import { env, envBool, envInt, envOptional } from '@tailoredin/core';
import { JobElectionService } from '@tailoredin/domain';
import {
  createOrmConfig,
  DatabaseResumeContentFactory,
  DI,
  OPENAI_CONFIG,
  OpenAiLlmService,
  PLAYWRIGHT_JOB_SCRAPER_CONFIG,
  PlaywrightJobScraper,
  PlaywrightWebColorService,
  PostgresArchetypeConfigRepository,
  PostgresCompanyBriefRepository,
  PostgresCompanyRepository,
  PostgresEducationRepository,
  PostgresHeadlineRepository,
  PostgresJobRepository,
  PostgresProfileRepository,
  PostgresResumeCompanyRepository,
  PostgresResumeEducationRepository,
  PostgresResumeHeadlineRepository,
  PostgresResumeSkillCategoryRepository,
  PostgresSkillCategoryRepository,
  PostgresSkillRepository,
  PostgresTagRepository,
  PostgresUserRepository,
  TypstResumeRenderer
} from '@tailoredin/infrastructure';

const orm = await MikroORM.init(
  createOrmConfig({
    timezone: env('TZ'),
    user: env('POSTGRES_USER'),
    password: env('POSTGRES_PASSWORD'),
    dbName: env('POSTGRES_DB'),
    schema: env('POSTGRES_SCHEMA'),
    host: env('POSTGRES_HOST'),
    port: envInt('POSTGRES_PORT')
  })
);

const container = new Container();

// Infrastructure: ORM
container.bind({ provide: MikroORM, useValue: orm });

// Job repositories + services
container.bind({ provide: DI.Job.Repository, useClass: PostgresJobRepository });
container.bind({ provide: DI.Job.CompanyRepository, useClass: PostgresCompanyRepository });
container.bind({ provide: DI.Job.SkillRepository, useClass: PostgresSkillRepository });
container.bind({ provide: DI.Job.Elector, useValue: new JobElectionService() });
container.bind({
  provide: PLAYWRIGHT_JOB_SCRAPER_CONFIG,
  useValue: {
    headless: envBool('HEADLESS'),
    slowMo: envInt('SLOW_MO'),
    email: env('LINKEDIN_EMAIL'),
    password: env('LINKEDIN_PASSWORD')
  }
});
container.bind({ provide: DI.Job.Scraper, useClass: PlaywrightJobScraper });

// Job use cases
container.bind({
  provide: DI.Job.GetJob,
  useFactory: () => new GetJob(container.get(DI.Job.Repository))
});
container.bind({
  provide: DI.Job.ChangeJobStatus,
  useFactory: () => new ChangeJobStatus(container.get(DI.Job.Repository))
});
container.bind({
  provide: DI.Job.BulkChangeJobStatus,
  useFactory: () => new BulkChangeJobStatus(container.get(DI.Job.Repository))
});
container.bind({
  provide: DI.Job.ListJobs,
  useFactory: () => new ListJobs(container.get(DI.Job.Repository))
});
container.bind({
  provide: DI.Job.IngestScrapedJob,
  useFactory: () =>
    new IngestScrapedJob(
      container.get(DI.Job.Repository),
      container.get(DI.Job.CompanyRepository),
      container.get(DI.Job.Elector)
    )
});
container.bind({
  provide: DI.Job.IngestJobByUrl,
  useFactory: () =>
    new IngestJobByUrl(
      container.get(DI.Job.Scraper),
      container.get(DI.Job.Repository),
      container.get(DI.Job.IngestScrapedJob)
    )
});
container.bind({
  provide: DI.Job.GetJobCompany,
  useFactory: () => new GetJobCompany(container.get(DI.Job.CompanyRepository))
});
container.bind({
  provide: DI.Job.UpdateJobCompany,
  useFactory: () => new UpdateJobCompany(container.get(DI.Job.CompanyRepository))
});

// Resume repositories + services
container.bind({ provide: DI.Resume.UserRepository, useClass: PostgresUserRepository });
container.bind({ provide: DI.Resume.CompanyRepository, useClass: PostgresResumeCompanyRepository });
container.bind({ provide: DI.Resume.EducationRepository, useClass: PostgresResumeEducationRepository });
container.bind({ provide: DI.Resume.HeadlineRepository, useClass: PostgresResumeHeadlineRepository });
container.bind({ provide: DI.Resume.SkillCategoryRepository, useClass: PostgresResumeSkillCategoryRepository });
container.bind({ provide: DI.Resume.ArchetypeConfigRepository, useClass: PostgresArchetypeConfigRepository });
const openAiApiKey = envOptional('OPENAI_API_KEY');
const openAiProject = envOptional('OPENAI_PROJECT_ID');
export const llmAvailable = !!(openAiApiKey && openAiProject);

if (llmAvailable) {
  container.bind({ provide: OPENAI_CONFIG, useValue: { apiKey: openAiApiKey, project: openAiProject } });
  container.bind({ provide: DI.Resume.LlmService, useClass: OpenAiLlmService });
} else {
  container.bind({ provide: DI.Resume.LlmService, useValue: null });
}
container.bind({ provide: DI.Resume.WebColorService, useClass: PlaywrightWebColorService });
container.bind({ provide: DI.Resume.Renderer, useClass: TypstResumeRenderer });
container.bind({
  provide: DI.Resume.ContentFactory,
  useFactory: () =>
    new DatabaseResumeContentFactory(
      container.get(DI.Resume.UserRepository),
      container.get(DI.Resume.HeadlineRepository),
      container.get(DI.Resume.ArchetypeConfigRepository),
      container.get(DI.Resume.CompanyRepository),
      container.get(DI.Resume.EducationRepository),
      container.get(DI.Resume.SkillCategoryRepository)
    )
});

// Resume use cases
container.bind({
  provide: DI.Resume.GenerateResume,
  useFactory: () =>
    new GenerateResume(
      container.get(DI.Job.Repository),
      container.get(DI.Resume.UserRepository),
      container.get(DI.Resume.LlmService),
      container.get(DI.Resume.WebColorService),
      container.get(DI.Resume.Renderer),
      container.get(DI.Resume.ContentFactory)
    )
});

// Company Brief
container.bind({ provide: DI.CompanyBrief.Repository, useClass: PostgresCompanyBriefRepository });
container.bind({
  provide: DI.CompanyBrief.GenerateCompanyBrief,
  useFactory: () =>
    new GenerateCompanyBrief(
      container.get(DI.Job.Repository),
      container.get(DI.CompanyBrief.Repository),
      container.get(DI.Resume.LlmService)
    )
});
container.bind({
  provide: DI.CompanyBrief.GetCompanyBrief,
  useFactory: () => new GetCompanyBrief(container.get(DI.Job.Repository), container.get(DI.CompanyBrief.Repository))
});

// User use cases
container.bind({
  provide: DI.Resume.GetUser,
  useFactory: () => new GetUser(container.get(DI.Resume.UserRepository))
});
container.bind({
  provide: DI.Resume.UpdateUser,
  useFactory: () => new UpdateUser(container.get(DI.Resume.UserRepository))
});

// Profile
container.bind({ provide: DI.Profile.Repository, useClass: PostgresProfileRepository });
container.bind({
  provide: DI.Profile.GetProfile,
  useFactory: () => new GetProfile(container.get(DI.Profile.Repository))
});
container.bind({
  provide: DI.Profile.UpdateProfile,
  useFactory: () => new UpdateProfile(container.get(DI.Profile.Repository))
});

// Education use cases
container.bind({
  provide: DI.Resume.ListEducation,
  useFactory: () => new ListEducation(container.get(DI.Resume.EducationRepository))
});
container.bind({
  provide: DI.Resume.CreateEducation,
  useFactory: () => new CreateEducation(container.get(DI.Resume.EducationRepository))
});
container.bind({
  provide: DI.Resume.UpdateEducation,
  useFactory: () => new UpdateEducation(container.get(DI.Resume.EducationRepository))
});
container.bind({
  provide: DI.Resume.DeleteEducation,
  useFactory: () => new DeleteEducation(container.get(DI.Resume.EducationRepository))
});

// Education (new domain model)
container.bind({ provide: DI.Education.Repository, useClass: PostgresEducationRepository });
container.bind({
  provide: DI.Education.ListEducation,
  useFactory: () => new ListEducation2(container.get(DI.Education.Repository))
});
container.bind({
  provide: DI.Education.CreateEducation,
  useFactory: () => new CreateEducation2(container.get(DI.Education.Repository))
});
container.bind({
  provide: DI.Education.UpdateEducation,
  useFactory: () => new UpdateEducation2(container.get(DI.Education.Repository))
});
container.bind({
  provide: DI.Education.DeleteEducation,
  useFactory: () => new DeleteEducation2(container.get(DI.Education.Repository))
});

// Headline use cases
container.bind({
  provide: DI.Resume.ListHeadlines,
  useFactory: () => new ListHeadlines(container.get(DI.Resume.HeadlineRepository))
});
container.bind({
  provide: DI.Resume.CreateHeadline,
  useFactory: () => new CreateHeadline(container.get(DI.Resume.HeadlineRepository))
});
container.bind({
  provide: DI.Resume.UpdateHeadline,
  useFactory: () => new UpdateHeadline(container.get(DI.Resume.HeadlineRepository))
});
container.bind({
  provide: DI.Resume.DeleteHeadline,
  useFactory: () => new DeleteHeadline(container.get(DI.Resume.HeadlineRepository))
});

// S2 Headlines (new domain model)
container.bind({ provide: DI.Headline.Repository, useClass: PostgresHeadlineRepository });
container.bind({ provide: DI.Tag.Repository, useClass: PostgresTagRepository });
container.bind({
  provide: DI.Headline.List,
  useFactory: () => new ListHeadlines2(container.get(DI.Headline.Repository))
});
container.bind({
  provide: DI.Headline.Create,
  useFactory: () => new CreateHeadline2(container.get(DI.Headline.Repository), container.get(DI.Tag.Repository))
});
container.bind({
  provide: DI.Headline.Update,
  useFactory: () => new UpdateHeadline2(container.get(DI.Headline.Repository), container.get(DI.Tag.Repository))
});
container.bind({
  provide: DI.Headline.Delete,
  useFactory: () => new DeleteHeadline2(container.get(DI.Headline.Repository))
});

// Tags
container.bind({
  provide: DI.Tag.List,
  useFactory: () => new ListTags(container.get(DI.Tag.Repository))
});

// Work Experience use cases
container.bind({
  provide: DI.Resume.ListCompanies,
  useFactory: () => new ListCompanies(container.get(DI.Resume.CompanyRepository))
});
container.bind({
  provide: DI.Resume.CreateCompany,
  useFactory: () => new CreateCompany(container.get(DI.Resume.CompanyRepository))
});
container.bind({
  provide: DI.Resume.UpdateCompany,
  useFactory: () => new UpdateCompany(container.get(DI.Resume.CompanyRepository))
});
container.bind({
  provide: DI.Resume.DeleteCompany,
  useFactory: () => new DeleteCompany(container.get(DI.Resume.CompanyRepository))
});
container.bind({
  provide: DI.Resume.CreatePosition,
  useFactory: () => new CreatePosition(container.get(DI.Resume.CompanyRepository))
});
container.bind({
  provide: DI.Resume.UpdatePosition,
  useFactory: () => new UpdatePosition(container.get(DI.Resume.CompanyRepository))
});
container.bind({
  provide: DI.Resume.DeletePosition,
  useFactory: () => new DeletePosition(container.get(DI.Resume.CompanyRepository))
});
container.bind({
  provide: DI.Resume.AddBullet,
  useFactory: () => new AddBullet(container.get(DI.Resume.CompanyRepository))
});
container.bind({
  provide: DI.Resume.UpdateBullet,
  useFactory: () => new UpdateBullet(container.get(DI.Resume.CompanyRepository))
});
container.bind({
  provide: DI.Resume.DeleteBullet,
  useFactory: () => new DeleteBullet(container.get(DI.Resume.CompanyRepository))
});
container.bind({
  provide: DI.Resume.ReplaceLocations,
  useFactory: () => new ReplaceLocations(container.get(DI.Resume.CompanyRepository))
});

// Skills use cases
container.bind({
  provide: DI.Resume.ListSkillCategories,
  useFactory: () => new ListSkillCategories(container.get(DI.Resume.SkillCategoryRepository))
});
container.bind({
  provide: DI.Resume.CreateSkillCategory,
  useFactory: () => new CreateSkillCategory(container.get(DI.Resume.SkillCategoryRepository))
});
container.bind({
  provide: DI.Resume.UpdateSkillCategory,
  useFactory: () => new UpdateSkillCategory(container.get(DI.Resume.SkillCategoryRepository))
});
container.bind({
  provide: DI.Resume.DeleteSkillCategory,
  useFactory: () => new DeleteSkillCategory(container.get(DI.Resume.SkillCategoryRepository))
});
container.bind({
  provide: DI.Resume.AddSkillItem,
  useFactory: () => new AddSkillItem(container.get(DI.Resume.SkillCategoryRepository))
});
container.bind({
  provide: DI.Resume.UpdateSkillItem,
  useFactory: () => new UpdateSkillItem(container.get(DI.Resume.SkillCategoryRepository))
});
container.bind({
  provide: DI.Resume.DeleteSkillItem,
  useFactory: () => new DeleteSkillItem(container.get(DI.Resume.SkillCategoryRepository))
});

// SkillCategory use cases (new domain model)
container.bind({ provide: DI.SkillCategory.Repository, useClass: PostgresSkillCategoryRepository });
container.bind({
  provide: DI.SkillCategory.ListSkillCategories,
  useFactory: () => new ListSkillCategories(container.get(DI.SkillCategory.Repository))
});
container.bind({
  provide: DI.SkillCategory.CreateSkillCategory,
  useFactory: () => new CreateSkillCategory(container.get(DI.SkillCategory.Repository))
});
container.bind({
  provide: DI.SkillCategory.UpdateSkillCategory,
  useFactory: () => new UpdateSkillCategory(container.get(DI.SkillCategory.Repository))
});
container.bind({
  provide: DI.SkillCategory.DeleteSkillCategory,
  useFactory: () => new DeleteSkillCategory(container.get(DI.SkillCategory.Repository))
});
container.bind({
  provide: DI.SkillCategory.AddSkillItem,
  useFactory: () => new AddSkillItem(container.get(DI.SkillCategory.Repository))
});
container.bind({
  provide: DI.SkillCategory.UpdateSkillItem,
  useFactory: () => new UpdateSkillItem(container.get(DI.SkillCategory.Repository))
});
container.bind({
  provide: DI.SkillCategory.DeleteSkillItem,
  useFactory: () => new DeleteSkillItem(container.get(DI.SkillCategory.Repository))
});

// Archetype use cases
container.bind({ provide: DI.Archetype.ConfigRepository, useClass: PostgresArchetypeConfigRepository });
container.bind({
  provide: DI.Archetype.ListArchetypes,
  useFactory: () => new ListArchetypes(container.get(DI.Archetype.ConfigRepository))
});
container.bind({
  provide: DI.Archetype.CreateArchetype,
  useFactory: () => new CreateArchetype(container.get(DI.Archetype.ConfigRepository))
});
container.bind({
  provide: DI.Archetype.UpdateArchetype,
  useFactory: () => new UpdateArchetype(container.get(DI.Archetype.ConfigRepository))
});
container.bind({
  provide: DI.Archetype.DeleteArchetype,
  useFactory: () => new DeleteArchetype(container.get(DI.Archetype.ConfigRepository))
});
container.bind({
  provide: DI.Archetype.SetPositions,
  useFactory: () => new SetArchetypePositions(container.get(DI.Archetype.ConfigRepository))
});
container.bind({
  provide: DI.Archetype.SetSkills,
  useFactory: () => new SetArchetypeSkills(container.get(DI.Archetype.ConfigRepository))
});
container.bind({
  provide: DI.Archetype.SetEducation,
  useFactory: () => new SetArchetypeEducation(container.get(DI.Archetype.ConfigRepository))
});

export { container };
