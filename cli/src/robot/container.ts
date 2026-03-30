import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import { env, envBool, envInt } from '@tailoredin/core';
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

export { container, orm };
