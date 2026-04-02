import { readFileSync } from 'node:fs';
import { inject, injectable } from '@needle-di/core';
import type { GenerateResume } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class PreviewResumeRoute {
  public constructor(private readonly generateResume: GenerateResume = inject(DI.Resume.GenerateResume)) {}

  public plugin() {
    return new Elysia().post(
      '/resumes/preview',
      async ({ body, set }) => {
        const result = await this.generateResume.execute({
          headlineText: body.headline_text,
          experienceSelections: body.experience_selections.map(s => ({
            experienceId: s.experience_id,
            bulletVariantIds: s.bullet_variant_ids
          })),
          educationIds: body.education_ids,
          skillCategoryIds: body.skill_category_ids,
          skillItemIds: body.skill_item_ids,
          keywords: body.keywords
        });

        if (!result.isOk) {
          set.status = 400;
          return { error: { code: 'GENERATION_FAILED', message: result.error.message } };
        }

        const pdfBuffer = readFileSync(result.value.pdfPath);
        set.headers['content-type'] = 'application/pdf';
        set.headers['content-disposition'] = 'inline';
        return pdfBuffer;
      },
      {
        body: t.Object({
          headline_text: t.String(),
          experience_selections: t.Array(
            t.Object({
              experience_id: t.String({ format: 'uuid' }),
              bullet_variant_ids: t.Array(t.String({ format: 'uuid' }))
            })
          ),
          education_ids: t.Array(t.String({ format: 'uuid' })),
          skill_category_ids: t.Array(t.String({ format: 'uuid' })),
          skill_item_ids: t.Array(t.String({ format: 'uuid' })),
          keywords: t.Optional(t.Array(t.String()))
        })
      }
    );
  }
}
