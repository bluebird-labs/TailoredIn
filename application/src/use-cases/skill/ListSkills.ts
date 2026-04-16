import type { SkillCategoryRepository, SkillRepository } from '@tailoredin/domain';
import type { SkillDto } from '../../dtos/SkillDto.js';
import { toSkillDto } from '../../dtos/SkillDto.js';

export class ListSkills {
  public constructor(
    private readonly skillRepository: SkillRepository,
    private readonly skillCategoryRepository: SkillCategoryRepository
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
