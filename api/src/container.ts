import { MikroORM } from '@mikro-orm/postgresql';
import { Container } from '@needle-di/core';
import { ChangeJobStatus, GenerateResume, GetJob, GetTopJob } from '@tailoredin/application';
import { Environment } from '@tailoredin/core/src/Environment.js';
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

const orm = await MikroORM.init(ormConfig);

const container = new Container();

// Infrastructure: ORM
container.bind({ provide: MikroORM, useValue: orm });

// Job repositories + services
container.bind({ provide: DI.Job.Repository, useClass: PostgresJobRepository });
container.bind({ provide: DI.Job.CompanyRepository, useClass: PostgresCompanyRepository });
container.bind({ provide: DI.Job.SkillRepository, useClass: PostgresSkillRepository });
container.bind({ provide: DI.Job.Elector, useValue: new JobElectionService() });
container.bind({
  provide: PLAYWRIGHT_JOB_SCRAPER_CONFIG,
  useValue: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: Number(process.env.SLOW_MO ?? 0),
    email: Environment.get('LINKEDIN_EMAIL'),
    password: Environment.get('LINKEDIN_PASSWORD')
  }
});
container.bind({ provide: DI.Job.Scraper, useClass: PlaywrightJobScraper });

// Job use cases
container.bind({
  provide: DI.Job.GetTopJob,
  useFactory: () => new GetTopJob(container.get(DI.Job.Repository))
});
container.bind({
  provide: DI.Job.GetJob,
  useFactory: () => new GetJob(container.get(DI.Job.Repository))
});
container.bind({
  provide: DI.Job.ChangeJobStatus,
  useFactory: () => new ChangeJobStatus(container.get(DI.Job.Repository))
});

// Resume repositories + services
container.bind({ provide: DI.Resume.UserRepository, useClass: PostgresUserRepository });
container.bind({ provide: DI.Resume.CompanyRepository, useClass: PostgresResumeCompanyRepository });
container.bind({ provide: DI.Resume.EducationRepository, useClass: PostgresResumeEducationRepository });
container.bind({ provide: DI.Resume.HeadlineRepository, useClass: PostgresResumeHeadlineRepository });
container.bind({ provide: DI.Resume.SkillCategoryRepository, useClass: PostgresResumeSkillCategoryRepository });
container.bind({
  provide: OPENAI_CONFIG,
  useValue: {
    apiKey: Environment.get('OPENAI_API_KEY'),
    project: Environment.get('OPENAI_PROJECT_ID')
  }
});
container.bind({ provide: DI.Resume.LlmService, useClass: OpenAiLlmService });
container.bind({ provide: DI.Resume.WebColorService, useClass: PlaywrightWebColorService });
container.bind({ provide: DI.Resume.Renderer, useClass: TypstResumeRenderer });
container.bind({ provide: DI.Resume.ContentFactory, useClass: TemplateResumeContentFactory });

// Resume use cases
container.bind({
  provide: DI.Resume.GenerateResume,
  useFactory: () =>
    new GenerateResume(
      container.get(DI.Job.Repository),
      container.get(DI.Resume.LlmService),
      container.get(DI.Resume.WebColorService),
      container.get(DI.Resume.Renderer),
      container.get(DI.Resume.ContentFactory)
    )
});

export { container, orm };
