import type { ResumeSkillCategory, ResumeSkillCategoryRepository } from '@tailoredin/domain';
import type { ResumeSkillCategoryDto } from '../dtos/ResumeDataDto.js';

export type ListSkillCategoriesInput = { userId: string };

export class ListSkillCategories {
  public constructor(private readonly skillCategoryRepository: ResumeSkillCategoryRepository) {}

  public async execute(input: ListSkillCategoriesInput): Promise<ResumeSkillCategoryDto[]> {
    const categories = await this.skillCategoryRepository.findAllByUserId(input.userId);
    return categories.map(toCategoryDto);
  }
}

function toCategoryDto(category: ResumeSkillCategory): ResumeSkillCategoryDto {
  return {
    id: category.id.value,
    categoryName: category.categoryName,
    ordinal: category.ordinal,
    items: category.items.map(i => ({ id: i.id.value, skillName: i.skillName, ordinal: i.ordinal }))
  };
}
