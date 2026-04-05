import { EntityNotFoundError, err, type HeadlineRepository, ok, type Result } from '@tailoredin/domain';

export type DeleteHeadlineInput = {
  headlineId: string;
};

export class DeleteHeadline {
  public constructor(private readonly headlineRepository: HeadlineRepository) {}

  public async execute(input: DeleteHeadlineInput): Promise<Result<void, Error>> {
    try {
      await this.headlineRepository.delete(input.headlineId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }

    return ok(undefined);
  }
}
