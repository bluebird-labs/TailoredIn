import 'reflect-metadata';
import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import { ApplicationJobDI } from '@tailoredin/application-job';
import { ApplicationResumeDI } from '@tailoredin/application-resume';
import { JobElectionService } from '@tailoredin/domain-job';
import { Environment } from '@tailoredin/shared/src/Environment.js';
import { ormConfig } from '@tailoredin/api/src/infrastructure/db/orm-config.js';
import { PostgresJobRepository } from '@tailoredin/api/src/infrastructure/repositories/PostgresJobRepository.js';
import { PostgresCompanyRepository } from '@tailoredin/api/src/infrastructure/repositories/PostgresCompanyRepository.js';
import { PostgresSkillRepository } from '@tailoredin/api/src/infrastructure/repositories/PostgresSkillRepository.js';
import { OpenAiLlmService, OPENAI_CONFIG } from '@tailoredin/api/src/infrastructure/services/OpenAiLlmService.js';
import { PlaywrightWebColorService } from '@tailoredin/api/src/infrastructure/services/PlaywrightWebColorService.js';
import { TypstResumeRenderer } from '@tailoredin/api/src/infrastructure/services/TypstResumeRenderer.js';
import { TemplateResumeContentFactory } from '@tailoredin/api/src/infrastructure/services/TemplateResumeContentFactory.js';

const orm = await MikroORM.init(ormConfig);

const container = new Container();

container.bind({ provide: MikroORM, useValue: orm });
container.bind({ provide: ApplicationJobDI.JobRepository, useClass: PostgresJobRepository });
container.bind({ provide: ApplicationJobDI.CompanyRepository, useClass: PostgresCompanyRepository });
container.bind({ provide: ApplicationJobDI.SkillRepository, useClass: PostgresSkillRepository });
container.bind({ provide: ApplicationJobDI.JobElector, useValue: new JobElectionService() });
container.bind({
  provide: OPENAI_CONFIG,
  useValue: {
    apiKey: Environment.get('OPENAI_API_KEY'),
    project: Environment.get('OPENAI_PROJECT_ID')
  }
});
container.bind({ provide: ApplicationResumeDI.LlmService, useClass: OpenAiLlmService });
container.bind({ provide: ApplicationResumeDI.WebColorService, useClass: PlaywrightWebColorService });
container.bind({ provide: ApplicationResumeDI.ResumeRenderer, useClass: TypstResumeRenderer });
container.bind({ provide: ApplicationResumeDI.ResumeContentFactory, useClass: TemplateResumeContentFactory });

export { container, orm };
