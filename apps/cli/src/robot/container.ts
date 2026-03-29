import 'reflect-metadata';
import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import { ApplicationJobDI } from '@tailoredin/application-job';
import { JobElectionService } from '@tailoredin/domain-job';
import { Environment } from '@tailoredin/shared/src/Environment.js';
import { ormConfig } from '@tailoredin/api/src/infrastructure/db/orm-config.js';
import { PostgresJobRepository } from '@tailoredin/api/src/infrastructure/repositories/PostgresJobRepository.js';
import { PostgresCompanyRepository } from '@tailoredin/api/src/infrastructure/repositories/PostgresCompanyRepository.js';
import { PostgresSkillRepository } from '@tailoredin/api/src/infrastructure/repositories/PostgresSkillRepository.js';
import {
  PlaywrightJobScraper,
  PLAYWRIGHT_JOB_SCRAPER_CONFIG
} from '@tailoredin/api/src/infrastructure/services/PlaywrightJobScraper.js';

const orm = await MikroORM.init(ormConfig);

const container = new Container();

container.bind({ provide: MikroORM, useValue: orm });
container.bind({ provide: ApplicationJobDI.JobRepository, useClass: PostgresJobRepository });
container.bind({ provide: ApplicationJobDI.CompanyRepository, useClass: PostgresCompanyRepository });
container.bind({ provide: ApplicationJobDI.SkillRepository, useClass: PostgresSkillRepository });
container.bind({
  provide: ApplicationJobDI.JobElector,
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
container.bind({ provide: ApplicationJobDI.JobScraper, useClass: PlaywrightJobScraper });

export { container, orm };
