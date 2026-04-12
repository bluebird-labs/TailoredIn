import type { SkillCategoryRepository } from '@tailoredin/domain';
import type { SkillCategoryDto } from '../../dtos/SkillCategoryDto.js';
import { toSkillCategoryDto } from '../../dtos/SkillCategoryDto.js';

export class ListSkillCategories {
  public constructor(private readonly skillCategoryRepository: SkillCategoryRepository) {}

  public async execute(): Promise<SkillCategoryDto[]> {
    const categories = await this.skillCategoryRepository.findAll();
    return categories.map(toSkillCategoryDto);
  }
}
