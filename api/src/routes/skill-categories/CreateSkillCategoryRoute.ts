import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import type { CreateSkillCategory } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';
import { getProfileId } from '../../helpers/profile-id.js';

@injectable()
export class CreateSkillCategoryRoute {
  public constructor(
    private readonly createSkillCategory: CreateSkillCategory = inject(DI.SkillCategory.CreateSkillCategory),
    private readonly orm: MikroORM = inject(MikroORM)
  ) {}

  public plugin() {
    return new Elysia().post(
      '/skill-categories',
      async ({ body, set }) => {
        const profileId = await getProfileId(this.orm);
        const data = await this.createSkillCategory.execute({
          profileId,
          name: body.name,
          ordinal: body.ordinal,
          items: body.items?.map(i => ({ name: i.name, ordinal: i.ordinal }))
        });
        set.status = 201;
        return { data };
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          ordinal: t.Integer({ minimum: 0 }),
          items: t.Optional(t.Array(t.Object({ name: t.String({ minLength: 1 }), ordinal: t.Integer({ minimum: 0 }) })))
        })
      }
    );
  }
}
