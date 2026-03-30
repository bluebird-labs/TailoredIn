import { inject, injectable } from '@needle-di/core';
import type { UpdateUser } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateUserRoute {
  public constructor(private readonly updateUser: UpdateUser = inject(DI.Resume.UpdateUser)) {}

  public plugin() {
    return new Elysia().put(
      '/users/:userId',
      async ({ params, body }) => {
        const user = await this.updateUser.execute({
          userId: params.userId,
          email: body.email,
          firstName: body.first_name,
          lastName: body.last_name,
          phoneNumber: body.phone_number,
          githubHandle: body.github_handle,
          linkedinHandle: body.linkedin_handle,
          locationLabel: body.location_label
        });

        return { data: user };
      },
      {
        params: t.Object({ userId: t.String({ format: 'uuid' }) }),
        body: t.Object({
          email: t.String({ format: 'email' }),
          first_name: t.String({ minLength: 1 }),
          last_name: t.String({ minLength: 1 }),
          phone_number: t.Union([t.String(), t.Null()]),
          github_handle: t.Union([t.String(), t.Null()]),
          linkedin_handle: t.Union([t.String(), t.Null()]),
          location_label: t.Union([t.String(), t.Null()])
        })
      }
    );
  }
}
