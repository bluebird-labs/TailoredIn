import { err, ok, type Result, type ResumeHeadline, type ResumeHeadlineRepository } from '@tailoredin/domain';
import type { ResumeHeadlineDto } from '../dtos/ResumeDataDto.js';

export type UpdateHeadlineInput = {
  headlineId: string;
  headlineLabel: string;
  summaryText: string;
};

export class UpdateHeadline {
  public constructor(private readonly headlineRepository: ResumeHeadlineRepository) {}

  public async execute(input: UpdateHeadlineInput): Promise<Result<ResumeHeadlineDto, Error>> {
    let headline: ResumeHeadline;
    try {
      headline = await this.headlineRepository.findByIdOrFail(input.headlineId);
    } catch {
      return err(new Error(`Headline not found: ${input.headlineId}`));
    }

    headline.headlineLabel = input.headlineLabel;
    headline.summaryText = input.summaryText;
    headline.updatedAt = new Date();

    await this.headlineRepository.save(headline);

    return ok({
      id: headline.id.value,
      headlineLabel: headline.headlineLabel,
      summaryText: headline.summaryText
    });
  }
}
