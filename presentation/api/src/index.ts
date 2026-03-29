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
  PLAYWRIGHT_JOB_SCRAPER_CONFIG,
  PlaywrightJobScraper,
  PlaywrightWebColorService,
  PostgresCompanyRepository,
  PostgresJobRepository,
  PostgresSkillRepository,
  TemplateResumeContentFactory,
  TypstResumeRenderer
} from '@tailoredin/infrastructure';
import { Environment } from '@tailoredin/core/src/Environment.js';
import { Elysia } from 'elysia';
import * as NpmLog from 'npmlog';
import { healthRoutes } from './routes/health.routes.js';
import { jobRoutes } from './routes/jobs.routes.js';

// --- DI Container ---

const orm = await MikroORM.init(ormConfig);

const container = new Container();

// Infrastructure: ORM
container.bind({ provide: MikroORM, useValue: orm });

// Infrastructure: Repositories
container.bind({ provide: DI.JobRepository, useClass: PostgresJobRepository });
container.bind({ provide: DI.CompanyRepository, useClass: PostgresCompanyRepository });
container.bind({ provide: DI.SkillRepository, useClass: PostgresSkillRepository });

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
container.bind({ provide: DI.JobScraper, useClass: PlaywrightJobScraper });
container.bind({
  provide: DI.JobElector,
  useValue: new JobElectionService()
});
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
