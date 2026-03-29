import 'reflect-metadata';
import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import { JobElectionService } from '@tailoredin/domain';
import {
  DI,
  OPENAI_CONFIG,
  OpenAiLlmService,
  ormConfig,
  PlaywrightWebColorService,
  PostgresCompanyRepository,
  PostgresJobRepository,
  PostgresSkillRepository,
  TemplateResumeContentFactory,
  TypstResumeRenderer
} from '@tailoredin/infrastructure';
import { Environment } from '@tailoredin/core/src/Environment.js';

const orm = await MikroORM.init(ormConfig);

const container = new Container();

container.bind({ provide: MikroORM, useValue: orm });
container.bind({ provide: DI.JobRepository, useClass: PostgresJobRepository });
container.bind({ provide: DI.CompanyRepository, useClass: PostgresCompanyRepository });
container.bind({ provide: DI.SkillRepository, useClass: PostgresSkillRepository });
container.bind({ provide: DI.JobElector, useValue: new JobElectionService() });
container.bind({
  provide: OPENAI_CONFIG,
  useValue: {
    apiKey: Environment.get('OPENAI_API_KEY'),
    project: Environment.get('OPENAI_PROJECT_ID')
  }
});
container.bind({ provide: DI.LlmService, useClass: OpenAiLlmService });
container.bind({ provide: DI.WebColorService, useClass: PlaywrightWebColorService });
container.bind({ provide: DI.ResumeRenderer, useClass: TypstResumeRenderer });
container.bind({ provide: DI.ResumeContentFactory, useClass: TemplateResumeContentFactory });

export { container, orm };
