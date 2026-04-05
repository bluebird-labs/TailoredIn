import { EntityNotFoundError, err, type Headline, type HeadlineRepository, ok, type Result } from '@tailoredin/domain';
import type { HeadlineDto } from '../../dtos/HeadlineDto.js';

export type UpdateHeadlineInput = {
  headlineId: string;
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

export class UpdateHeadline {
  public constructor(private readonly headlineRepository: HeadlineRepository) {}

  public async execute(input: UpdateHeadlineInput): Promise<Result<HeadlineDto, Error>> {
    let headline: Headline;
    try {
      headline = await this.headlineRepository.findByIdOrFail(input.headlineId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }

    headline.label = input.label;
    headline.summaryText = input.summaryText;
    headline.updatedAt = new Date();

    await this.headlineRepository.save(headline);

    return ok(toHeadlineDto(headline));
  }
}
