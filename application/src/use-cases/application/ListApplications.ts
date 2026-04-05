import type { ApplicationRepository } from '@tailoredin/domain';
import type { ApplicationDto } from '../../dtos/ApplicationDto.js';
import { toApplicationDto } from '../../dtos/ApplicationDto.js';

export type ListApplicationsInput = {
  profileId: string;
};

export class ListApplications {
  public constructor(private readonly applicationRepository: ApplicationRepository) {}

  public async execute(input: ListApplicationsInput): Promise<ApplicationDto[]> {
    const applications = await this.applicationRepository.findByProfileId(input.profileId);
    return applications.map(toApplicationDto);
  }
}
