import { err, ok, type Result, type SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';
import type { SkillItemDto } from '../dtos/SkillCategoryDto.js';

export type AddSkillItemInput = {
  categoryId: string;
  name: string;
  ordinal: number;
};

export class AddSkillItem {
  public constructor(private readonly skillCategoryRepository: SkillCategoryRepository) {}

  public async execute(input: AddSkillItemInput): Promise<Result<SkillItemDto, Error>> {
    let category: SkillCategory;
    try {
      category = await this.skillCategoryRepository.findByIdOrFail(input.categoryId);
    } catch {
      return err(new Error(`Skill category not found: ${input.categoryId}`));
    }

    const item = category.addItem({ name: input.name, ordinal: input.ordinal });
    await this.skillCategoryRepository.save(category);

    return ok({ id: item.id.value, name: item.name, ordinal: item.ordinal });
  }
}
