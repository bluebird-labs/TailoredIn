import { err, ok, type Result, type ResumeSkillCategory, type ResumeSkillCategoryRepository } from '@tailoredin/domain';
import type { ResumeSkillItemDto } from '../dtos/ResumeDataDto.js';

export type AddSkillItemInput = {
  categoryId: string;
  skillName: string;
  ordinal: number;
};

export class AddSkillItem {
  public constructor(private readonly skillCategoryRepository: ResumeSkillCategoryRepository) {}

  public async execute(input: AddSkillItemInput): Promise<Result<ResumeSkillItemDto, Error>> {
    let category: ResumeSkillCategory;
    try {
      category = await this.skillCategoryRepository.findByIdOrFail(input.categoryId);
    } catch {
      return err(new Error(`Skill category not found: ${input.categoryId}`));
    }

    const item = category.addItem({ skillName: input.skillName, ordinal: input.ordinal });
    await this.skillCategoryRepository.save(category);

    return ok({ id: item.id.value, skillName: item.skillName, ordinal: item.ordinal });
  }
}
