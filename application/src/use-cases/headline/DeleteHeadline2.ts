import { err, type HeadlineRepository, ok, type Result } from '@tailoredin/domain';

export type DeleteHeadline2Input = {
  headlineId: string;
};

export class DeleteHeadline2 {
  public constructor(private readonly headlineRepository: HeadlineRepository) {}

  public async execute(input: DeleteHeadline2Input): Promise<Result<void, Error>> {
    try {
      await this.headlineRepository.delete(input.headlineId);
    } catch {
      return err(new Error(`Headline not found: ${input.headlineId}`));
    }

    return ok(undefined);
  }
}
