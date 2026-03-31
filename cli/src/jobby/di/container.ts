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

container.bind({ provide: MikroORM, useValue: orm });
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
container.bind({ provide: DI.Resume.UserRepository, useClass: PostgresUserRepository });
container.bind({ provide: DI.Resume.CompanyRepository, useClass: PostgresResumeCompanyRepository });
container.bind({ provide: DI.Resume.EducationRepository, useClass: PostgresResumeEducationRepository });
container.bind({ provide: DI.Resume.HeadlineRepository, useClass: PostgresResumeHeadlineRepository });
container.bind({ provide: DI.Resume.SkillCategoryRepository, useClass: PostgresResumeSkillCategoryRepository });
container.bind({ provide: DI.Resume.ArchetypeConfigRepository, useClass: PostgresArchetypeConfigRepository });
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

export { container, orm };
