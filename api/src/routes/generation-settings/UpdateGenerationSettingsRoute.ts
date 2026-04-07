import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import type { UpdateGenerationSettings } from '@tailoredin/application';
import type { GenerationScope, ModelTier } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';
import { getProfileId } from '../../helpers/profile-id.js';

@injectable()
export class UpdateGenerationSettingsRoute {
  public constructor(
    private readonly updateGenerationSettings: UpdateGenerationSettings = inject(DI.GenerationSettings.Update),
    private readonly orm: MikroORM = inject(MikroORM)
  ) {}

  public plugin() {
    return new Elysia().put(
      '/generation-settings',
      async ({ body }) => {
        const profileId = await getProfileId(this.orm);
        const data = await this.updateGenerationSettings.execute({
          profileId,
          modelTier: body.model_tier as ModelTier | undefined,
          bulletMin: body.bullet_min,
          bulletMax: body.bullet_max,
          prompts: body.prompts?.map(p => ({
            scope: p.scope as GenerationScope,
            content: p.content
          }))
        });
        return { data };
      },
      {
        body: t.Object({
          model_tier: t.Optional(t.Union([t.Literal('fast'), t.Literal('balanced'), t.Literal('best')])),
          bullet_min: t.Optional(t.Integer({ minimum: 1, maximum: 20 })),
          bullet_max: t.Optional(t.Integer({ minimum: 1, maximum: 20 })),
          prompts: t.Optional(
            t.Array(
              t.Object({
                scope: t.Union([t.Literal('resume'), t.Literal('headline'), t.Literal('experience')]),
                content: t.Union([t.String(), t.Null()])
              })
            )
          )
        })
      }
    );
  }
}
