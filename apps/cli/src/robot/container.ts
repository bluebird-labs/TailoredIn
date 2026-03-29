import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import { makeOrmConfig } from '@tailoredin/db';
import { JobSearchHandler, LinkedInDI, LinkedInExplorer, type LinkedInExplorerConfig } from '@tailoredin/linkedin';
import { Environment } from '@tailoredin/shared/src/Environment.js';
import { MyJobElector, RobotDI } from '@tailoredin/robot';

const container = new Container();

container.bind({ provide: LinkedInDI.Orm, useFactory: () => new MikroORM(makeOrmConfig()) });
container.bind({ provide: RobotDI.JobElector, useClass: MyJobElector });
container.bind({
  provide: LinkedInDI.LinkedInExplorerConfig,
  useValue: {
    headless: Environment.get('HEADLESS'),
    slowMo: Environment.get('SLOW_MO'),
    email: Environment.get('LINKEDIN_EMAIL'),
    password: Environment.get('LINKEDIN_PASSWORD')
  } as LinkedInExplorerConfig
});
container.bind({ provide: LinkedInDI.LinkedInExplorer, useClass: LinkedInExplorer });
container.bind({ provide: LinkedInDI.JobSearchHandler, useClass: JobSearchHandler });

export { container };
