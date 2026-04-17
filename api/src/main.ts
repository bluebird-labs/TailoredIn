import 'reflect-metadata';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@tailoredin/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';

const log = Logger.create('API');

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const orm = app.get(MikroORM);
  app.use((_req: unknown, _res: unknown, next: () => void) => {
    RequestContext.enter(orm.em);
    next();
  });

  const config = new DocumentBuilder().setTitle('TailoredIn API').setVersion('1.0').addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT ?? 8000;
  await app.listen(port);
  log.info(`Listening on port ${port}...`);

  return app;
}

const isMainModule = process.argv[1]?.endsWith('main.ts') || process.argv[1]?.endsWith('main.js');
if (isMainModule) {
  bootstrap();
}
