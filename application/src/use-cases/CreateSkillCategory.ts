import { SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';
import type { SkillCategoryDto } from '../dtos/SkillCategoryDto.js';

export type CreateSkillCategoryInput = {
  profileId: string;
  name: string;
  ordinal: number;
  items?: { name: string; ordinal: number }[];
};

export class CreateSkillCategory {
  public constructor(private readonly skillCategoryRepository: SkillCategoryRepository) {}

  public async execute(input: CreateSkillCategoryInput): Promise<SkillCategoryDto> {
    const category = SkillCategory.create({
      profileId: input.profileId,
      name: input.name,
      ordinal: input.ordinal
    });
    for (const item of input.items ?? []) {
      category.addItem({ name: item.name, ordinal: item.ordinal });
    }
    await this.skillCategoryRepository.save(category);
    return {
      id: category.id.value,
      name: category.name,
      ordinal: category.ordinal,
      items: category.items.map(i => ({ id: i.id.value, name: i.name, ordinal: i.ordinal }))
    };
  }
}
