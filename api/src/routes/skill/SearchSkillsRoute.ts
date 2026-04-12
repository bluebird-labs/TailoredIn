import { inject, injectable } from '@needle-di/core';
import type { SearchSkills } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class SearchSkillsRoute {
  public constructor(private readonly searchSkills: SearchSkills = inject(DI.Skill.Search)) {}

  public plugin() {
    return new Elysia().get(
      '/skills',
      async ({ query }) => {
        const data = await this.searchSkills.execute({ query: query.q, limit: query.limit });
        return { data };
      },
      {
        query: t.Object({
          q: t.String({ minLength: 1 }),
          limit: t.Optional(t.Integer({ minimum: 1, maximum: 100 }))
        })
      }
    );
  }
}
