import type { SkillCategory } from '@tailoredin/domain';

export type SkillCategoryDto = {
  readonly id: string;
  readonly label: string;
};

export function toSkillCategoryDto(category: SkillCategory): SkillCategoryDto {
  return {
    id: category.id,
    label: category.label
  };
}
