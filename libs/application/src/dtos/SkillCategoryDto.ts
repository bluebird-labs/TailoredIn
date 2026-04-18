import type { SkillCategory } from '@tailoredin/domain';

export type SkillCategoryDto = {
  readonly id: string;
  readonly label: string;
  readonly parentId: string | null;
};

export function toSkillCategoryDto(category: SkillCategory): SkillCategoryDto {
  return {
    id: category.id,
    label: category.label,
    parentId: category.parentId
  };
}
