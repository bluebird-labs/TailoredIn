import { ResumeSkillCategory, type ResumeSkillCategoryRepository } from '@tailoredin/domain';
import type { ResumeSkillCategoryDto } from '../dtos/ResumeDataDto.js';

export type CreateSkillCategoryInput = {
  userId: string;
  categoryName: string;
  ordinal: number;
  items?: { skillName: string; ordinal: number }[];
};

export class CreateSkillCategory {
  public constructor(private readonly skillCategoryRepository: ResumeSkillCategoryRepository) {}

  public async execute(input: CreateSkillCategoryInput): Promise<ResumeSkillCategoryDto> {
    const category = ResumeSkillCategory.create({
      userId: input.userId,
      categoryName: input.categoryName,
      ordinal: input.ordinal,
      items: []
    });
    for (const item of input.items ?? []) {
      category.addItem({ skillName: item.skillName, ordinal: item.ordinal });
    }
    await this.skillCategoryRepository.save(category);
    return {
      id: category.id.value,
      categoryName: category.categoryName,
      ordinal: category.ordinal,
      items: category.items.map(i => ({ id: i.id.value, skillName: i.skillName, ordinal: i.ordinal }))
    };
  }
}
