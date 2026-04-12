import type { SkillCategoryRepository, SkillRepository } from '@tailoredin/domain';
import type { SkillDto } from '../../dtos/SkillDto.js';
import { toSkillDto } from '../../dtos/SkillDto.js';

export type SearchSkillsInput = {
  query: string;
  limit?: number;
};

export class SearchSkills {
  public constructor(
    private readonly skillRepository: SkillRepository,
    private readonly skillCategoryRepository: SkillCategoryRepository
  ) {}

  public async execute(input: SearchSkillsInput): Promise<SkillDto[]> {
    const limit = input.limit ?? 20;
    const skills = await this.skillRepository.search(input.query, limit);

    const categoryIds = [...new Set(skills.map(s => s.categoryId).filter(Boolean))] as string[];
    const categories = await Promise.all(categoryIds.map(id => this.skillCategoryRepository.findByIdOrFail(id)));
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    return skills.map(skill => toSkillDto(skill, skill.categoryId ? categoryMap.get(skill.categoryId) : null));
  }
}
