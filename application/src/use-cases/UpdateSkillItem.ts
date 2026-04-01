import { err, ok, type Result, type SkillCategory, type SkillCategoryRepository } from '@tailoredin/domain';

export type UpdateSkillItemInput = {
  itemId: string;
  name?: string;
  ordinal?: number;
};

export class UpdateSkillItem {
  public constructor(private readonly skillCategoryRepository: SkillCategoryRepository) {}

  public async execute(input: UpdateSkillItemInput): Promise<Result<void, Error>> {
    let category: SkillCategory;
    try {
      category = await this.skillCategoryRepository.findByItemIdOrFail(input.itemId);
    } catch {
      return err(new Error(`Skill item not found: ${input.itemId}`));
    }

    try {
      category.updateItem(input.itemId, { name: input.name, ordinal: input.ordinal });
    } catch (e) {
      return err(e as Error);
    }

    await this.skillCategoryRepository.save(category);
    return ok(undefined);
  }
}
