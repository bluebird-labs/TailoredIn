import type { SkillCategory, SkillCategoryRepository } from '@tailoredin/domain';
import type { SkillCategoryDto } from '../dtos/SkillCategoryDto.js';

export class ListSkillCategories {
  public constructor(private readonly skillCategoryRepository: SkillCategoryRepository) {}

  public async execute(): Promise<SkillCategoryDto[]> {
    const categories = await this.skillCategoryRepository.findAll();
    return categories.map(toCategoryDto);
  }
}

function toCategoryDto(category: SkillCategory): SkillCategoryDto {
  return {
    id: category.id.value,
    name: category.name,
    ordinal: category.ordinal,
    items: category.items.map(i => ({ id: i.id.value, name: i.name, ordinal: i.ordinal }))
  };
}
