import { inject, injectable } from '@needle-di/core';
import type { ScoreJobFit } from '@tailoredin/application';
import { EntityNotFoundError } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';
import type { AuthContext } from '../../middleware/auth.js';

@injectable()
export class ScoreJobFitRoute {
  public constructor(private readonly scoreJobFit: ScoreJobFit = inject(DI.JobDescription.ScoreFit)) {}

  public plugin() {
    return new Elysia().post(
      '/job-descriptions/:id/score-fit',
      async ctx => {
        const { auth } = ctx as unknown as AuthContext;
        const { params, set } = ctx;
        try {
          const data = await this.scoreJobFit.execute({ profileId: auth.profileId, jobDescriptionId: params.id });
          return { data };
        } catch (e) {
          if (e instanceof EntityNotFoundError) {
            set.status = 404;
            return { error: { code: 'NOT_FOUND', message: e.message } };
          }
          throw e;
        }
      },
      { params: t.Object({ id: t.String() }) }
    );
  }
}
