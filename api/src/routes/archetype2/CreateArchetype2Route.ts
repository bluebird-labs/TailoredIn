import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import type { CreateArchetype2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';
import { getProfileId } from '../../helpers/profile-id.js';

@injectable()
export class CreateArchetype2Route {
  public constructor(
    private readonly createArchetype: CreateArchetype2 = inject(DI.Archetype2.Create),
    private readonly orm: MikroORM = inject(MikroORM)
  ) {}

  public plugin() {
    return new Elysia().post(
      '/archetypes',
      async ({ body, set }) => {
        const profileId = await getProfileId(this.orm);
        const data = await this.createArchetype.execute({
          profileId,
          key: body.key,
          label: body.label
        });
        set.status = 201;
        return { data };
      },
      {
        body: t.Object({
          key: t.String({ minLength: 1 }),
          label: t.String({ minLength: 1 })
        })
      }
    );
  }
}
