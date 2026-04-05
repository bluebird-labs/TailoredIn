import { ApplicationId, type ApplicationRepository } from '@tailoredin/domain';
import type { ApplicationDto } from '../../dtos/ApplicationDto.js';
import { toApplicationDto } from '../../dtos/ApplicationDto.js';

export type UpdateApplicationInput = {
  applicationId: string;
  jobDescriptionId?: string | null;
  notes?: string | null;
};

export class UpdateApplication {
  public constructor(private readonly applicationRepository: ApplicationRepository) {}

  public async execute(input: UpdateApplicationInput): Promise<ApplicationDto> {
    const application = await this.applicationRepository.findById(new ApplicationId(input.applicationId));
    if (!application) {
      throw new Error(`Application not found: ${input.applicationId}`);
    }

    if (input.jobDescriptionId !== undefined) {
      application.jobDescriptionId = input.jobDescriptionId;
    }
    if (input.notes !== undefined) {
      application.notes = input.notes;
    }
    application.updatedAt = new Date();

    await this.applicationRepository.save(application);
    return toApplicationDto(application);
  }
}
