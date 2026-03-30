import { inject, injectable } from '@needle-di/core';
import type { CreateCompany } from '@tailoredin/application';
import type { UserRepository } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class CreateCompanyRoute {
  public constructor(
    private readonly createCompany: CreateCompany = inject(DI.Resume.CreateCompany),
    private readonly userRepository: UserRepository = inject(DI.Resume.UserRepository)
  ) {}

  public plugin() {
    return new Elysia().post(
      '/resume/companies',
      async ({ body, set }) => {
        const user = await this.userRepository.findSingle();
        const data = await this.createCompany.execute({
          userId: user.id.value,
          companyName: body.company_name,
          companyMention: body.company_mention,
          websiteUrl: body.website_url,
          businessDomain: body.business_domain,
          joinedAt: body.joined_at,
          leftAt: body.left_at,
          promotedAt: body.promoted_at,
          locations: body.locations,
          bullets: body.bullets
        });
        set.status = 201;
        return { data };
      },
      {
        body: t.Object({
          company_name: t.String({ minLength: 1 }),
          company_mention: t.Nullable(t.String()),
          website_url: t.Nullable(t.String()),
          business_domain: t.String({ minLength: 1 }),
          joined_at: t.String({ minLength: 1 }),
          left_at: t.String({ minLength: 1 }),
          promoted_at: t.Nullable(t.String()),
          locations: t.Array(t.Object({ label: t.String({ minLength: 1 }), ordinal: t.Integer({ minimum: 0 }) })),
          bullets: t.Array(t.Object({ content: t.String({ minLength: 1 }), ordinal: t.Integer({ minimum: 0 }) }))
        })
      }
    );
  }
}
