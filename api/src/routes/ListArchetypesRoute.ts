import { inject, injectable } from '@needle-di/core';
import type { ListArchetypes } from '@tailoredin/application';
import type { UserRepository } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListArchetypesRoute {
  public constructor(
    private readonly listArchetypes: ListArchetypes = inject(DI.Archetype.ListArchetypes),
    private readonly userRepository: UserRepository = inject(DI.Resume.UserRepository)
  ) {}

  public plugin() {
    return new Elysia().get('/archetypes', async () => {
      const user = await this.userRepository.findSingle();
      const data = await this.listArchetypes.execute({ userId: user.id.value });
      return { data };
    });
  }
}
