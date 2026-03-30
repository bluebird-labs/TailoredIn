import { err, ok, type Result, type ResumeEducationRepository } from '@tailoredin/domain';

export type DeleteEducationInput = {
  educationId: string;
};

export class DeleteEducation {
  public constructor(private readonly educationRepository: ResumeEducationRepository) {}

  public async execute(input: DeleteEducationInput): Promise<Result<void, Error>> {
    try {
      await this.educationRepository.delete(input.educationId);
    } catch {
      return err(new Error(`Education entry not found: ${input.educationId}`));
    }

    return ok(undefined);
  }
}
