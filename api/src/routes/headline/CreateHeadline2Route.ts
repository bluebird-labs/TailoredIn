import { inject, injectable } from '@needle-di/core';
import type { CreateHeadline2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class CreateHeadline2Route {
  public constructor(private readonly createHeadline: CreateHeadline2 = inject(DI.Headline.Create)) {}

  public plugin() {
    return new Elysia().post(
      '/headlines',
      async ({ body, set }) => {
        const headline = await this.createHeadline.execute({
          profileId: body.profile_id,
          label: body.label,
          summaryText: body.summary_text,
          roleTagIds: body.role_tag_ids
        });

        set.status = 201;
        return { data: headline };
      },
      {
        body: t.Object({
          profile_id: t.String({ format: 'uuid' }),
          label: t.String({ minLength: 1 }),
          summary_text: t.String({ minLength: 1 }),
          role_tag_ids: t.Array(t.String({ format: 'uuid' }))
        })
      }
    );
  }
}
