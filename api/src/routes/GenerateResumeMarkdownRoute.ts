import { inject, injectable } from '@needle-di/core';
import type { GenerateResumeMarkdown } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class GenerateResumeMarkdownRoute {
  public constructor(
    private readonly generateResumeMarkdown: GenerateResumeMarkdown = inject(DI.Resume.GenerateResumeMarkdown)
  ) {}

  public plugin() {
    return new Elysia().post(
      '/resumes/generate-markdown',
      async ({ body, set }) => {
        const result = await this.generateResumeMarkdown.execute({
          headlineText: body.headline_text,
          experienceSelections: body.experience_selections.map(s => ({
            experienceId: s.experience_id,
            bulletIds: s.bullet_ids
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

        set.headers['content-type'] = 'text/markdown; charset=utf-8';
        set.headers['content-disposition'] = 'attachment; filename="resume.md"';
        return result.value.markdown;
      },
      {
        body: t.Object({
          headline_text: t.String(),
          experience_selections: t.Array(
            t.Object({
              experience_id: t.String({ format: 'uuid' }),
              bullet_ids: t.Array(t.String({ format: 'uuid' }))
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
