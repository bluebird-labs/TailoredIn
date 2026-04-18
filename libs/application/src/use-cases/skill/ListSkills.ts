import { Inject, Injectable } from '@nestjs/common';
import type { SkillCategoryRepository, SkillRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { SkillDto } from '../../dtos/SkillDto.js';
import { toSkillDto } from '../../dtos/SkillDto.js';

@Injectable()
export class ListSkills {
  public constructor(
    @Inject(DI.Skill.Repository) private readonly skillRepository: SkillRepository,
    @Inject(DI.Skill.CategoryRepository) private readonly skillCategoryRepository: SkillCategoryRepository
  ) {}

  public async execute(): Promise<SkillDto[]> {
    const [skills, categories] = await Promise.all([
      this.skillRepository.findAll(),
      this.skillCategoryRepository.findAll()
    ]);
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    return skills.map(skill => toSkillDto(skill, skill.categoryId ? categoryMap.get(skill.categoryId) : null));
  }
}
