import type { ResumeHeadlineRepository } from '@tailoredin/domain';
import type { ResumeHeadlineDto } from '../dtos/ResumeDataDto.js';

export type ListHeadlinesInput = {
  userId: string;
};

export class ListHeadlines {
  public constructor(private readonly headlineRepository: ResumeHeadlineRepository) {}

  public async execute(input: ListHeadlinesInput): Promise<ResumeHeadlineDto[]> {
    const headlines = await this.headlineRepository.findAllByUserId(input.userId);

    return headlines.map(h => ({
      id: h.id.value,
      headlineLabel: h.headlineLabel,
      summaryText: h.summaryText
    }));
  }
}
