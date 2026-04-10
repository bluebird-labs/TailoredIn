import type { ApplicationRepository } from '@tailoredin/domain';
import type { ApplicationDto } from '../../dtos/ApplicationDto.js';
import { toApplicationDto } from '../../dtos/ApplicationDto.js';

export type GetApplicationInput = {
  applicationId: string;
};

export class GetApplication {
  public constructor(private readonly applicationRepository: ApplicationRepository) {}

  public async execute(input: GetApplicationInput): Promise<ApplicationDto> {
    const application = await this.applicationRepository.findById(input.applicationId);
    if (!application) {
      throw new Error(`Application not found: ${input.applicationId}`);
    }
    return toApplicationDto(application);
  }
}
