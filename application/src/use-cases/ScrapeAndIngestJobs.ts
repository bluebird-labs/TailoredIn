import { Logger } from '@tailoredin/core/src/Logger.js';
import { type JobRepository, JobStatus } from '@tailoredin/domain';
import type { JobSearchConfigDto } from '../dtos/JobSearchConfigDto.js';
import type { JobScraper } from '../ports/JobScraper.js';
import type { IngestScrapedJob } from './IngestScrapedJob.js';

export class ScrapeAndIngestJobs {
  private readonly log = Logger.create(ScrapeAndIngestJobs.name);

  constructor(
    private readonly jobScraper: JobScraper,
    private readonly jobRepository: JobRepository,
    private readonly ingestScrapedJob: IngestScrapedJob
  ) {}

  async execute(configs: JobSearchConfigDto[]): Promise<void> {
    await this.jobScraper.connect();

    try {
      for (const config of configs) {
        this.log.info(`Searching for "${config.keywords}"...`);

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
            this.log.info(`Job added: ${job.title} at ${company.name}`);
          } else {
            this.log.warn(`Job rejected (${job.status}): ${job.title}`);
          }
        });

        this.log.info(`Done searching for "${config.keywords}".`);
      }
    } finally {
      await this.jobScraper.close();
    }
  }
}
