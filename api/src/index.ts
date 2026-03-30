import 'reflect-metadata';
import 'dotenv/config';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { staticPlugin } from '@elysiajs/static';
import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import { Environment } from '@tailoredin/core/src/Environment.js';
import { Logger } from '@tailoredin/core/src/Logger.js';
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
  PostgresResumeCompanyRepository,
  PostgresResumeEducationRepository,
  PostgresResumeHeadlineRepository,
  PostgresResumeSkillCategoryRepository,
  PostgresSkillRepository,
  PostgresUserRepository,
  TemplateResumeContentFactory,
  TypstResumeRenderer
} from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';
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
container.bind({ provide: DI.UserRepository, useClass: PostgresUserRepository });
container.bind({ provide: DI.ResumeCompanyRepository, useClass: PostgresResumeCompanyRepository });
container.bind({ provide: DI.ResumeEducationRepository, useClass: PostgresResumeEducationRepository });
container.bind({ provide: DI.ResumeHeadlineRepository, useClass: PostgresResumeHeadlineRepository });
container.bind({ provide: DI.ResumeSkillCategoryRepository, useClass: PostgresResumeSkillCategoryRepository });

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

const log = Logger.create('API');
const port = Number(process.env.API_PORT ?? 8000);

const webDistPath = resolve(import.meta.dir, '../../web/dist');
const serveSpa = existsSync(webDistPath);

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

    log.error(message);
    set.status = 500;
    return { error: 'Internal server error' };
  })
  .listen(port);

if (serveSpa) {
  app.use(staticPlugin({ assets: webDistPath, prefix: '/' })).get('/*', () => Bun.file(`${webDistPath}/index.html`));
  log.info('Serving SPA from web/dist');
}

log.info(`Listening on port ${port}...`);

export type App = typeof app;
