import { inject, injectable } from '@needle-di/core';
import { ResumeNotReadyError, type ScoreResume } from '@tailoredin/application';
import { EntityNotFoundError } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class ScoreResumeRoute {
  public constructor(private readonly scoreResume: ScoreResume = inject(DI.Resume.Score)) {}

  public plugin() {
    return new Elysia().post(
      '/resume/:id/score',
      async ({ params, set }) => {
        try {
          const data = await this.scoreResume.execute({ resumeContentId: params.id });
          return { data };
        } catch (e) {
          if (e instanceof EntityNotFoundError) {
            set.status = 404;
            return { error: { code: 'NOT_FOUND', message: e.message } };
          }
          if (e instanceof ResumeNotReadyError) {
            set.status = 409;
            return { error: { code: 'NOT_READY', message: e.message } };
          }
          throw e;
        }
      },
      { params: t.Object({ id: t.String() }) }
    );
  }
}
