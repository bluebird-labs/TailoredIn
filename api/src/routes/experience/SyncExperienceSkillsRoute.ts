import { inject, injectable } from '@needle-di/core';
import type { SyncExperienceSkills } from '@tailoredin/application';
import { EntityNotFoundError } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class SyncExperienceSkillsRoute {
  public constructor(
    private readonly syncExperienceSkills: SyncExperienceSkills = inject(DI.Skill.SyncExperienceSkills)
  ) {}

  public plugin() {
    return new Elysia().put(
      '/experiences/:id/skills',
      async ({ params, body, set }) => {
        try {
          const data = await this.syncExperienceSkills.execute({
            experienceId: params.id,
            skillIds: body.skill_ids
          });
          return { data };
        } catch (e) {
          if (e instanceof EntityNotFoundError) {
            set.status = 404;
            return { error: { code: 'NOT_FOUND', message: e.message } };
          }
          if (e instanceof Error && e.message.startsWith('Skills not found')) {
            set.status = 400;
            return { error: { code: 'INVALID_SKILLS', message: e.message } };
          }
          throw e;
        }
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          skill_ids: t.Array(t.String({ format: 'uuid' }))
        })
      }
    );
  }
}
