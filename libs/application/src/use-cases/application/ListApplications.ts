import { Inject, Injectable } from '@nestjs/common';
import type { ApplicationRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { ApplicationDto } from '../../dtos/ApplicationDto.js';
import { toApplicationDto } from '../../dtos/ApplicationDto.js';

export type ListApplicationsInput = {
  profileId: string;
};

@Injectable()
export class ListApplications {
  public constructor(
    @Inject(DI.Application.Repository) private readonly applicationRepository: ApplicationRepository
  ) {}

  public async execute(input: ListApplicationsInput): Promise<ApplicationDto[]> {
    const applications = await this.applicationRepository.findByProfileId(input.profileId);
    return applications.map(toApplicationDto);
  }
}
