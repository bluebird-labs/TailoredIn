import { err, ok, type Result, type ResumeSkillCategory, type ResumeSkillCategoryRepository } from '@tailoredin/domain';

export type UpdateSkillItemInput = {
  categoryId: string;
  itemId: string;
  skillName?: string;
  ordinal?: number;
};

export class UpdateSkillItem {
  public constructor(private readonly skillCategoryRepository: ResumeSkillCategoryRepository) {}

  public async execute(input: UpdateSkillItemInput): Promise<Result<void, Error>> {
    let category: ResumeSkillCategory;
    try {
      category = await this.skillCategoryRepository.findByIdOrFail(input.categoryId);
    } catch {
      return err(new Error(`Skill category not found: ${input.categoryId}`));
    }

    try {
      category.updateItem(input.itemId, { skillName: input.skillName, ordinal: input.ordinal });
    } catch (e) {
      return err(e as Error);
    }

    await this.skillCategoryRepository.save(category);
    return ok(undefined);
  }
}
