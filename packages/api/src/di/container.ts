import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import { AiDI, JobInsightsExtractor, OpenAiProvider, WebsiteColorsFinder } from '@tailoredin/ai';
import { makeOrmConfig } from '@tailoredin/db';
import { ResumeDI, ResumeGenerator } from '@tailoredin/resume';
import { Environment } from '@tailoredin/shared/src/Environment.js';
import { ApiDI } from './DI.js';

const container = new Container();

container.bind({ provide: ApiDI.Orm, useFactory: () => new MikroORM(makeOrmConfig()) });

container.bind({
  provide: AiDI.OpenAiConfig,
  useValue: {
    apiKey: Environment.get('OPENAI_API_KEY'),
    project: Environment.get('OPENAI_PROJECT_ID')
  }
});
container.bind({ provide: AiDI.AiProvider, useClass: OpenAiProvider });
container.bind({ provide: AiDI.JobInsightsExtractor, useClass: JobInsightsExtractor });
container.bind({ provide: AiDI.WebsiteColorsFinder, useClass: WebsiteColorsFinder });
container.bind({ provide: ResumeDI.ResumeGenerator, useClass: ResumeGenerator });

export { container };
