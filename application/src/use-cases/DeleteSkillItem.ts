import { err, ok, type Result, type SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';

export type DeleteSkillItemInput = {
  itemId: string;
};

export class DeleteSkillItem {
  public constructor(private readonly skillCategoryRepository: SkillCategoryRepository) {}

  public async execute(input: DeleteSkillItemInput): Promise<Result<void, Error>> {
    let category: SkillCategory;
    try {
      category = await this.skillCategoryRepository.findByItemIdOrFail(input.itemId);
    } catch {
      return err(new Error(`Skill item not found: ${input.itemId}`));
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
