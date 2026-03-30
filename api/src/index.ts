import 'reflect-metadata';
import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { staticPlugin } from '@elysiajs/static';
import { Logger } from '@tailoredin/core/src/Logger.js';
import { Elysia } from 'elysia';
import { container } from './container.js';
import { healthRoutes } from './routes/health.routes.js';
import { jobRoutes } from './routes/jobs.routes.js';

// --- App ---

const log = Logger.create('API');
const port = Number(process.env.API_PORT ?? 8000);

const webDistPath = resolve(import.meta.dirname!, '../../web/dist');
const serveSpa = existsSync(webDistPath);

const app = new Elysia()
  .use(healthRoutes)
  .use(jobRoutes(container))
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

if (serveSpa) {
  app
    .use(staticPlugin({ assets: webDistPath, prefix: '/' }))
    .get(
      '/*',
      () =>
        new Response(readFileSync(`${webDistPath}/index.html`, 'utf-8'), { headers: { 'content-type': 'text/html' } })
    );
  log.info('Serving SPA from web/dist');
}

log.info(`Listening on port ${port}...`);

export type App = typeof app;
