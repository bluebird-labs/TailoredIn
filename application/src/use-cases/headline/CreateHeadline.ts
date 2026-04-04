import { Headline, type HeadlineRepository } from '@tailoredin/domain';
import type { HeadlineDto } from '../../dtos/HeadlineDto.js';

export type CreateHeadlineInput = {
  profileId: string;
  label: string;
  summaryText: string;
};

function toHeadlineDto(headline: Headline): HeadlineDto {
  return {
    id: headline.id.value,
    label: headline.label,
    summaryText: headline.summaryText
  };
}

export class CreateHeadline {
  public constructor(private readonly headlineRepository: HeadlineRepository) {}

  public async execute(input: CreateHeadlineInput): Promise<HeadlineDto> {
    const headline = Headline.create({
      profileId: input.profileId,
      label: input.label,
      summaryText: input.summaryText
    });

    await this.headlineRepository.save(headline);

    return toHeadlineDto(headline);
  }
}
