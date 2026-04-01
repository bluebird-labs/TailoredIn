import { err, type HeadlineRepository, ok, type Result } from '@tailoredin/domain';

export type DeleteHeadlineInput = {
  headlineId: string;
};

export class DeleteHeadline {
  public constructor(private readonly headlineRepository: HeadlineRepository) {}

  public async execute(input: DeleteHeadlineInput): Promise<Result<void, Error>> {
    try {
      await this.headlineRepository.delete(input.headlineId);
    } catch {
      return err(new Error(`Headline not found: ${input.headlineId}`));
    }

    return ok(undefined);
  }
}
