import { type EducationRepository, err, ok, type Result } from '@tailoredin/domain';

export type DeleteEducationInput = {
  educationId: string;
};

export class DeleteEducation {
  public constructor(private readonly educationRepository: EducationRepository) {}

  public async execute(input: DeleteEducationInput): Promise<Result<void, Error>> {
    try {
      await this.educationRepository.delete(input.educationId);
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
