import { ExternalServiceError } from '@tailoredin/application';
import { Logger } from '@tailoredin/core';
import { Elysia } from 'elysia';
import { container } from './container.js';
import { CreateApplicationRoute } from './routes/application/CreateApplicationRoute.js';
import { DeleteApplicationRoute } from './routes/application/DeleteApplicationRoute.js';
import { GetApplicationRoute } from './routes/application/GetApplicationRoute.js';
import { ListApplicationsRoute } from './routes/application/ListApplicationsRoute.js';
import { UpdateApplicationRoute } from './routes/application/UpdateApplicationRoute.js';
import { UpdateApplicationStatusRoute } from './routes/application/UpdateApplicationStatusRoute.js';
import { configRoute } from './routes/ConfigRoute.js';
import { CreateCompanyRoute } from './routes/company/CreateCompanyRoute.js';
import { EnrichCompanyRoute } from './routes/company/EnrichCompanyRoute.js';
import { ListCompaniesRoute } from './routes/company/ListCompaniesRoute.js';
import { SearchCompaniesRoute } from './routes/company/SearchCompaniesRoute.js';
import { UpdateCompanyRoute } from './routes/company/UpdateCompanyRoute.js';
import { CreateEducationRoute } from './routes/education/CreateEducationRoute.js';
import { DeleteEducationRoute } from './routes/education/DeleteEducationRoute.js';
import { ListEducationsRoute } from './routes/education/ListEducationsRoute.js';
import { UpdateEducationRoute } from './routes/education/UpdateEducationRoute.js';
import { AddAccomplishmentRoute } from './routes/experience/AddAccomplishmentRoute.js';
import { CreateExperienceRoute } from './routes/experience/CreateExperienceRoute.js';
import { DeleteAccomplishmentRoute } from './routes/experience/DeleteAccomplishmentRoute.js';
import { DeleteExperienceRoute } from './routes/experience/DeleteExperienceRoute.js';
import { LinkCompanyRoute } from './routes/experience/LinkCompanyRoute.js';
import { ListExperiencesRoute } from './routes/experience/ListExperiencesRoute.js';
import { UnlinkCompanyRoute } from './routes/experience/UnlinkCompanyRoute.js';
import { UpdateAccomplishmentRoute } from './routes/experience/UpdateAccomplishmentRoute.js';
import { UpdateExperienceRoute } from './routes/experience/UpdateExperienceRoute.js';
import { ExtractTextRoute } from './routes/factory/ExtractTextRoute.js';
import { GetProfileRoute } from './routes/GetProfileRoute.js';
import { CreateHeadlineRoute } from './routes/headline/CreateHeadlineRoute.js';
import { DeleteHeadlineRoute } from './routes/headline/DeleteHeadlineRoute.js';
import { ListHeadlinesRoute } from './routes/headline/ListHeadlinesRoute.js';
import { UpdateHeadlineRoute } from './routes/headline/UpdateHeadlineRoute.js';
import { healthRoutes } from './routes/health.routes.js';
import { CreateJobDescriptionRoute } from './routes/job-description/CreateJobDescriptionRoute.js';
import { DeleteJobDescriptionRoute } from './routes/job-description/DeleteJobDescriptionRoute.js';
import { GetJobDescriptionRoute } from './routes/job-description/GetJobDescriptionRoute.js';
import { ListJobDescriptionsRoute } from './routes/job-description/ListJobDescriptionsRoute.js';
import { ParseJobDescriptionRoute } from './routes/job-description/ParseJobDescriptionRoute.js';
import { UpdateJobDescriptionRoute } from './routes/job-description/UpdateJobDescriptionRoute.js';
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
  .onError(({ request, error, set, code }) => {
    if (code === 'VALIDATION') return;

    // Elysia may wrap thrown errors — check both the error and its cause
    const source =
      error instanceof ExternalServiceError
        ? error
        : error instanceof Error && error.cause instanceof ExternalServiceError
          ? error.cause
          : null;

    const statusCode = source?.statusCode ?? 500;
    const errorCode = source?.code ?? (statusCode === 500 ? 'INTERNAL_ERROR' : 'SERVER_ERROR');
    const message = source?.message ?? (error instanceof Error ? error.message : String(error));

    set.status = statusCode;
    logRequest(request, statusCode, startTimes.get(request));

    if (statusCode === 500) {
      log.error(error instanceof Error ? error.stack : String(error));
    }

    return {
      error: {
        code: errorCode,
        message: statusCode === 500 ? 'Internal server error' : message
      }
    };
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
  .use(container.get(LinkCompanyRoute).plugin())
  .use(container.get(UnlinkCompanyRoute).plugin())
  // Factory
  .use(container.get(ExtractTextRoute).plugin())
  // Companies
  .use(container.get(ListCompaniesRoute).plugin())
  .use(container.get(SearchCompaniesRoute).plugin())
  .use(container.get(EnrichCompanyRoute).plugin())
  .use(container.get(CreateCompanyRoute).plugin())
  .use(container.get(UpdateCompanyRoute).plugin())
  // Applications
  .use(container.get(CreateApplicationRoute).plugin())
  .use(container.get(GetApplicationRoute).plugin())
  .use(container.get(ListApplicationsRoute).plugin())
  .use(container.get(UpdateApplicationRoute).plugin())
  .use(container.get(UpdateApplicationStatusRoute).plugin())
  .use(container.get(DeleteApplicationRoute).plugin())
  // Job Descriptions
  .use(container.get(ParseJobDescriptionRoute).plugin())
  .use(container.get(CreateJobDescriptionRoute).plugin())
  .use(container.get(GetJobDescriptionRoute).plugin())
  .use(container.get(ListJobDescriptionsRoute).plugin())
  .use(container.get(UpdateJobDescriptionRoute).plugin())
  .use(container.get(DeleteJobDescriptionRoute).plugin())
  .listen(port);

log.info(`Listening on port ${port}...`);

export type App = typeof app;
