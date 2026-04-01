import type { Headline, HeadlineRepository, Tag } from '@tailoredin/domain';
import type { HeadlineDto } from '../../dtos/HeadlineDto.js';

function toHeadlineDto(headline: Headline): HeadlineDto {
  return {
    id: headline.id.value,
    label: headline.label,
    summaryText: headline.summaryText,
    roleTags: headline.roleTags.map((tag: Tag) => ({
      id: tag.id.value,
      name: tag.name,
      dimension: tag.dimension
    }))
  };
}

export class ListHeadlines2 {
  public constructor(private readonly headlineRepository: HeadlineRepository) {}

  public async execute(): Promise<HeadlineDto[]> {
    const headlines = await this.headlineRepository.findAll();
    return headlines.map(toHeadlineDto);
  }
}
