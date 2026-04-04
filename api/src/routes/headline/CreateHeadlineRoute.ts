import { inject, injectable } from '@needle-di/core';
import type { CreateHeadline } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class CreateHeadlineRoute {
  public constructor(private readonly createHeadline: CreateHeadline = inject(DI.Headline.Create)) {}

  public plugin() {
    return new Elysia().post(
      '/headlines',
      async ({ body, set }) => {
        const headline = await this.createHeadline.execute({
          profileId: body.profile_id,
          label: body.label,
          summaryText: body.summary_text
        });

        set.status = 201;
        return { data: headline };
      },
      {
        body: t.Object({
          profile_id: t.String({ format: 'uuid' }),
          label: t.String({ minLength: 1 }),
          summary_text: t.String({ minLength: 1 })
        })
      }
    );
  }
}
