import { inject, injectable } from '@needle-di/core';
import type { SuggestBullets } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class SuggestBulletsRoute {
  public constructor(private readonly suggestBullets: SuggestBullets = inject(DI.Archetype.SuggestBullets)) {}

  public plugin() {
    return new Elysia().post(
      '/archetypes/suggest-bullets',
      async ({ body, set }) => {
        const result = await this.suggestBullets.execute({
          jobDescription: body.job_description,
          provider: body.provider as import('@tailoredin/application').LlmProviderKey
        });
        if (!result.isOk) {
          set.status = 400;
          return { error: { code: 'SUGGESTION_FAILED', message: result.error.message } };
        }
        return { data: result.value };
      },
      {
        body: t.Object({
          job_description: t.String({ minLength: 50 }),
          provider: t.Optional(t.String())
        })
      }
    );
  }
}
