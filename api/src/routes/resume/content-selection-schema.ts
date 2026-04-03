import type { ContentSelectionDto } from '@tailoredin/application';
import { t } from 'elysia';

export const contentSelectionSchema = t.Object({
  experience_selections: t.Array(
    t.Object({
      experience_id: t.String({ format: 'uuid' }),
      accomplishment_ids: t.Array(t.String({ format: 'uuid' }))
    })
  ),
  project_ids: t.Array(t.String({ format: 'uuid' })),
  education_ids: t.Array(t.String({ format: 'uuid' })),
  skill_category_ids: t.Array(t.String({ format: 'uuid' })),
  skill_item_ids: t.Array(t.String({ format: 'uuid' }))
});

export function bodyToContentSelectionDto(body: {
  experience_selections: Array<{ experience_id: string; accomplishment_ids: string[] }>;
  project_ids: string[];
  education_ids: string[];
  skill_category_ids: string[];
  skill_item_ids: string[];
}): ContentSelectionDto {
  return {
    experienceSelections: body.experience_selections.map(s => ({
      experienceId: s.experience_id,
      accomplishmentIds: s.accomplishment_ids
    })),
    projectIds: body.project_ids,
    educationIds: body.education_ids,
    skillCategoryIds: body.skill_category_ids,
    skillItemIds: body.skill_item_ids
  };
}
