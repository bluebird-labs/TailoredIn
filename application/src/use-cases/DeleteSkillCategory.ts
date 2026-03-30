import { err, ok, type Result, type ResumeSkillCategoryRepository } from '@tailoredin/domain';

export type DeleteSkillCategoryInput = { categoryId: string };

export class DeleteSkillCategory {
  public constructor(private readonly skillCategoryRepository: ResumeSkillCategoryRepository) {}

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
