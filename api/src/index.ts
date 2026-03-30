import 'reflect-metadata';
import 'dotenv/config';
import { Logger } from '@tailoredin/core/src/Logger.js';
import { Elysia } from 'elysia';
import { container } from './container.js';
import { ChangeJobStatusRoute } from './routes/ChangeJobStatusRoute.js';
import { GenerateResumeRoute } from './routes/GenerateResumeRoute.js';
import { GetJobRoute } from './routes/GetJobRoute.js';
import { GetTopJobRoute } from './routes/GetTopJobRoute.js';
import { healthRoutes } from './routes/health.routes.js';

// --- App ---

const log = Logger.create('API');
const port = Number(process.env.API_PORT ?? 8000);

const app = new Elysia()
  .use(healthRoutes)
  .use(container.get(GetTopJobRoute).plugin())
  .use(container.get(GetJobRoute).plugin())
  .use(container.get(ChangeJobStatusRoute).plugin())
  .use(container.get(GenerateResumeRoute).plugin())
  .onError(({ error, set }) => {
    const err = error as unknown as { statusCode?: number; message?: string };
    const statusCode = err.statusCode;
    const message = err.message ?? String(error);

    if (statusCode) {
      set.status = statusCode;
      return { error: message };
    }

    log.error(message);
    set.status = 500;
    return { error: 'Internal server error' };
  })
  .listen(port);

log.info(`Listening on port ${port}...`);

export type App = typeof app;
