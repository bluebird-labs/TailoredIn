import { JobStatus } from '@tailoredin/domain';
import * as NpmLog from 'npmlog';
import type { JobSearchConfigDto } from '../dtos/JobSearchConfigDto.js';
import type { JobRepository } from '../ports/JobRepository.js';
import type { JobScraper } from '../ports/JobScraper.js';
import type { IngestScrapedJob } from './IngestScrapedJob.js';

export class ScrapeAndIngestJobs {
  private static readonly LOG_PREFIX = ScrapeAndIngestJobs.name;

  constructor(
    private readonly jobScraper: JobScraper,
    private readonly jobRepository: JobRepository,
    private readonly ingestScrapedJob: IngestScrapedJob
  ) {}

  async execute(configs: JobSearchConfigDto[]): Promise<void> {
    await this.jobScraper.connect();

    try {
      for (const config of configs) {
        NpmLog.notice(ScrapeAndIngestJobs.LOG_PREFIX, `Searching for "${config.keywords}"...`);

        await this.jobScraper.search(config, async (scrapeResult, fetchDetails) => {
          const { job, company } = await this.ingestScrapedJob.execute(scrapeResult);

          if (job.status === JobStatus.NEW) {
            const { applyLink, companyWebsite } = await fetchDetails();

            if (companyWebsite !== null) {
              company.setWebsite(companyWebsite);
              await this.jobRepository.save(job);
            }

            if (applyLink !== null) {
              job.setApplyLink(applyLink);
            }

            await this.jobRepository.save(job);
          }

          if (job.status === JobStatus.NEW) {
            NpmLog.info(ScrapeAndIngestJobs.LOG_PREFIX, `Job added: ${job.title} at ${company.name}`);
          } else {
            NpmLog.warn(ScrapeAndIngestJobs.LOG_PREFIX, `Job rejected (${job.status}): ${job.title}`);
          }
        });

        NpmLog.notice(ScrapeAndIngestJobs.LOG_PREFIX, `Done searching for "${config.keywords}".`);
      }
    } finally {
      await this.jobScraper.close();
    }
  }
}
