import { inject, injectable } from '@needle-di/core';
import type { ListSkills } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListSkillsRoute {
  public constructor(private readonly listSkills: ListSkills = inject(DI.Skill.List)) {}

  public plugin() {
    return new Elysia().get('/skills/all', async () => {
      const data = await this.listSkills.execute();
      return { data };
    });
  }
}
