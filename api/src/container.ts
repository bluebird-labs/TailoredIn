import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import {
  AddBullet,
  AddSkillItem,
  ChangeJobStatus,
  CreateArchetype,
  CreateCompany,
  CreateEducation,
  CreateHeadline,
  CreateSkillCategory,
  DeleteArchetype,
  DeleteBullet,
  DeleteCompany,
  DeleteEducation,
  DeleteHeadline,
  DeleteSkillCategory,
  DeleteSkillItem,
  GenerateResume,
  GetJob,
  GetTopJob,
  GetUser,
  IngestJobByUrl,
  IngestScrapedJob,
  ListArchetypes,
  ListCompanies,
  ListEducation,
  ListHeadlines,
  ListJobs,
  ListSkillCategories,
  ReplaceLocations,
  SetArchetypeEducation,
  SetArchetypePositions,
  SetArchetypeSkills,
  UpdateArchetype,
  UpdateBullet,
  UpdateCompany,
  UpdateEducation,
  UpdateHeadline,
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
  PostgresCompanyRepository,
  PostgresJobRepository,
  PostgresResumeCompanyRepository,
  PostgresResumeEducationRepository,
  PostgresResumeHeadlineRepository,
  PostgresResumeSkillCategoryRepository,
  PostgresSkillRepository,
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
  provide: DI.Job.GetTopJob,
  useFactory: () => new GetTopJob(container.get(DI.Job.Repository))
});
container.bind({
  provide: DI.Job.GetJob,
  useFactory: () => new GetJob(container.get(DI.Job.Repository))
});
container.bind({
  provide: DI.Job.ChangeJobStatus,
  useFactory: () => new ChangeJobStatus(container.get(DI.Job.Repository))
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

// User use cases
container.bind({
  provide: DI.Resume.GetUser,
  useFactory: () => new GetUser(container.get(DI.Resume.UserRepository))
});
container.bind({
  provide: DI.Resume.UpdateUser,
  useFactory: () => new UpdateUser(container.get(DI.Resume.UserRepository))
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
