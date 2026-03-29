import Router from '@koa/router';
import type { MikroORM } from '@mikro-orm/postgresql';
import { ResumeDI, type ResumeGenerator } from '@tailoredin/resume';
import { container } from './di/container.js';
import { ApiDI } from './di/DI.js';
import { healthRoute } from './routes/healthRoute.js';
import { jobRoutes } from './routes/jobRoutes.js';

export const makeRouter = () => {
  const router = new Router();
  const orm = container.get<MikroORM>(ApiDI.Orm);
  const resumeGenerator = container.get<ResumeGenerator>(ResumeDI.ResumeGenerator);

  healthRoute(router);
  jobRoutes(router, orm, resumeGenerator);

  return router;
};
