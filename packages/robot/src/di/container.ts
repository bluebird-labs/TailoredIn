import 'dotenv/config';
import { Container }                                                       from 'inversify';
import { MikroORM }                                                        from '@mikro-orm/postgresql';
import { makeOrmConfig }                                                   from '@tailoredin/db';
import { LinkedInDI, LinkedInExplorer, JobSearchHandler,
         LinkedInExplorerConfig }                                          from '@tailoredin/linkedin';
import { Environment }                                                     from '@tailoredin/shared/src/Environment.js';
import { RobotDI }                                                         from './DI.js';
import { MyJobElector }                                                    from '../job-elector/MyJobElector.js';
import { IJobElector }                                                     from '../job-elector/IJobElector.js';

const container = new Container();

container
  .bind(LinkedInDI.Orm)
  .toDynamicValue(() => MikroORM.initSync(makeOrmConfig()))
  .inSingletonScope();

container.bind<IJobElector>(RobotDI.JobElector).to(MyJobElector).inSingletonScope();

container.bind<LinkedInExplorerConfig>(LinkedInDI.LinkedInExplorerConfig).toConstantValue({
  headless: Environment.get('HEADLESS'),
  slowMo: Environment.get('SLOW_MO'),
  email: Environment.get('LINKEDIN_EMAIL'),
  password: Environment.get('LINKEDIN_PASSWORD')
});
container.bind(LinkedInDI.LinkedInExplorer).to(LinkedInExplorer).inSingletonScope();
container.bind(LinkedInDI.JobSearchHandler).to(JobSearchHandler).inSingletonScope();

export { container };
