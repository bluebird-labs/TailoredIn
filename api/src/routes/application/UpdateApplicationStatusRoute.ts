import { inject, injectable } from '@needle-di/core';
import type { UpdateApplicationStatus } from '@tailoredin/application';
import type { ApplicationStatus } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateApplicationStatusRoute {
  public constructor(
    private readonly updateApplicationStatus: UpdateApplicationStatus = inject(DI.Application.UpdateStatus)
  ) {}

  public plugin() {
    return new Elysia().patch(
      '/applications/:id/status',
      async ({ params, body, set }) => {
        try {
          const data = await this.updateApplicationStatus.execute({
            applicationId: params.id,
            status: body.status as ApplicationStatus,
            archiveReason: body.archive_reason,
            withdrawReason: body.withdraw_reason
          });
          return { data };
        } catch (e) {
          if (e instanceof Error && e.message.startsWith('Application not found')) {
            set.status = 404;
            return { error: { code: 'NOT_FOUND', message: e.message } };
          }
          if (
            e instanceof Error &&
            (e.message.includes('reason is required') ||
              e.message.includes('Use archive()') ||
              e.message.includes('Use withdraw()'))
          ) {
            set.status = 422;
            return { error: { code: 'VALIDATION_ERROR', message: e.message } };
          }
          throw e;
        }
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          status: t.String({ minLength: 1 }),
          archive_reason: t.Optional(t.String({ minLength: 1 })),
          withdraw_reason: t.Optional(t.String({ minLength: 1 }))
        })
      }
    );
  }
}
