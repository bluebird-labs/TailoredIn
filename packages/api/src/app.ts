import cors from '@koa/cors';
import { type MikroORM, RequestContext } from '@mikro-orm/postgresql';
import { ZodUtil } from '@tailoredin/shared';
import { StatusCode } from '@tselect/status-code';
import Koa from 'koa';
import { koaBody } from 'koa-body';
import morgan from 'koa-morgan';
import * as NpmLog from 'npmlog';
import { ZodError } from 'zod';
import { container } from './di/container.js';
import { ApiDI } from './di/DI.js';
import { makeRouter } from './router.js';

const app = new Koa();
const router = makeRouter();

app.use(cors());
app.use(koaBody());
app.use(morgan('dev'));
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: unknown) {
    NpmLog.error('app', `Unexpected error on route ${ctx.path}`, err);

    let status: StatusCode;
    let message: string;

    if (err instanceof ZodError) {
      status = StatusCode.BAD_REQUEST;
      message = ZodUtil.zodErrorToMessage(err);
    } else if (err instanceof Error && 'statusCode' in err) {
      status = (err as Error & { statusCode: StatusCode }).statusCode;
      message = err.message;
    } else if (err instanceof Error) {
      status = StatusCode.INTERNAL_SERVER_ERROR;
      message = err.message;
    } else {
      status = StatusCode.INTERNAL_SERVER_ERROR;
      message = String(err);
    }

    ctx.status = status;

    ctx.body = {
      error: true,
      message: message
    };
  }
});
app.use(async (_ctx, next) => {
  await RequestContext.create(container.get<MikroORM>(ApiDI.Orm).em, next);
});

app.use(router.routes());

export { app };
