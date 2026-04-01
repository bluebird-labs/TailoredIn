import { Logger } from '@tailoredin/core';
import { Elysia } from 'elysia';
import { container, llmAvailable } from './container.js';
import { AddBulletRoute } from './routes/AddBulletRoute.js';
import { BulkChangeJobStatusRoute } from './routes/BulkChangeJobStatusRoute.js';
import { ChangeJobStatusRoute } from './routes/ChangeJobStatusRoute.js';
import { configRoute } from './routes/ConfigRoute.js';
import { CreateArchetypeRoute } from './routes/CreateArchetypeRoute.js';
import { CreateCompanyRoute } from './routes/CreateCompanyRoute.js';
import { CreateEducationRoute } from './routes/CreateEducationRoute.js';
import { CreateHeadlineRoute } from './routes/CreateHeadlineRoute.js';
import { CreatePositionRoute } from './routes/CreatePositionRoute.js';
import { DeleteArchetypeRoute } from './routes/DeleteArchetypeRoute.js';
import { DeleteBulletRoute } from './routes/DeleteBulletRoute.js';
import { DeleteCompanyRoute } from './routes/DeleteCompanyRoute.js';
import { DeleteEducationRoute } from './routes/DeleteEducationRoute.js';
import { DeleteHeadlineRoute } from './routes/DeleteHeadlineRoute.js';
import { DeletePositionRoute } from './routes/DeletePositionRoute.js';
import { CreateEducationRoute2 } from './routes/education/CreateEducationRoute2.js';
import { DeleteEducationRoute2 } from './routes/education/DeleteEducationRoute2.js';
import { ListEducationsRoute } from './routes/education/ListEducationsRoute.js';
import { UpdateEducationRoute2 } from './routes/education/UpdateEducationRoute2.js';
import { GenerateCompanyBriefRoute } from './routes/GenerateCompanyBriefRoute.js';
import { GenerateResumeRoute } from './routes/GenerateResumeRoute.js';
import { GetCompanyBriefRoute } from './routes/GetCompanyBriefRoute.js';
import { GetCurrentUserRoute } from './routes/GetCurrentUserRoute.js';
import { GetJobCompanyRoute } from './routes/GetJobCompanyRoute.js';
import { GetJobRoute } from './routes/GetJobRoute.js';
import { GetProfileRoute } from './routes/GetProfileRoute.js';
import { GetUserRoute } from './routes/GetUserRoute.js';
import { CreateHeadline2Route } from './routes/headline/CreateHeadline2Route.js';
import { DeleteHeadline2Route } from './routes/headline/DeleteHeadline2Route.js';
import { ListHeadlines2Route } from './routes/headline/ListHeadlines2Route.js';
import { UpdateHeadline2Route } from './routes/headline/UpdateHeadline2Route.js';
import { healthRoutes } from './routes/health.routes.js';
import { IngestJobByUrlRoute } from './routes/IngestJobByUrlRoute.js';
import { ListArchetypesRoute } from './routes/ListArchetypesRoute.js';
import { ListCompaniesRoute } from './routes/ListCompaniesRoute.js';
import { ListEducationRoute } from './routes/ListEducationRoute.js';
import { ListHeadlinesRoute } from './routes/ListHeadlinesRoute.js';
import { ListJobsRoute } from './routes/ListJobsRoute.js';
import { ReplaceLocationsRoute } from './routes/ReplaceLocationsRoute.js';
import { SetArchetypeEducationRoute } from './routes/SetArchetypeEducationRoute.js';
import { SetArchetypePositionsRoute } from './routes/SetArchetypePositionsRoute.js';
import { SetArchetypeSkillsRoute } from './routes/SetArchetypeSkillsRoute.js';
import { AddSkillItemRoute as NewAddSkillItemRoute } from './routes/skill-categories/AddSkillItemRoute.js';
import { CreateSkillCategoryRoute as NewCreateSkillCategoryRoute } from './routes/skill-categories/CreateSkillCategoryRoute.js';
import { DeleteSkillCategoryRoute as NewDeleteSkillCategoryRoute } from './routes/skill-categories/DeleteSkillCategoryRoute.js';
import { DeleteSkillItemRoute as NewDeleteSkillItemRoute } from './routes/skill-categories/DeleteSkillItemRoute.js';
import { ListSkillCategoriesRoute as NewListSkillCategoriesRoute } from './routes/skill-categories/ListSkillCategoriesRoute.js';
import { UpdateSkillCategoryRoute as NewUpdateSkillCategoryRoute } from './routes/skill-categories/UpdateSkillCategoryRoute.js';
import { UpdateSkillItemRoute as NewUpdateSkillItemRoute } from './routes/skill-categories/UpdateSkillItemRoute.js';
import { ListTagsRoute } from './routes/tag/ListTagsRoute.js';
import { UpdateArchetypeRoute } from './routes/UpdateArchetypeRoute.js';
import { UpdateBulletRoute } from './routes/UpdateBulletRoute.js';
import { UpdateCompanyRoute } from './routes/UpdateCompanyRoute.js';
import { UpdateEducationRoute } from './routes/UpdateEducationRoute.js';
import { UpdateHeadlineRoute } from './routes/UpdateHeadlineRoute.js';
import { UpdateJobCompanyRoute } from './routes/UpdateJobCompanyRoute.js';
import { UpdatePositionRoute } from './routes/UpdatePositionRoute.js';
import { UpdateProfileRoute } from './routes/UpdateProfileRoute.js';
import { UpdateUserRoute } from './routes/UpdateUserRoute.js';

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
  .use(container.get(GetCurrentUserRoute).plugin())
  .use(container.get(GetUserRoute).plugin())
  .use(container.get(UpdateUserRoute).plugin())
  // Profile
  .use(container.get(GetProfileRoute).plugin())
  .use(container.get(UpdateProfileRoute).plugin())
  .use(container.get(ListEducationRoute).plugin())
  .use(container.get(CreateEducationRoute).plugin())
  .use(container.get(UpdateEducationRoute).plugin())
  .use(container.get(DeleteEducationRoute).plugin())
  // Education (new domain model)
  .use(container.get(ListEducationsRoute).plugin())
  .use(container.get(CreateEducationRoute2).plugin())
  .use(container.get(UpdateEducationRoute2).plugin())
  .use(container.get(DeleteEducationRoute2).plugin())
  .use(container.get(ListHeadlinesRoute).plugin())
  .use(container.get(CreateHeadlineRoute).plugin())
  .use(container.get(UpdateHeadlineRoute).plugin())
  .use(container.get(DeleteHeadlineRoute).plugin())
  // Work Experience
  .use(container.get(ListCompaniesRoute).plugin())
  .use(container.get(CreateCompanyRoute).plugin())
  .use(container.get(UpdateCompanyRoute).plugin())
  .use(container.get(DeleteCompanyRoute).plugin())
  .use(container.get(CreatePositionRoute).plugin())
  .use(container.get(UpdatePositionRoute).plugin())
  .use(container.get(DeletePositionRoute).plugin())
  .use(container.get(AddBulletRoute).plugin())
  .use(container.get(UpdateBulletRoute).plugin())
  .use(container.get(DeleteBulletRoute).plugin())
  .use(container.get(ReplaceLocationsRoute).plugin())
  // Skills (new domain model)
  .use(container.get(NewListSkillCategoriesRoute).plugin())
  .use(container.get(NewCreateSkillCategoryRoute).plugin())
  .use(container.get(NewUpdateSkillCategoryRoute).plugin())
  .use(container.get(NewDeleteSkillCategoryRoute).plugin())
  .use(container.get(NewAddSkillItemRoute).plugin())
  .use(container.get(NewUpdateSkillItemRoute).plugin())
  .use(container.get(NewDeleteSkillItemRoute).plugin())
  // Archetypes
  .use(container.get(ListArchetypesRoute).plugin())
  .use(container.get(CreateArchetypeRoute).plugin())
  .use(container.get(UpdateArchetypeRoute).plugin())
  .use(container.get(DeleteArchetypeRoute).plugin())
  .use(container.get(SetArchetypePositionsRoute).plugin())
  .use(container.get(SetArchetypeSkillsRoute).plugin())
  .use(container.get(SetArchetypeEducationRoute).plugin())
  // S2 Headlines (new domain)
  .use(container.get(ListHeadlines2Route).plugin())
  .use(container.get(CreateHeadline2Route).plugin())
  .use(container.get(UpdateHeadline2Route).plugin())
  .use(container.get(DeleteHeadline2Route).plugin())
  // Tags
  .use(container.get(ListTagsRoute).plugin())
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
