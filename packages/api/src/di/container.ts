import 'reflect-metadata';
import 'dotenv/config';
import { Container }                          from 'inversify';
import { MikroORM }                           from '@mikro-orm/postgresql';
import { ClientOptions }                      from 'openai';
import { AiDI, IAiProvider, OpenAiProvider,
         JobInsightsExtractor,
         WebsiteColorsFinder }                from '@tailoredin/ai';
import { ResumeDI, ResumeGenerator }          from '@tailoredin/resume';
import { makeOrmConfig }                      from '@tailoredin/db';
import { Environment }                        from '@tailoredin/shared/src/Environment.js';
import { ApiDI }                              from './DI.js';

const container = new Container();

container
  .bind(ApiDI.Orm)
  .toDynamicValue(() => MikroORM.initSync(makeOrmConfig()))
  .inSingletonScope();

container.bind<ClientOptions>(AiDI.OpenAiConfig).toConstantValue({
  apiKey: Environment.get('OPENAI_API_KEY'),
  project: Environment.get('OPENAI_PROJECT_ID')
});
container.bind<IAiProvider>(AiDI.AiProvider).to(OpenAiProvider).inSingletonScope();
container.bind(AiDI.JobInsightsExtractor).to(JobInsightsExtractor).inSingletonScope();
container.bind(AiDI.WebsiteColorsFinder).to(WebsiteColorsFinder).inSingletonScope();
container.bind(ResumeDI.ResumeGenerator).to(ResumeGenerator).inSingletonScope();

export { container };
