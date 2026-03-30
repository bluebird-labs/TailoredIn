import { inject, injectable } from '@needle-di/core';
import type { CreateSkillCategory } from '@tailoredin/application';
import type { UserRepository } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class CreateSkillCategoryRoute {
  public constructor(
    private readonly createSkillCategory: CreateSkillCategory = inject(DI.Resume.CreateSkillCategory),
    private readonly userRepository: UserRepository = inject(DI.Resume.UserRepository)
  ) {}

  public plugin() {
    return new Elysia().post(
      '/resume/skills',
      async ({ body, set }) => {
        const user = await this.userRepository.findSingle();
        const data = await this.createSkillCategory.execute({
          userId: user.id.value,
          categoryName: body.category_name,
          ordinal: body.ordinal,
          items: body.items?.map(i => ({ skillName: i.skill_name, ordinal: i.ordinal }))
        });
        set.status = 201;
        return { data };
      },
      {
        body: t.Object({
          category_name: t.String({ minLength: 1 }),
          ordinal: t.Integer({ minimum: 0 }),
          items: t.Optional(
            t.Array(t.Object({ skill_name: t.String({ minLength: 1 }), ordinal: t.Integer({ minimum: 0 }) }))
          )
        })
      }
    );
  }
}
