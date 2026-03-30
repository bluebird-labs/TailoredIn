import { ResumeHeadline, type ResumeHeadlineRepository } from '@tailoredin/domain';
import type { ResumeHeadlineDto } from '../dtos/ResumeDataDto.js';

export type CreateHeadlineInput = {
  userId: string;
  headlineLabel: string;
  summaryText: string;
};

export class CreateHeadline {
  public constructor(private readonly headlineRepository: ResumeHeadlineRepository) {}

  public async execute(input: CreateHeadlineInput): Promise<ResumeHeadlineDto> {
    const headline = ResumeHeadline.create({
      userId: input.userId,
      headlineLabel: input.headlineLabel,
      summaryText: input.summaryText
    });

    await this.headlineRepository.save(headline);

    return {
      id: headline.id.value,
      headlineLabel: headline.headlineLabel,
      summaryText: headline.summaryText
    };
  }
}
