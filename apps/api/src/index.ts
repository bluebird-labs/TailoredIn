import 'reflect-metadata';
import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import { ApplicationJobDI } from '@tailoredin/application-job';
import { ApplicationResumeDI } from '@tailoredin/application-resume';
import { JobElectionService } from '@tailoredin/domain-job';
import { Environment } from '@tailoredin/shared/src/Environment.js';
import { Elysia } from 'elysia';
import * as NpmLog from 'npmlog';
import { ormConfig } from './infrastructure/db/orm-config.js';
import { PostgresJobRepository } from './infrastructure/repositories/PostgresJobRepository.js';
import { PostgresCompanyRepository } from './infrastructure/repositories/PostgresCompanyRepository.js';
import { PostgresSkillRepository } from './infrastructure/repositories/PostgresSkillRepository.js';
import { PlaywrightJobScraper, PLAYWRIGHT_JOB_SCRAPER_CONFIG } from './infrastructure/services/PlaywrightJobScraper.js';
import { OpenAiLlmService, OPENAI_CONFIG } from './infrastructure/services/OpenAiLlmService.js';
import { PlaywrightWebColorService } from './infrastructure/services/PlaywrightWebColorService.js';
import { TypstResumeRenderer } from './infrastructure/services/TypstResumeRenderer.js';
import { TemplateResumeContentFactory } from './infrastructure/services/TemplateResumeContentFactory.js';
import { healthRoutes } from './routes/health.routes.js';
import { jobRoutes } from './routes/jobs.routes.js';

// --- DI Container ---

const orm = await MikroORM.init(ormConfig);

const container = new Container();

// Infrastructure: ORM
container.bind({ provide: MikroORM, useValue: orm });

// Infrastructure: Repositories
container.bind({ provide: ApplicationJobDI.JobRepository, useClass: PostgresJobRepository });
container.bind({ provide: ApplicationJobDI.CompanyRepository, useClass: PostgresCompanyRepository });
container.bind({ provide: ApplicationJobDI.SkillRepository, useClass: PostgresSkillRepository });

// Infrastructure: Services
container.bind({
  provide: PLAYWRIGHT_JOB_SCRAPER_CONFIG,
  useValue: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: Number(process.env.SLOW_MO ?? 0),
    email: Environment.get('LINKEDIN_EMAIL'),
    password: Environment.get('LINKEDIN_PASSWORD')
  }
});
container.bind({ provide: ApplicationJobDI.JobScraper, useClass: PlaywrightJobScraper });
container.bind({
  provide: ApplicationJobDI.JobElector,
  useValue: new JobElectionService()
});
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

// --- App ---

const port = Number(process.env.API_PORT ?? 8000);

const app = new Elysia()
  .use(healthRoutes)
  .use(jobRoutes(container))
  .onError(({ error, set }) => {
    const err = error as unknown as { statusCode?: number; message?: string };
    const statusCode = err.statusCode;
    const message = err.message ?? String(error);

    if (statusCode) {
      set.status = statusCode;
      return { error: message };
    }

    NpmLog.error('API', message);
    set.status = 500;
    return { error: 'Internal server error' };
  })
  .listen(port);

NpmLog.info('API', `Listening on port ${port}...`);

export type App = typeof app;
