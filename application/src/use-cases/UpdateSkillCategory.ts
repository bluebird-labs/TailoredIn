import { err, ok, type Result, type ResumeSkillCategory, type ResumeSkillCategoryRepository } from '@tailoredin/domain';

export type UpdateSkillCategoryInput = {
  categoryId: string;
  categoryName?: string;
  ordinal?: number;
};

export class UpdateSkillCategory {
  public constructor(private readonly skillCategoryRepository: ResumeSkillCategoryRepository) {}

  public async execute(input: UpdateSkillCategoryInput): Promise<Result<void, Error>> {
    let category: ResumeSkillCategory;
    try {
      category = await this.skillCategoryRepository.findByIdOrFail(input.categoryId);
    } catch {
      return err(new Error(`Skill category not found: ${input.categoryId}`));
    }

    if (input.categoryName !== undefined) category.categoryName = input.categoryName;
    if (input.ordinal !== undefined) category.ordinal = input.ordinal;
    category.updatedAt = new Date();

    await this.skillCategoryRepository.save(category);
    return ok(undefined);
  }
}
