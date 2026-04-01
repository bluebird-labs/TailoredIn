import type { TagDimension, TagRepository } from '@tailoredin/domain';
import type { TagDto } from '../../dtos/TagDto.js';

export type ListTagsInput = {
  dimension?: string;
};

export class ListTags {
  public constructor(private readonly tagRepository: TagRepository) {}

  public async execute(input: ListTagsInput): Promise<TagDto[]> {
    const tags = input.dimension
      ? await this.tagRepository.findAllByDimension(input.dimension as TagDimension)
      : await this.tagRepository.findAll();

    return tags.map(tag => ({
      id: tag.id.value,
      name: tag.name,
      dimension: tag.dimension
    }));
  }
}
