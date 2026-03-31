import { Logger } from '@tailoredin/core';
import { Elysia } from 'elysia';
import { container, llmAvailable } from './container.js';
import { AddBulletRoute } from './routes/AddBulletRoute.js';
import { AddSkillItemRoute } from './routes/AddSkillItemRoute.js';
import { ChangeJobStatusRoute } from './routes/ChangeJobStatusRoute.js';
import { configRoute } from './routes/ConfigRoute.js';
import { CreateArchetypeRoute } from './routes/CreateArchetypeRoute.js';
import { CreateCompanyRoute } from './routes/CreateCompanyRoute.js';
import { CreateEducationRoute } from './routes/CreateEducationRoute.js';
import { CreateHeadlineRoute } from './routes/CreateHeadlineRoute.js';
import { CreateSkillCategoryRoute } from './routes/CreateSkillCategoryRoute.js';
import { DeleteArchetypeRoute } from './routes/DeleteArchetypeRoute.js';
import { DeleteBulletRoute } from './routes/DeleteBulletRoute.js';
import { DeleteCompanyRoute } from './routes/DeleteCompanyRoute.js';
import { DeleteEducationRoute } from './routes/DeleteEducationRoute.js';
import { DeleteHeadlineRoute } from './routes/DeleteHeadlineRoute.js';
import { DeleteSkillCategoryRoute } from './routes/DeleteSkillCategoryRoute.js';
import { DeleteSkillItemRoute } from './routes/DeleteSkillItemRoute.js';
import { GenerateResumeRoute } from './routes/GenerateResumeRoute.js';
import { GetCurrentUserRoute } from './routes/GetCurrentUserRoute.js';
import { GetJobRoute } from './routes/GetJobRoute.js';
import { GetTopJobRoute } from './routes/GetTopJobRoute.js';
import { GetUserRoute } from './routes/GetUserRoute.js';
import { healthRoutes } from './routes/health.routes.js';
import { IngestJobByUrlRoute } from './routes/IngestJobByUrlRoute.js';
import { ListArchetypesRoute } from './routes/ListArchetypesRoute.js';
import { ListCompaniesRoute } from './routes/ListCompaniesRoute.js';
import { ListEducationRoute } from './routes/ListEducationRoute.js';
import { ListHeadlinesRoute } from './routes/ListHeadlinesRoute.js';
import { ListJobsRoute } from './routes/ListJobsRoute.js';
import { ListSkillCategoriesRoute } from './routes/ListSkillCategoriesRoute.js';
import { ReplaceLocationsRoute } from './routes/ReplaceLocationsRoute.js';
import { SetArchetypeEducationRoute } from './routes/SetArchetypeEducationRoute.js';
import { SetArchetypePositionsRoute } from './routes/SetArchetypePositionsRoute.js';
import { SetArchetypeSkillsRoute } from './routes/SetArchetypeSkillsRoute.js';
import { UpdateArchetypeRoute } from './routes/UpdateArchetypeRoute.js';
import { UpdateBulletRoute } from './routes/UpdateBulletRoute.js';
import { UpdateCompanyRoute } from './routes/UpdateCompanyRoute.js';
import { UpdateEducationRoute } from './routes/UpdateEducationRoute.js';
import { UpdateHeadlineRoute } from './routes/UpdateHeadlineRoute.js';
import { UpdateSkillCategoryRoute } from './routes/UpdateSkillCategoryRoute.js';
import { UpdateSkillItemRoute } from './routes/UpdateSkillItemRoute.js';
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
  .use(container.get(GetTopJobRoute).plugin())
  .use(container.get(GetJobRoute).plugin())
  .use(container.get(ChangeJobStatusRoute).plugin())
  .use(container.get(IngestJobByUrlRoute).plugin())
  .use(container.get(GenerateResumeRoute).plugin())
  .use(container.get(GetCurrentUserRoute).plugin())
  .use(container.get(GetUserRoute).plugin())
  .use(container.get(UpdateUserRoute).plugin())
  .use(container.get(ListEducationRoute).plugin())
  .use(container.get(CreateEducationRoute).plugin())
  .use(container.get(UpdateEducationRoute).plugin())
  .use(container.get(DeleteEducationRoute).plugin())
  .use(container.get(ListHeadlinesRoute).plugin())
  .use(container.get(CreateHeadlineRoute).plugin())
  .use(container.get(UpdateHeadlineRoute).plugin())
  .use(container.get(DeleteHeadlineRoute).plugin())
  // Work Experience
  .use(container.get(ListCompaniesRoute).plugin())
  .use(container.get(CreateCompanyRoute).plugin())
  .use(container.get(UpdateCompanyRoute).plugin())
  .use(container.get(DeleteCompanyRoute).plugin())
  .use(container.get(AddBulletRoute).plugin())
  .use(container.get(UpdateBulletRoute).plugin())
  .use(container.get(DeleteBulletRoute).plugin())
  .use(container.get(ReplaceLocationsRoute).plugin())
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
  .use(container.get(SetArchetypePositionsRoute).plugin())
  .use(container.get(SetArchetypeSkillsRoute).plugin())
  .use(container.get(SetArchetypeEducationRoute).plugin())
  .onError(({ request, error, set, code }) => {
    const err = error as unknown as { statusCode?: number; message?: string };
    const message = err.message ?? String(error);

    if (code === 'VALIDATION') return;

    const statusCode = err.statusCode ?? 500;
    set.status = statusCode;
    logRequest(request, statusCode, startTimes.get(request));
    return { error: statusCode === 500 ? 'Internal server error' : message };
  })
  .listen(port);

log.info(`Listening on port ${port}...`);

export type App = typeof app;
