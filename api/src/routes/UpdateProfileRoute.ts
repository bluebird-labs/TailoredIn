import { inject, injectable } from '@needle-di/core';
import type { UpdateProfile } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateProfileRoute {
  public constructor(private readonly updateProfile: UpdateProfile = inject(DI.Profile.UpdateProfile)) {}

  public plugin() {
    return new Elysia().put(
      '/profile',
      async ({ body }) => {
        const profile = await this.updateProfile.execute({
          email: body.email,
          firstName: body.first_name,
          lastName: body.last_name,
          phone: body.phone,
          location: body.location,
          linkedinUrl: body.linkedin_url,
          githubUrl: body.github_url,
          websiteUrl: body.website_url
        });

        return { data: profile };
      },
      {
        body: t.Object({
          email: t.String({ format: 'email' }),
          first_name: t.String({ minLength: 1 }),
          last_name: t.String({ minLength: 1 }),
          phone: t.Union([t.String(), t.Null()]),
          location: t.Union([t.String(), t.Null()]),
          linkedin_url: t.Union([t.String(), t.Null()]),
          github_url: t.Union([t.String(), t.Null()]),
          website_url: t.Union([t.String(), t.Null()])
        })
      }
    );
  }
}
