import Router from '@koa/router';
import { healthRoute } from './routes/healthRoute';
import { jobRoutes } from './routes/jobRoutes';
import { container } from '../di/container';
import { MikroORM } from '@mikro-orm/postgresql';
import { DI } from '../di/DI';
import { ResumeGenerator } from '../resume-generator/ResumeGenerator';

export const makeRouter = () => {
  const router = new Router();
  const orm = container.get<MikroORM>(DI.Orm);
  const resumeGenerator = container.get<ResumeGenerator>(DI.ResumeGenerator);

  // Add routes.
  healthRoute(router);
  jobRoutes(router, orm, resumeGenerator);

  return router;
};
