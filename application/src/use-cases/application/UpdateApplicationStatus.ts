import { ApplicationId, type ApplicationRepository, type ApplicationStatus } from '@tailoredin/domain';
import type { ApplicationDto } from '../../dtos/ApplicationDto.js';
import { toApplicationDto } from '../../dtos/ApplicationDto.js';

export type UpdateApplicationStatusInput = {
  applicationId: string;
  status: ApplicationStatus;
};

export class UpdateApplicationStatus {
  public constructor(private readonly applicationRepository: ApplicationRepository) {}

  public async execute(input: UpdateApplicationStatusInput): Promise<ApplicationDto> {
    const application = await this.applicationRepository.findById(new ApplicationId(input.applicationId));
    if (!application) {
      throw new Error(`Application not found: ${input.applicationId}`);
    }

    application.setStatus(input.status);

    await this.applicationRepository.save(application);
    return toApplicationDto(application);
  }
}
