import { Logger } from '@tailoredin/core';
import { Elysia } from 'elysia';
import { container } from './container.js';
import { configRoute } from './routes/ConfigRoute.js';
import { CreateCompanyRoute } from './routes/company/CreateCompanyRoute.js';
import { EnrichCompanyRoute } from './routes/company/EnrichCompanyRoute.js';
import { ListCompaniesRoute } from './routes/company/ListCompaniesRoute.js';
import { CreateEducationRoute } from './routes/education/CreateEducationRoute.js';
import { DeleteEducationRoute } from './routes/education/DeleteEducationRoute.js';
import { ListEducationsRoute } from './routes/education/ListEducationsRoute.js';
import { UpdateEducationRoute } from './routes/education/UpdateEducationRoute.js';
import { AddAccomplishmentRoute } from './routes/experience/AddAccomplishmentRoute.js';
import { CreateExperienceRoute } from './routes/experience/CreateExperienceRoute.js';
import { DeleteAccomplishmentRoute } from './routes/experience/DeleteAccomplishmentRoute.js';
import { DeleteExperienceRoute } from './routes/experience/DeleteExperienceRoute.js';
import { ListExperiencesRoute } from './routes/experience/ListExperiencesRoute.js';
import { UpdateAccomplishmentRoute } from './routes/experience/UpdateAccomplishmentRoute.js';
import { UpdateExperienceRoute } from './routes/experience/UpdateExperienceRoute.js';
import { ExtractTextRoute } from './routes/factory/ExtractTextRoute.js';
import { GetProfileRoute } from './routes/GetProfileRoute.js';
import { CreateHeadlineRoute } from './routes/headline/CreateHeadlineRoute.js';
import { DeleteHeadlineRoute } from './routes/headline/DeleteHeadlineRoute.js';
import { ListHeadlinesRoute } from './routes/headline/ListHeadlinesRoute.js';
import { UpdateHeadlineRoute } from './routes/headline/UpdateHeadlineRoute.js';
import { healthRoutes } from './routes/health.routes.js';
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
  .use(configRoute())
  // Profile
  .use(container.get(GetProfileRoute).plugin())
  .use(container.get(UpdateProfileRoute).plugin())
  // Education
  .use(container.get(ListEducationsRoute).plugin())
  .use(container.get(CreateEducationRoute).plugin())
  .use(container.get(UpdateEducationRoute).plugin())
  .use(container.get(DeleteEducationRoute).plugin())
  // Headlines
  .use(container.get(ListHeadlinesRoute).plugin())
  .use(container.get(CreateHeadlineRoute).plugin())
  .use(container.get(UpdateHeadlineRoute).plugin())
  .use(container.get(DeleteHeadlineRoute).plugin())
  // Experiences
  .use(container.get(ListExperiencesRoute).plugin())
  .use(container.get(CreateExperienceRoute).plugin())
  .use(container.get(UpdateExperienceRoute).plugin())
  .use(container.get(DeleteExperienceRoute).plugin())
  .use(container.get(AddAccomplishmentRoute).plugin())
  .use(container.get(UpdateAccomplishmentRoute).plugin())
  .use(container.get(DeleteAccomplishmentRoute).plugin())
  // Factory
  .use(container.get(ExtractTextRoute).plugin())
  // Companies
  .use(container.get(ListCompaniesRoute).plugin())
  .use(container.get(EnrichCompanyRoute).plugin())
  .use(container.get(CreateCompanyRoute).plugin())
  .onError(({ request, error, set, code }) => {
    const err = error as unknown as { statusCode?: number; message?: string };
    const message = err.message ?? String(error);

    if (code === 'VALIDATION') return;

    const statusCode = err.statusCode ?? 500;
    set.status = statusCode;
    logRequest(request, statusCode, startTimes.get(request));
    if (statusCode === 500) log.error(error instanceof Error ? error.stack : String(error));
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
