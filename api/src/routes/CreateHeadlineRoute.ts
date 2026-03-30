import { inject, injectable } from '@needle-di/core';
import type { CreateHeadline } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class CreateHeadlineRoute {
  public constructor(private readonly createHeadline: CreateHeadline = inject(DI.Resume.CreateHeadline)) {}

  public plugin() {
    return new Elysia().post(
      '/users/:userId/resume/headlines',
      async ({ params, body, set }) => {
        const headline = await this.createHeadline.execute({
          userId: params.userId,
          headlineLabel: body.headline_label,
          summaryText: body.summary_text
        });

        set.status = 201;
        return { data: headline };
      },
      {
        params: t.Object({ userId: t.String({ format: 'uuid' }) }),
        body: t.Object({
          headline_label: t.String({ minLength: 1 }),
          summary_text: t.String({ minLength: 1 })
        })
      }
    );
  }
}
