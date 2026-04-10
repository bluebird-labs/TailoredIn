import { EntityNotFoundError, err, type JobDescriptionRepository, ok, type Result } from '@tailoredin/domain';

export type DeleteJobDescriptionInput = {
  jobDescriptionId: string;
};

export class DeleteJobDescription {
  public constructor(private readonly jobDescriptionRepository: JobDescriptionRepository) {}

  public async execute(input: DeleteJobDescriptionInput): Promise<Result<void, Error>> {
    try {
      await this.jobDescriptionRepository.delete(input.jobDescriptionId);
      return ok(undefined);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }
  }
}
