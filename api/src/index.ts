import { Logger } from '@tailoredin/core';
import { Elysia } from 'elysia';
import { container, llmAvailable } from './container.js';
import { CreateArchetype2Route } from './routes/archetype2/CreateArchetype2Route.js';
import { DeleteArchetype2Route } from './routes/archetype2/DeleteArchetype2Route.js';
import { ListArchetypes2Route } from './routes/archetype2/ListArchetypes2Route.js';
import { SetArchetypeContent2Route } from './routes/archetype2/SetArchetypeContent2Route.js';
import { SetArchetypeTagProfile2Route } from './routes/archetype2/SetArchetypeTagProfile2Route.js';
import { UpdateArchetype2Route } from './routes/archetype2/UpdateArchetype2Route.js';
import { BulkChangeJobStatusRoute } from './routes/BulkChangeJobStatusRoute.js';
import { ChangeJobStatusRoute } from './routes/ChangeJobStatusRoute.js';
import { configRoute } from './routes/ConfigRoute.js';
import { CreateEducationRoute2 } from './routes/education/CreateEducationRoute2.js';
import { DeleteEducationRoute2 } from './routes/education/DeleteEducationRoute2.js';
import { ListEducationsRoute } from './routes/education/ListEducationsRoute.js';
import { UpdateEducationRoute2 } from './routes/education/UpdateEducationRoute2.js';
import { AddBullet2Route } from './routes/experience/AddBullet2Route.js';
import { AddBulletVariantRoute } from './routes/experience/AddBulletVariantRoute.js';
import { ApproveBulletVariantRoute } from './routes/experience/ApproveBulletVariantRoute.js';
import { CreateExperienceRoute } from './routes/experience/CreateExperienceRoute.js';
import { DeleteBullet2Route } from './routes/experience/DeleteBullet2Route.js';
import { DeleteBulletVariantRoute } from './routes/experience/DeleteBulletVariantRoute.js';
import { DeleteExperienceRoute } from './routes/experience/DeleteExperienceRoute.js';
import { ListExperiencesRoute } from './routes/experience/ListExperiencesRoute.js';
import { RejectBulletVariantRoute } from './routes/experience/RejectBulletVariantRoute.js';
import { UpdateBullet2Route } from './routes/experience/UpdateBullet2Route.js';
import { UpdateBulletVariantRoute } from './routes/experience/UpdateBulletVariantRoute.js';
import { UpdateExperienceRoute } from './routes/experience/UpdateExperienceRoute.js';
import { GenerateCompanyBriefRoute } from './routes/GenerateCompanyBriefRoute.js';
import { GenerateResumeRoute } from './routes/GenerateResumeRoute.js';
import { GetCompanyBriefRoute } from './routes/GetCompanyBriefRoute.js';
import { GetJobCompanyRoute } from './routes/GetJobCompanyRoute.js';
import { GetJobRoute } from './routes/GetJobRoute.js';
import { GetProfileRoute } from './routes/GetProfileRoute.js';
import { CreateHeadline2Route } from './routes/headline/CreateHeadline2Route.js';
import { DeleteHeadline2Route } from './routes/headline/DeleteHeadline2Route.js';
import { ListHeadlines2Route } from './routes/headline/ListHeadlines2Route.js';
import { UpdateHeadline2Route } from './routes/headline/UpdateHeadline2Route.js';
import { healthRoutes } from './routes/health.routes.js';
import { IngestJobByUrlRoute } from './routes/IngestJobByUrlRoute.js';
import { ListJobsRoute } from './routes/ListJobsRoute.js';
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
  .use(container.get(GenerateResumeRoute).plugin())
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
  .use(container.get(CreateEducationRoute2).plugin())
  .use(container.get(UpdateEducationRoute2).plugin())
  .use(container.get(DeleteEducationRoute2).plugin())
  // Skills
  .use(container.get(ListSkillCategoriesRoute).plugin())
  .use(container.get(CreateSkillCategoryRoute).plugin())
  .use(container.get(UpdateSkillCategoryRoute).plugin())
  .use(container.get(DeleteSkillCategoryRoute).plugin())
  .use(container.get(AddSkillItemRoute).plugin())
  .use(container.get(UpdateSkillItemRoute).plugin())
  .use(container.get(DeleteSkillItemRoute).plugin())
  // Archetypes
  .use(container.get(ListArchetypes2Route).plugin())
  .use(container.get(CreateArchetype2Route).plugin())
  .use(container.get(UpdateArchetype2Route).plugin())
  .use(container.get(DeleteArchetype2Route).plugin())
  .use(container.get(SetArchetypeContent2Route).plugin())
  .use(container.get(SetArchetypeTagProfile2Route).plugin())
  // Headlines
  .use(container.get(ListHeadlines2Route).plugin())
  .use(container.get(CreateHeadline2Route).plugin())
  .use(container.get(UpdateHeadline2Route).plugin())
  .use(container.get(DeleteHeadline2Route).plugin())
  // Tags
  .use(container.get(ListTagsRoute).plugin())
  // Experiences
  .use(container.get(ListExperiencesRoute).plugin())
  .use(container.get(CreateExperienceRoute).plugin())
  .use(container.get(UpdateExperienceRoute).plugin())
  .use(container.get(DeleteExperienceRoute).plugin())
  .use(container.get(AddBullet2Route).plugin())
  .use(container.get(UpdateBullet2Route).plugin())
  .use(container.get(DeleteBullet2Route).plugin())
  .use(container.get(AddBulletVariantRoute).plugin())
  .use(container.get(UpdateBulletVariantRoute).plugin())
  .use(container.get(DeleteBulletVariantRoute).plugin())
  .use(container.get(ApproveBulletVariantRoute).plugin())
  .use(container.get(RejectBulletVariantRoute).plugin())
  // @ts-expect-error Elysia type instantiation depth exceeded with many chained routes
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
