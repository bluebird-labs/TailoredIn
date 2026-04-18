import { Inject, Injectable } from '@nestjs/common';
import { EntityNotFoundError, err, type JobDescriptionRepository, ok, type Result } from '@tailoredin/domain';
import { DI } from '../../DI.js';

export type DeleteJobDescriptionInput = {
  jobDescriptionId: string;
};

@Injectable()
export class DeleteJobDescription {
  public constructor(
    @Inject(DI.JobDescription.Repository) private readonly jobDescriptionRepository: JobDescriptionRepository
  ) {}

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
