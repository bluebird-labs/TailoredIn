import { Inject, Injectable } from '@nestjs/common';
import type { SkillCategoryRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { SkillCategoryDto } from '../../dtos/SkillCategoryDto.js';
import { toSkillCategoryDto } from '../../dtos/SkillCategoryDto.js';

@Injectable()
export class ListSkillCategories {
  public constructor(
    @Inject(DI.Skill.CategoryRepository) private readonly skillCategoryRepository: SkillCategoryRepository
  ) {}

  public async execute(): Promise<SkillCategoryDto[]> {
    const categories = await this.skillCategoryRepository.findAll();
    return categories.map(toSkillCategoryDto);
  }
}
