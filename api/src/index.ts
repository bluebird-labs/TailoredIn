import { Logger } from '@tailoredin/core';
import { Elysia } from 'elysia';
import { container, llmAvailable } from './container.js';
import { CreateArchetypeRoute } from './routes/archetype/CreateArchetypeRoute.js';
import { DeleteArchetypeRoute } from './routes/archetype/DeleteArchetypeRoute.js';
import { ListArchetypesRoute } from './routes/archetype/ListArchetypesRoute.js';
import { SetArchetypeContentRoute } from './routes/archetype/SetArchetypeContentRoute.js';
import { SetArchetypeTagProfileRoute } from './routes/archetype/SetArchetypeTagProfileRoute.js';
import { SuggestBulletsRoute } from './routes/archetype/SuggestBulletsRoute.js';
import { UpdateArchetypeRoute } from './routes/archetype/UpdateArchetypeRoute.js';
import { BulkChangeJobStatusRoute } from './routes/BulkChangeJobStatusRoute.js';
import { ChangeJobStatusRoute } from './routes/ChangeJobStatusRoute.js';
import { configRoute } from './routes/ConfigRoute.js';
import { CreateEducationRoute } from './routes/education/CreateEducationRoute.js';
import { DeleteEducationRoute } from './routes/education/DeleteEducationRoute.js';
import { ListEducationsRoute } from './routes/education/ListEducationsRoute.js';
import { UpdateEducationRoute } from './routes/education/UpdateEducationRoute.js';
import { AddBulletRoute } from './routes/experience/AddBulletRoute.js';
import { CreateExperienceRoute } from './routes/experience/CreateExperienceRoute.js';
import { DeleteBulletRoute } from './routes/experience/DeleteBulletRoute.js';
import { DeleteExperienceRoute } from './routes/experience/DeleteExperienceRoute.js';
import { ListExperiencesRoute } from './routes/experience/ListExperiencesRoute.js';
import { UpdateBulletRoute } from './routes/experience/UpdateBulletRoute.js';
import { UpdateExperienceRoute } from './routes/experience/UpdateExperienceRoute.js';
import { GenerateCompanyBriefRoute } from './routes/GenerateCompanyBriefRoute.js';
import { GenerateResumeFromJobRoute } from './routes/GenerateResumeFromJobRoute.js';
import { GenerateResumeMarkdownRoute } from './routes/GenerateResumeMarkdownRoute.js';
import { GenerateResumeRoute } from './routes/GenerateResumeRoute.js';
import { GetCompanyBriefRoute } from './routes/GetCompanyBriefRoute.js';
import { GetJobCompanyRoute } from './routes/GetJobCompanyRoute.js';
import { GetJobRoute } from './routes/GetJobRoute.js';
import { GetProfileRoute } from './routes/GetProfileRoute.js';
import { CreateHeadlineRoute } from './routes/headline/CreateHeadlineRoute.js';
import { DeleteHeadlineRoute } from './routes/headline/DeleteHeadlineRoute.js';
import { ListHeadlinesRoute } from './routes/headline/ListHeadlinesRoute.js';
import { UpdateHeadlineRoute } from './routes/headline/UpdateHeadlineRoute.js';
import { healthRoutes } from './routes/health.routes.js';
import { IngestJobByUrlRoute } from './routes/IngestJobByUrlRoute.js';
import { ListJobsRoute } from './routes/ListJobsRoute.js';
import { PreviewResumeRoute } from './routes/PreviewResumeRoute.js';
import { AddSkillItemRoute } from './routes/skill-categories/AddSkillItemRoute.js';
import { CreateSkillCategoryRoute } from './routes/skill-categories/CreateSkillCategoryRoute.js';
import { DeleteSkillCategoryRoute } from './routes/skill-categories/DeleteSkillCategoryRoute.js';
import { DeleteSkillItemRoute } from './routes/skill-categories/DeleteSkillItemRoute.js';
import { ListSkillCategoriesRoute } from './routes/skill-categories/ListSkillCategoriesRoute.js';
import { UpdateSkillCategoryRoute } from './routes/skill-categories/UpdateSkillCategoryRoute.js';
import { UpdateSkillItemRoute } from './routes/skill-categories/UpdateSkillItemRoute.js';
import { ListTagsRoute } from './routes/tag/ListTagsRoute.js';
import { UpdateJobCompanyRoute } from './routes/UpdateJobCompanyRoute.js';
import { UpdateProfileRoute } from './routes/UpdateProfileRoute.js';

// --- App ---

const log = Logger.create('API');
const port = Number(process.env.API_PORT ?? 8000);

