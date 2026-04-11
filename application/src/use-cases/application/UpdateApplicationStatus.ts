import { type ApplicationRepository, ApplicationStatus, type ResumeContentRepository } from '@tailoredin/domain';
import type { ApplicationDto } from '../../dtos/ApplicationDto.js';
import { toApplicationDto } from '../../dtos/ApplicationDto.js';

export type UpdateApplicationStatusInput = {
  applicationId: string;
  status: ApplicationStatus;
  resumeContentId?: string;
  archiveReason?: string;
  withdrawReason?: string;
};

export class UpdateApplicationStatus {
  public constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly resumeContentRepository: ResumeContentRepository
  ) {}

  public async execute(input: UpdateApplicationStatusInput): Promise<ApplicationDto> {
    const application = await this.applicationRepository.findById(input.applicationId);
    if (!application) {
      throw new Error(`Application not found: ${input.applicationId}`);
    }

    if (input.status === ApplicationStatus.APPLIED) {
      if (!input.resumeContentId) {
        throw new Error('Resume content ID is required when applying');
      }
      const resumeContent = await this.resumeContentRepository.findById(input.resumeContentId);
      if (!resumeContent) {
        throw new Error(`Resume content not found: ${input.resumeContentId}`);
      }
      application.apply(input.resumeContentId);
    } else if (input.status === ApplicationStatus.ARCHIVED) {
      if (!input.archiveReason) {
        throw new Error('Archive reason is required when archiving an application');
      }
      application.archive(input.archiveReason);
    } else if (input.status === ApplicationStatus.WITHDRAWN) {
      if (!input.withdrawReason) {
        throw new Error('Withdraw reason is required when withdrawing an application');
      }
      application.withdraw(input.withdrawReason);
    } else {
      application.setStatus(input.status);
    }

    await this.applicationRepository.save(application);
    return toApplicationDto(application);
  }
}
