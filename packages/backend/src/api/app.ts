import Koa from 'koa';
import { koaBody } from 'koa-body';
import { makeRouter } from './router';
import morgan from 'koa-morgan';
import * as NpmLog from 'npmlog';
import { StatusCode } from '@tselect/status-code';
import { ZodError } from 'zod';
import { ZodUtil } from '../utils/ZodUtil';
import cors from '@koa/cors';
import { MikroORM, RequestContext } from '@mikro-orm/postgresql';
import { container } from '../di/container';
import { DI } from '../di/DI';

const app = new Koa();
const router = makeRouter();

app.use(cors());
app.use(koaBody());
app.use(morgan('dev'));
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: Error | any) {
    NpmLog.error('app', `Unexpected error on route ${ctx.path}`, err);

    let status: StatusCode;
    let message: string;

    if (err instanceof ZodError) {
      status = StatusCode.BAD_REQUEST;
      message = ZodUtil.zodErrorToMessage(err);
    } else if ('statusCode' in err) {
      status = err.statusCode;
      message = err.message;
    } else {
      status = StatusCode.INTERNAL_SERVER_ERROR;
      message = err.message;
    }

    ctx.status = status;

    ctx.body = {
      error: true,
      message: message
    };
  }
});
app.use(async (ctx, next) => {
  await RequestContext.create(container.get<MikroORM>(DI.Orm).em, next);
});

app.use(router.routes());

export { app };
