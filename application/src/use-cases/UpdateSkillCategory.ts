import { err, ok, type Result, type SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';

export type UpdateSkillCategoryInput = {
  categoryId: string;
  name?: string;
  ordinal?: number;
};

export class UpdateSkillCategory {
  public constructor(private readonly skillCategoryRepository: SkillCategoryRepository) {}

  public async execute(input: UpdateSkillCategoryInput): Promise<Result<void, Error>> {
    let category: SkillCategory;
    try {
      category = await this.skillCategoryRepository.findByIdOrFail(input.categoryId);
    } catch {
      return err(new Error(`Skill category not found: ${input.categoryId}`));
    }

    if (input.name !== undefined) category.name = input.name;
    if (input.ordinal !== undefined) category.ordinal = input.ordinal;
    category.updatedAt = new Date();

    await this.skillCategoryRepository.save(category);
    return ok(undefined);
  }
}
