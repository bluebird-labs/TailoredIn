import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import type {
  ContentSelectionDto,
  GenerateResumeProfilePdf,
  GetResumeProfile,
  UpdateResumeProfile
} from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';
import { getProfileId } from '../../helpers/profile-id.js';

const contentSelectionSchema = t.Object({
  experience_selections: t.Array(
    t.Object({
      experience_id: t.String({ format: 'uuid' }),
      bullet_ids: t.Array(t.String({ format: 'uuid' }))
    })
  ),
  project_ids: t.Array(t.String({ format: 'uuid' })),
  education_ids: t.Array(t.String({ format: 'uuid' })),
  skill_category_ids: t.Array(t.String({ format: 'uuid' })),
  skill_item_ids: t.Array(t.String({ format: 'uuid' }))
});

function bodyToContentSelectionDto(body: {
  experience_selections: Array<{ experience_id: string; bullet_ids: string[] }>;
  project_ids: string[];
  education_ids: string[];
  skill_category_ids: string[];
  skill_item_ids: string[];
}): ContentSelectionDto {
  return {
    experienceSelections: body.experience_selections.map(s => ({
      experienceId: s.experience_id,
      bulletIds: s.bullet_ids
    })),
    projectIds: body.project_ids,
    educationIds: body.education_ids,
    skillCategoryIds: body.skill_category_ids,
    skillItemIds: body.skill_item_ids
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
      .get('/resume/profile', async () => {
        const profileId = await getProfileId(this.orm);
        const resumeProfile = await this.getResumeProfile.execute({ profileId });
        return { data: resumeProfile };
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
          return { data: resumeProfile };
        },
        {
          body: t.Object({
            content_selection: contentSelectionSchema,
            headline_text: t.String()
          })
        }
      )
      .post('/resume/profile/generate-pdf', async ({ set }) => {
        const profileId = await getProfileId(this.orm);
        const result = await this.generateResumeProfilePdf.execute({ profileId });
        set.status = 201;
        return { data: { pdfPath: result.pdfPath } };
      });
  }
}
