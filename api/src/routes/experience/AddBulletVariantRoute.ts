import { inject, injectable } from '@needle-di/core';
import type { AddBulletVariant } from '@tailoredin/application';
import type { BulletVariantSource } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class AddBulletVariantRoute {
  public constructor(private readonly addVariant: AddBulletVariant = inject(DI.Experience.AddVariant)) {}

  public plugin() {
    return new Elysia().post(
      '/bullets/:id/variants',
      async ({ params, body, set }) => {
        const result = await this.addVariant.execute({
          experienceId: body.experience_id,
          bulletId: params.id,
          text: body.text,
          angle: body.angle,
          source: (body.source ?? 'manual') as BulletVariantSource,
          roleTags: body.role_tags ?? [],
          skillTags: body.skill_tags ?? []
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 201;
        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          experience_id: t.String({ format: 'uuid' }),
          text: t.String({ minLength: 1 }),
          angle: t.String({ minLength: 1 }),
          source: t.Optional(t.String()),
          role_tags: t.Optional(t.Array(t.String())),
          skill_tags: t.Optional(t.Array(t.String()))
        })
      }
    );
  }
}
