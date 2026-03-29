import 'reflect-metadata';
import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import { Environment } from '@tailoredin/core/src/Environment.js';
import { JobElectionService } from '@tailoredin/domain';
import {
  DI,
  ormConfig,
  PLAYWRIGHT_JOB_SCRAPER_CONFIG,
  PlaywrightJobScraper,
  PostgresCompanyRepository,
  PostgresJobRepository,
  PostgresSkillRepository
} from '@tailoredin/infrastructure';

const orm = await MikroORM.init(ormConfig);

const container = new Container();

container.bind({ provide: MikroORM, useValue: orm });
container.bind({ provide: DI.JobRepository, useClass: PostgresJobRepository });
container.bind({ provide: DI.CompanyRepository, useClass: PostgresCompanyRepository });
container.bind({ provide: DI.SkillRepository, useClass: PostgresSkillRepository });
container.bind({
  provide: DI.JobElector,
  useValue: new JobElectionService()
});
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

export { container, orm };
