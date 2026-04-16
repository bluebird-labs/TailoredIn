import { inject, injectable } from '@needle-di/core';
import type { UpdateProfile } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';
import type { AuthContext } from '../middleware/auth.js';

@injectable()
export class UpdateProfileRoute {
  public constructor(private readonly updateProfile: UpdateProfile = inject(DI.Profile.UpdateProfile)) {}

  public plugin() {
    return new Elysia().put(
      '/profile',
      async ctx => {
        const { auth } = ctx as unknown as AuthContext;
        const { body } = ctx;
        const profile = await this.updateProfile.execute({
          profileId: auth.profileId,
          email: body.email,
          firstName: body.first_name,
          lastName: body.last_name,
          about: body.about,
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
          about: t.Union([t.String(), t.Null()]),
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
