import type Router from '@koa/router';
import { StatusCode } from '@tselect/status-code';

export const healthRoute = (router: Router) => {
  router.get('/health', async ctx => {
    ctx.status = StatusCode.OK;

    ctx.body = {
      ok: true,
      now: new Date()
    };
  });
};
