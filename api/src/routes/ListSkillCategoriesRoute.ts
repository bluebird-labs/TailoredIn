import { inject, injectable } from '@needle-di/core';
import type { ListSkillCategories } from '@tailoredin/application';
import type { UserRepository } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListSkillCategoriesRoute {
  public constructor(
    private readonly listSkillCategories: ListSkillCategories = inject(DI.Resume.ListSkillCategories),
    private readonly userRepository: UserRepository = inject(DI.Resume.UserRepository)
  ) {}

  public plugin() {
    return new Elysia().get('/resume/skills', async () => {
      const user = await this.userRepository.findSingle();
      const data = await this.listSkillCategories.execute({ userId: user.id.value });
      return { data };
    });
  }
}