const startTimes = new WeakMap<Request, number>();

function formatDuration(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function logRequest(request: Request, status: number, start?: number) {
  const url = new URL(request.url);
  if (url.pathname === '/health') return;
  const duration = start ? ` (${formatDuration(performance.now() - start)})` : '';
  const msg = `${request.method} ${url.pathname}${url.search} ${status}${duration}`;
  if (status >= 500) log.error(msg);
  else if (status >= 400) log.warn(msg);
  else log.info(msg);
}

const app = new Elysia()
  .onRequest(({ request }) => {
    startTimes.set(request, performance.now());
  })
  .onAfterResponse(({ request, set }) => {
    const status = (set as { status?: number }).status ?? 200;
    logRequest(request, status, startTimes.get(request));
  })
  .use(healthRoutes)
  .use(configRoute(llmAvailable))
  // Jobs
  .use(container.get(ListJobsRoute).plugin())
  .use(container.get(GetJobRoute).plugin())
  .use(container.get(ChangeJobStatusRoute).plugin())
  .use(container.get(BulkChangeJobStatusRoute).plugin())
  .use(container.get(IngestJobByUrlRoute).plugin())
  .use(container.get(GenerateResumeFromJobRoute).plugin())
  .use(container.get(GenerateResumeRoute).plugin())
  .use(container.get(PreviewResumeRoute).plugin())
  .use(container.get(GenerateResumeMarkdownRoute).plugin())
  // Company Briefs
  .use(container.get(GetCompanyBriefRoute).plugin())
  .use(container.get(GenerateCompanyBriefRoute).plugin())
  // Companies
  .use(container.get(GetJobCompanyRoute).plugin())
  .use(container.get(UpdateJobCompanyRoute).plugin())
  // Profile
  .use(container.get(GetProfileRoute).plugin())
  .use(container.get(UpdateProfileRoute).plugin())
  // Education
  .use(container.get(ListEducationsRoute).plugin())
  .use(container.get(CreateEducationRoute).plugin())
  .use(container.get(UpdateEducationRoute).plugin())
  .use(container.get(DeleteEducationRoute).plugin())
  // Skills
  .use(container.get(ListSkillCategoriesRoute).plugin())
  .use(container.get(CreateSkillCategoryRoute).plugin())
  .use(container.get(UpdateSkillCategoryRoute).plugin())
  .use(container.get(DeleteSkillCategoryRoute).plugin())
  .use(container.get(AddSkillItemRoute).plugin())
  .use(container.get(UpdateSkillItemRoute).plugin())
  .use(container.get(DeleteSkillItemRoute).plugin())
  // Archetypes
  .use(container.get(ListArchetypesRoute).plugin())
  .use(container.get(CreateArchetypeRoute).plugin())
  .use(container.get(UpdateArchetypeRoute).plugin())
  .use(container.get(DeleteArchetypeRoute).plugin())
  .use(container.get(SetArchetypeContentRoute).plugin())
  .use(container.get(SetArchetypeTagProfileRoute).plugin())
  .use(container.get(SuggestBulletsRoute).plugin())
  // Headlines
  .use(container.get(ListHeadlinesRoute).plugin())
  .use(container.get(CreateHeadlineRoute).plugin())
  .use(container.get(UpdateHeadlineRoute).plugin())
  .use(container.get(DeleteHeadlineRoute).plugin())
  // Tags
  .use(container.get(ListTagsRoute).plugin())
  // Experiences
  .use(container.get(ListExperiencesRoute).plugin())
  .use(container.get(CreateExperienceRoute).plugin())
  .use(container.get(UpdateExperienceRoute).plugin())
  .use(container.get(DeleteExperienceRoute).plugin())
  .use(container.get(AddBulletRoute).plugin())
  .use(container.get(UpdateBulletRoute).plugin())
  .use(container.get(DeleteBulletRoute).plugin())
  // @ts-expect-error Elysia type instantiation too deep with many chained .use() calls
  .onError(({ request, error, set, code }) => {
    const err = error as unknown as { statusCode?: number; message?: string };
    const message = err.message ?? String(error);

    if (code === 'VALIDATION') return;

    const statusCode = err.statusCode ?? 500;
    set.status = statusCode;
    logRequest(request, statusCode, startTimes.get(request));
    return {
      error: {
        code: statusCode === 500 ? 'INTERNAL_ERROR' : 'SERVER_ERROR',
        message: statusCode === 500 ? 'Internal server error' : message
      }
    };
  })
  .listen(port);

log.info(`Listening on port ${port}...`);

export type App = typeof app;
