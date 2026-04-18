import { Inject, Injectable } from '@nestjs/common';
import { Application, type ApplicationRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { ApplicationDto } from '../../dtos/ApplicationDto.js';
import { toApplicationDto } from '../../dtos/ApplicationDto.js';

export type CreateApplicationInput = {
  profileId: string;
  companyId: string;
  jobDescriptionId?: string | null;
  notes?: string | null;
};

@Injectable()
export class CreateApplication {
  public constructor(
    @Inject(DI.Application.Repository) private readonly applicationRepository: ApplicationRepository
  ) {}

  public async execute(input: CreateApplicationInput): Promise<ApplicationDto> {
    const application = Application.create({
      profileId: input.profileId,
      companyId: input.companyId,
      jobDescriptionId: input.jobDescriptionId,
      notes: input.notes
    });
    await this.applicationRepository.save(application);
    return toApplicationDto(application);
  }
}
