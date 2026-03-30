import { err, ok, type Result, type ResumeSkillCategory, type ResumeSkillCategoryRepository } from '@tailoredin/domain';

export type DeleteSkillItemInput = {
  categoryId: string;
  itemId: string;
};

export class DeleteSkillItem {
  public constructor(private readonly skillCategoryRepository: ResumeSkillCategoryRepository) {}

  public async execute(input: DeleteSkillItemInput): Promise<Result<void, Error>> {
    let category: ResumeSkillCategory;
    try {
      category = await this.skillCategoryRepository.findByIdOrFail(input.categoryId);
    } catch {
      return err(new Error(`Skill category not found: ${input.categoryId}`));
    }

    try {
      category.removeItem(input.itemId);
    } catch (e) {
      return err(e as Error);
    }

    await this.skillCategoryRepository.save(category);
    return ok(undefined);
  }
}
