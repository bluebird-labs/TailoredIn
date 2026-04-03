import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import {
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
  ListArchetypes,
  ListEducation,
  ListExperiences,
  ListHeadlines,
  ListJobs,
  ListSkillCategories,
  ListTags,
  SetArchetypeContent,
  SetArchetypeTagProfile,
  SuggestBullets,
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
  PostgresArchetypeRepository,
  PostgresCompanyBriefRepository,
  PostgresCompanyRepository,
  PostgresEducationRepository,
  PostgresExperienceRepository,
  PostgresHeadlineRepository,
  PostgresJobRepository,
  PostgresProfileRepository,
  PostgresSkillCategoryRepository,
  PostgresSkillRepository,
  PostgresTagRepository,
  StructuredLlmRouter,
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

// Structured LLM client
container.bind({ provide: DI.Llm.StructuredClient, useClass: StructuredLlmRouter });

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

// Resume services
const openAiApiKey = envOptional('OPENAI_API_KEY');
const openAiProject = envOptional('OPENAI_PROJECT_ID');
export const llmAvailable = !!(openAiApiKey && openAiProject);

if (llmAvailable) {
  container.bind({ provide: OPENAI_CONFIG, useValue: { apiKey: openAiApiKey, project: openAiProject } });
  container.bind({ provide: DI.Resume.LlmService, useClass: OpenAiLlmService });
} else {
  container.bind({ provide: DI.Resume.LlmService, useValue: null });
}
container.bind({ provide: DI.Resume.Renderer, useClass: TypstResumeRenderer });
container.bind({
  provide: DI.Resume.ContentFactory,
  useFactory: () =>
    new DatabaseResumeContentFactory(
      container.get(DI.Profile.Repository),
      container.get(DI.Archetype.Repository),
      container.get(DI.Experience.Repository),
      container.get(DI.Education.Repository),
      container.get(DI.SkillCategory.Repository)
    )
});
container.bind({
  provide: DI.Resume.GenerateResume,
  useFactory: () =>
    new GenerateResume(
      container.get(DI.Profile.Repository),
      container.get(DI.Resume.ContentFactory),
      container.get(DI.Resume.Renderer)
    )
});
container.bind({
  provide: DI.Resume.GenerateResumeFromJob,
  useFactory: () =>
    new GenerateResumeFromJob(
      container.get(DI.Job.Repository),
      container.get(DI.Profile.Repository),
      container.get(DI.Archetype.Repository),
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

// Education
container.bind({ provide: DI.Education.Repository, useClass: PostgresEducationRepository });
container.bind({
  provide: DI.Education.ListEducation,
  useFactory: () => new ListEducation(container.get(DI.Education.Repository))
});
container.bind({
  provide: DI.Education.CreateEducation,
  useFactory: () => new CreateEducation(container.get(DI.Education.Repository))
});
container.bind({
  provide: DI.Education.UpdateEducation,
  useFactory: () => new UpdateEducation(container.get(DI.Education.Repository))
});
container.bind({
  provide: DI.Education.DeleteEducation,
  useFactory: () => new DeleteEducation(container.get(DI.Education.Repository))
});

// Headlines
container.bind({ provide: DI.Headline.Repository, useClass: PostgresHeadlineRepository });
container.bind({ provide: DI.Tag.Repository, useClass: PostgresTagRepository });
container.bind({
  provide: DI.Headline.List,
  useFactory: () => new ListHeadlines(container.get(DI.Headline.Repository))
});
container.bind({
  provide: DI.Headline.Create,
  useFactory: () => new CreateHeadline(container.get(DI.Headline.Repository), container.get(DI.Tag.Repository))
});
container.bind({
  provide: DI.Headline.Update,
  useFactory: () => new UpdateHeadline(container.get(DI.Headline.Repository), container.get(DI.Tag.Repository))
});
container.bind({
  provide: DI.Headline.Delete,
  useFactory: () => new DeleteHeadline(container.get(DI.Headline.Repository))
});

// Tags
container.bind({
  provide: DI.Tag.List,
  useFactory: () => new ListTags(container.get(DI.Tag.Repository))
});

// Experience
container.bind({ provide: DI.Experience.Repository, useClass: PostgresExperienceRepository });
container.bind({
  provide: DI.Experience.List,
  useFactory: () => new ListExperiences(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.Create,
  useFactory: () => new CreateExperience(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.Update,
  useFactory: () => new UpdateExperience(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.Delete,
  useFactory: () => new DeleteExperience(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.AddBullet,
  useFactory: () => new AddBullet(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.UpdateBullet,
  useFactory: () => new UpdateBullet(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.DeleteBullet,
  useFactory: () => new DeleteBullet(container.get(DI.Experience.Repository))
});
// SkillCategory
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

// Archetype
container.bind({ provide: DI.Archetype.Repository, useClass: PostgresArchetypeRepository });
container.bind({
  provide: DI.Archetype.List,
  useFactory: () => new ListArchetypes(container.get(DI.Archetype.Repository))
});
container.bind({
  provide: DI.Archetype.Create,
  useFactory: () => new CreateArchetype(container.get(DI.Archetype.Repository))
});
container.bind({
  provide: DI.Archetype.Update,
  useFactory: () => new UpdateArchetype(container.get(DI.Archetype.Repository))
});
container.bind({
  provide: DI.Archetype.Delete,
  useFactory: () => new DeleteArchetype(container.get(DI.Archetype.Repository))
});
container.bind({
  provide: DI.Archetype.SetContent,
  useFactory: () => new SetArchetypeContent(container.get(DI.Archetype.Repository))
});
container.bind({
  provide: DI.Archetype.SetTagProfile,
  useFactory: () => new SetArchetypeTagProfile(container.get(DI.Archetype.Repository))
});
container.bind({
  provide: DI.Archetype.SuggestBullets,
  useFactory: () => new SuggestBullets(container.get(DI.Experience.Repository), container.get(DI.Llm.StructuredClient))
});

export { container };
