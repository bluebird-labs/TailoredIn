import { inject, injectable } from '@needle-di/core';
import type { UpdateResumeDisplaySettings } from '@tailoredin/application';
import { EntityNotFoundError } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateResumeDisplaySettingsRoute {
  public constructor(
    private readonly updateDisplaySettings: UpdateResumeDisplaySettings = inject(DI.Resume.UpdateDisplaySettings)
  ) {}

  public plugin() {
    return new Elysia().patch(
      '/resume/display-settings',
      async ({ body, set }) => {
        try {
          await this.updateDisplaySettings.execute({
            jobDescriptionId: body.jobDescriptionId,
            experienceHiddenBullets: body.experienceHiddenBullets,
            hiddenEducationIds: body.hiddenEducationIds
          });
          return { data: { success: true } };
        } catch (e) {
          if (e instanceof EntityNotFoundError) {
            set.status = 404;
            return { error: { code: 'NOT_FOUND', message: e.message } };
          }
          throw e;
        }
      },
      {
        body: t.Object({
          jobDescriptionId: t.String(),
          experienceHiddenBullets: t.Optional(
            t.Array(
              t.Object({
                experienceId: t.String(),
                hiddenBulletIndices: t.Array(t.Integer({ minimum: 0 }))
              })
            )
          ),
          hiddenEducationIds: t.Optional(t.Array(t.String()))
        })
      }
    );
  }
}
