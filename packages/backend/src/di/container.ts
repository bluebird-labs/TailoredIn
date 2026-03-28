import 'dotenv/config';
import { Container } from 'inversify';
import { DI } from './DI';
import { MikroORM } from '@mikro-orm/postgresql';
import { JobInsightsExtractor } from '../services/JobInsightsExtractor';
import { ResumeGenerator } from '../resume-generator/ResumeGenerator';
import { WebsiteColorsFinder } from '../services/WebsiteColorsFinder';
import { ClientOptions } from 'openai';
import { makeOrmConfig } from '../orm/makeOrmConfig';
import { LinkedInExplorer, LinkedInExplorerConfig } from '../services/linkedin-explorer/LinkedInExplorer';
import { MyJobElector } from '../services/job-elector/MyJobElector';
import { JobSearchHandler } from '../services/JobSearchHandler';
import { Environment } from '../Environment';
import { OpenAiProvider } from '../ai/OpenAiProvider';
import { IAiProvider } from '../ai/AiProvider';

const container = new Container();

container
  .bind(DI.Orm)
  .toDynamicValue(() => {
    return MikroORM.initSync(makeOrmConfig());
  })
  .inSingletonScope();

container.bind<ClientOptions>(DI.OpenAiConfig).toConstantValue({
  apiKey: Environment.get('OPENAI_API_KEY'),
  project: Environment.get('OPENAI_PROJECT_ID')
});
container.bind<IAiProvider>(DI.AiProvider).to(OpenAiProvider).inSingletonScope();

container.bind(DI.JobInsightsExtractor).to(JobInsightsExtractor).inSingletonScope();
container.bind(DI.WebsiteColorsFinder).to(WebsiteColorsFinder).inSingletonScope();
container.bind(DI.ResumeGenerator).to(ResumeGenerator).inSingletonScope();
container.bind(DI.JobElector).to(MyJobElector).inSingletonScope();
container.bind(DI.LinkedInExplorer).to(LinkedInExplorer).inSingletonScope();
container.bind<LinkedInExplorerConfig>(DI.LinkedInExplorerConfig).toConstantValue({
  headless: Environment.get('HEADLESS'),
  slowMo: Environment.get('SLOW_MO'),
  email: Environment.get('LINKEDIN_EMAIL'),
  password: Environment.get('LINKEDIN_PASSWORD')
});
container.bind(DI.JobSearchHandler).to(JobSearchHandler).inSingletonScope();

export { container };
