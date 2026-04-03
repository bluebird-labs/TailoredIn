import type { ScrapeResultDto } from '../dtos/ScrapeResultDto.js';

export type FetchJobDetailsDelegate = () => Promise<{
  applyLink: string | null;
  companyWebsite: string | null;
}>;

export type ScrapeByUrlResult = {
  result: ScrapeResultDto;
  fetchDetails: FetchJobDetailsDelegate;
};

export interface JobScraper {
  connect(): Promise<void>;
  close(): Promise<void>;
  scrapeByUrl(url: string): Promise<ScrapeByUrlResult>;
}
