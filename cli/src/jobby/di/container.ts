import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import { env, envInt, envOptional } from '@tailoredin/core';
import { JobElectionService } from '@tailoredin/domain';
import {
  createOrmConfig,
  DatabaseResumeContentFactory,
  DI,
  OPENAI_CONFIG,
  OpenAiLlmService,
  PostgresArchetypeRepository,
  PostgresCompanyRepository,
  PostgresEducationRepository,
  PostgresExperienceRepository,
  PostgresHeadlineRepository,
  PostgresJobRepository,
  PostgresProfileRepository,
  PostgresSkillCategoryRepository,
  PostgresSkillRepository,
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

container.bind({ provide: MikroORM, useValue: orm });
container.bind({ provide: DI.Llm.StructuredClient, useClass: StructuredLlmRouter });
container.bind({ provide: DI.Job.Repository, useClass: PostgresJobRepository });
container.bind({ provide: DI.Job.CompanyRepository, useClass: PostgresCompanyRepository });
container.bind({ provide: DI.Job.SkillRepository, useClass: PostgresSkillRepository });
container.bind({ provide: DI.Job.Elector, useValue: new JobElectionService() });
const openAiApiKey = envOptional('OPENAI_API_KEY');
const openAiProject = envOptional('OPENAI_PROJECT_ID');

if (openAiApiKey && openAiProject) {
  container.bind({ provide: OPENAI_CONFIG, useValue: { apiKey: openAiApiKey, project: openAiProject } });
  container.bind({ provide: DI.Resume.LlmService, useClass: OpenAiLlmService });
} else {
  container.bind({ provide: DI.Resume.LlmService, useValue: null });
}
container.bind({ provide: DI.Profile.Repository, useClass: PostgresProfileRepository });
container.bind({ provide: DI.Headline.Repository, useClass: PostgresHeadlineRepository });
container.bind({ provide: DI.Archetype.Repository, useClass: PostgresArchetypeRepository });
container.bind({ provide: DI.Experience.Repository, useClass: PostgresExperienceRepository });
container.bind({ provide: DI.Education.Repository, useClass: PostgresEducationRepository });
container.bind({ provide: DI.SkillCategory.Repository, useClass: PostgresSkillCategoryRepository });
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

export { container };
