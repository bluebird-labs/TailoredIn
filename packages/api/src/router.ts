import Router            from '@koa/router';
import { healthRoute }   from './routes/healthRoute.js';
import { jobRoutes }     from './routes/jobRoutes.js';
import { container }     from './di/container.js';
import { ApiDI }         from './di/DI.js';
import { ResumeDI }      from '@tailoredin/resume';
import { MikroORM }      from '@mikro-orm/postgresql';
import { ResumeGenerator } from '@tailoredin/resume';

export const makeRouter = () => {
  const router = new Router();
  const orm = container.get<MikroORM>(ApiDI.Orm);
  const resumeGenerator = container.get<ResumeGenerator>(ResumeDI.ResumeGenerator);

  healthRoute(router);
  jobRoutes(router, orm, resumeGenerator);

  return router;
};
