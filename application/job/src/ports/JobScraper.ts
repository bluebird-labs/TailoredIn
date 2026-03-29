import type { JobSearchConfigDto } from '../dtos/JobSearchConfigDto.js';
import type { ScrapeResultDto } from '../dtos/ScrapeResultDto.js';

export type FetchJobDetailsDelegate = () => Promise<{
  applyLink: string | null;
  companyWebsite: string | null;
}>;

export type ScrapeResultCallback = (
  result: ScrapeResultDto,
  fetchDetails: FetchJobDetailsDelegate
) => Promise<void>;

export interface JobScraper {
  connect(): Promise<void>;
  close(): Promise<void>;
  search(config: JobSearchConfigDto, onResult: ScrapeResultCallback): Promise<void>;
}
