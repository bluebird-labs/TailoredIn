import {
  err,
  type Headline,
  type HeadlineRepository,
  ok,
  type Result,
  type Tag,
  type TagRepository
} from '@tailoredin/domain';
import type { HeadlineDto } from '../../dtos/HeadlineDto.js';

export type UpdateHeadlineInput = {
  headlineId: string;
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

export class UpdateHeadline {
  public constructor(
    private readonly headlineRepository: HeadlineRepository,
    private readonly tagRepository: TagRepository
  ) {}

  public async execute(input: UpdateHeadlineInput): Promise<Result<HeadlineDto, Error>> {
    let headline: Headline;
    try {
      headline = await this.headlineRepository.findByIdOrFail(input.headlineId);
    } catch {
      return err(new Error(`Headline not found: ${input.headlineId}`));
    }

    const roleTags = await Promise.all(input.roleTagIds.map(id => this.tagRepository.findByIdOrFail(id)));

    headline.label = input.label;
    headline.summaryText = input.summaryText;
    headline.roleTags = roleTags;
    headline.updatedAt = new Date();

    await this.headlineRepository.save(headline);

    return ok(toHeadlineDto(headline));
  }
}
