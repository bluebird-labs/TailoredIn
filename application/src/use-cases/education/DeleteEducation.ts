import { Inject, Injectable } from '@nestjs/common';
import { type EducationRepository, EntityNotFoundError, err, ok, type Result } from '@tailoredin/domain';
import { DI } from '../../DI.js';

export type DeleteEducationInput = {
  educationId: string;
};

@Injectable()
export class DeleteEducation {
  public constructor(@Inject(DI.Education.Repository) private readonly educationRepository: EducationRepository) {}

  public async execute(input: DeleteEducationInput): Promise<Result<void, Error>> {
    try {
      await this.educationRepository.delete(input.educationId);
      return ok(undefined);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }
  }
}
