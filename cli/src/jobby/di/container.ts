import 'reflect-metadata';
import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import { Environment } from '@tailoredin/core/src/Environment.js';
import { JobElectionService } from '@tailoredin/domain';
import {
  createOrmConfig,
  DI,
  OPENAI_CONFIG,
  OpenAiLlmService,
  PlaywrightWebColorService,
  PostgresCompanyRepository,
  PostgresJobRepository,
  PostgresSkillRepository,
  TemplateResumeContentFactory,
  TypstResumeRenderer
} from '@tailoredin/infrastructure';

const orm = await MikroORM.init(
  createOrmConfig({
    timezone: Environment.get('TZ'),
    user: Environment.get('POSTGRES_USER'),
    password: Environment.get('POSTGRES_PASSWORD'),
    dbName: Environment.get('POSTGRES_DB'),
    schema: Environment.get('POSTGRES_SCHEMA'),
    host: Environment.get('POSTGRES_HOST'),
    port: Environment.get('POSTGRES_PORT')
  })
);

const container = new Container();

container.bind({ provide: MikroORM, useValue: orm });
container.bind({ provide: DI.Job.Repository, useClass: PostgresJobRepository });
container.bind({ provide: DI.Job.CompanyRepository, useClass: PostgresCompanyRepository });
container.bind({ provide: DI.Job.SkillRepository, useClass: PostgresSkillRepository });
container.bind({ provide: DI.Job.Elector, useValue: new JobElectionService() });
container.bind({
  provide: OPENAI_CONFIG,
  useValue: {
    apiKey: Environment.get('OPENAI_API_KEY'),
    project: Environment.get('OPENAI_PROJECT_ID')
  }
});
container.bind({ provide: DI.Resume.LlmService, useClass: OpenAiLlmService });
container.bind({ provide: DI.Resume.WebColorService, useClass: PlaywrightWebColorService });
container.bind({ provide: DI.Resume.Renderer, useClass: TypstResumeRenderer });
container.bind({ provide: DI.Resume.ContentFactory, useClass: TemplateResumeContentFactory });

export { container, orm };
