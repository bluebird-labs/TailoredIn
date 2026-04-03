import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import type { GenerateResumeProfilePdf, GetResumeProfile, UpdateResumeProfile } from '@tailoredin/application';
import type { ResumeProfile } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';
import { getProfileId } from '../../helpers/profile-id.js';
import { bodyToContentSelectionDto, contentSelectionSchema } from './content-selection-schema.js';

function serializeResumeProfile(profile: ResumeProfile) {
  return {
    profileId: profile.profileId,
    contentSelection: profile.contentSelection,
    headlineText: profile.headlineText,
    updatedAt: profile.updatedAt
  };
}

@injectable()
export class ResumeProfileRoutes {
  public constructor(
    private readonly getResumeProfile: GetResumeProfile = inject(DI.ResumeProfile.Get),
    private readonly updateResumeProfile: UpdateResumeProfile = inject(DI.ResumeProfile.Update),
    private readonly generateResumeProfilePdf: GenerateResumeProfilePdf = inject(DI.ResumeProfile.GeneratePdf),
    private readonly orm: MikroORM = inject(MikroORM)
  ) {}

  public plugin() {
    return new Elysia()
      .get('/resume/profile', async ({ set }) => {
        const profileId = await getProfileId(this.orm);
        const resumeProfile = await this.getResumeProfile.execute({ profileId });
        if (!resumeProfile) {
          set.status = 404;
          return { data: null };
        }
        return { data: serializeResumeProfile(resumeProfile) };
      })
      .put(
        '/resume/profile',
        async ({ body }) => {
          const profileId = await getProfileId(this.orm);
          await this.updateResumeProfile.execute({
            profileId,
            contentSelection: bodyToContentSelectionDto(body.content_selection),
            headlineText: body.headline_text
          });
          const resumeProfile = await this.getResumeProfile.execute({ profileId });
          return { data: resumeProfile ? serializeResumeProfile(resumeProfile) : null };
        },
        {
          body: t.Object({
            content_selection: contentSelectionSchema,
            headline_text: t.String()
          })
        }
      )
      .post('/resume/profile/generate-pdf', async () => {
        const profileId = await getProfileId(this.orm);
        const result = await this.generateResumeProfilePdf.execute({ profileId });
        return { data: { pdfPath: result.pdfPath } };
      });
  }
}
