import { type EducationRepository, type Result, err, ok } from '@tailoredin/domain';

export type DeleteEducation2Input = {
  educationId: string;
};

export class DeleteEducation2 {
  public constructor(private readonly educationRepository: EducationRepository) {}

  public async execute(input: DeleteEducation2Input): Promise<Result<void, Error>> {
    try {
      await this.educationRepository.delete(input.educationId);
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
