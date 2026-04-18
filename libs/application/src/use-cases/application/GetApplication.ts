import { Inject, Injectable } from '@nestjs/common';
import type { ApplicationRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { ApplicationDto } from '../../dtos/ApplicationDto.js';
import { toApplicationDto } from '../../dtos/ApplicationDto.js';

export type GetApplicationInput = {
  applicationId: string;
};

@Injectable()
export class GetApplication {
  public constructor(
    @Inject(DI.Application.Repository) private readonly applicationRepository: ApplicationRepository
  ) {}

  public async execute(input: GetApplicationInput): Promise<ApplicationDto> {
    const application = await this.applicationRepository.findById(input.applicationId);
    if (!application) {
      throw new Error(`Application not found: ${input.applicationId}`);
    }
    return toApplicationDto(application);
  }
}
