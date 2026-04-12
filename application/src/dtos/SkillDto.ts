import type { Skill, SkillCategory, SkillType } from '@tailoredin/domain';
import type { SkillCategoryDto } from './SkillCategoryDto.js';
import { toSkillCategoryDto } from './SkillCategoryDto.js';

export type SkillDto = {
  readonly id: string;
  readonly label: string;
  readonly type: SkillType;
  readonly categoryId: string | null;
  readonly category: SkillCategoryDto | null;
  readonly description: string | null;
};

export function toSkillDto(skill: Skill, category?: SkillCategory | null): SkillDto {
  return {
    id: skill.id,
    label: skill.label,
    type: skill.type,
    categoryId: skill.categoryId,
    category: category ? toSkillCategoryDto(category) : null,
    description: skill.description
  };
}
