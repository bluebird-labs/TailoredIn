import type { Headline, HeadlineRepository } from '@tailoredin/domain';
import type { HeadlineDto } from '../../dtos/HeadlineDto.js';

function toHeadlineDto(headline: Headline): HeadlineDto {
  return {
    id: headline.id.value,
    label: headline.label,
    summaryText: headline.summaryText
  };
}

export class ListHeadlines {
  public constructor(private readonly headlineRepository: HeadlineRepository) {}

  public async execute(): Promise<HeadlineDto[]> {
    const headlines = await this.headlineRepository.findAll();
    return headlines.map(toHeadlineDto);
  }
}
