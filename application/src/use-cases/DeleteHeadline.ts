import { err, ok, type Result, type ResumeHeadlineRepository } from '@tailoredin/domain';

export type DeleteHeadlineInput = {
  headlineId: string;
};

export class DeleteHeadline {
  public constructor(private readonly headlineRepository: ResumeHeadlineRepository) {}

  public async execute(input: DeleteHeadlineInput): Promise<Result<void, Error>> {
    try {
      await this.headlineRepository.delete(input.headlineId);
    } catch {
      return err(new Error(`Headline not found: ${input.headlineId}`));
    }

    return ok(undefined);
  }
}
