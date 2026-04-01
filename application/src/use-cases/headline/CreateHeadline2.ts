import { Headline, type HeadlineRepository, type Tag, type TagRepository } from '@tailoredin/domain';
import type { HeadlineDto } from '../../dtos/HeadlineDto.js';

export type CreateHeadline2Input = {
  profileId: string;
  label: string;
  summaryText: string;
  roleTagIds: string[];
};

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

export class CreateHeadline2 {
  public constructor(
    private readonly headlineRepository: HeadlineRepository,
    private readonly tagRepository: TagRepository
  ) {}

  public async execute(input: CreateHeadline2Input): Promise<HeadlineDto> {
    const roleTags = await Promise.all(input.roleTagIds.map(id => this.tagRepository.findByIdOrFail(id)));

    const headline = Headline.create({
      profileId: input.profileId,
      label: input.label,
      summaryText: input.summaryText,
      roleTags
    });

    await this.headlineRepository.save(headline);

    return toHeadlineDto(headline);
  }
}
