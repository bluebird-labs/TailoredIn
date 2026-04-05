import { type EducationRepository, EntityNotFoundError, err, ok, type Result } from '@tailoredin/domain';

export type DeleteEducationInput = {
  educationId: string;
};

export class DeleteEducation {
  public constructor(private readonly educationRepository: EducationRepository) {}

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
