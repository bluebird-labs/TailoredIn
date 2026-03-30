import 'reflect-metadata';
import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import { Environment } from '@tailoredin/core/src/Environment.js';
import { JobElectionService } from '@tailoredin/domain';
import {
  createOrmConfig,
  DI,
  PLAYWRIGHT_JOB_SCRAPER_CONFIG,
  PlaywrightJobScraper,
  PostgresCompanyRepository,
  PostgresJobRepository,
  PostgresSkillRepository
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
  provide: PLAYWRIGHT_JOB_SCRAPER_CONFIG,
  useValue: {
    headless: Environment.get('HEADLESS'),
    slowMo: Environment.get('SLOW_MO'),
    email: Environment.get('LINKEDIN_EMAIL'),
    password: Environment.get('LINKEDIN_PASSWORD')
  }
});
container.bind({ provide: DI.Job.Scraper, useClass: PlaywrightJobScraper });

export { container, orm };
