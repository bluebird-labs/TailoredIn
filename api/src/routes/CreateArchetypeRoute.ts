import { inject, injectable } from '@needle-di/core';
import type { CreateArchetype } from '@tailoredin/application';
import { Archetype, type UserRepository } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class CreateArchetypeRoute {
  public constructor(
    private readonly createArchetype: CreateArchetype = inject(DI.Archetype.CreateArchetype),
    private readonly userRepository: UserRepository = inject(DI.Resume.UserRepository)
  ) {}

  public plugin() {
    return new Elysia().post(
      '/archetypes',
      async ({ body, set }) => {
        const user = await this.userRepository.findSingle();
        const data = await this.createArchetype.execute({
          userId: user.id.value,
          archetypeKey: body.archetype_key,
          archetypeLabel: body.archetype_label,
          archetypeDescription: body.archetype_description,
          headlineId: body.headline_id,
          socialNetworks: body.social_networks
        });
        set.status = 201;
        return { data };
      },
      {
        body: t.Object({
          archetype_key: t.Enum(Archetype),
          archetype_label: t.String({ minLength: 1 }),
          archetype_description: t.Nullable(t.String()),
          headline_id: t.String({ format: 'uuid' }),
          social_networks: t.Array(t.String())
        })
      }
    );
  }
}
