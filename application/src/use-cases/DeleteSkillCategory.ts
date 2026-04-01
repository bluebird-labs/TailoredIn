import { err, ok, type Result, type SkillCategoryRepository } from '@tailoredin/domain';

export type DeleteSkillCategoryInput = { categoryId: string };

export class DeleteSkillCategory {
  public constructor(private readonly skillCategoryRepository: SkillCategoryRepository) {}

  public async execute(input: DeleteSkillCategoryInput): Promise<Result<void, Error>> {
    try {
      await this.skillCategoryRepository.findByIdOrFail(input.categoryId);
    } catch {
      return err(new Error(`Skill category not found: ${input.categoryId}`));
    }
    await this.skillCategoryRepository.delete(input.categoryId);
    return ok(undefined);
  }
}
