import { inject, injectable } from '@needle-di/core';
import { JobStatus } from '@tailoredin/domain-job';
import * as NpmLog from 'npmlog';
import { ApplicationJobDI } from '../DI.js';
import type { JobRepository } from '../ports/JobRepository.js';
import type { JobScraper } from '../ports/JobScraper.js';
import type { JobSearchConfigDto } from '../dtos/JobSearchConfigDto.js';
import { IngestScrapedJob } from './IngestScrapedJob.js';

@injectable()
export class ScrapeAndIngestJobs {
  private static readonly LOG_PREFIX = ScrapeAndIngestJobs.name;

  constructor(
    private readonly jobScraper = inject(ApplicationJobDI.JobScraper),
    private readonly jobRepository = inject(ApplicationJobDI.JobRepository),
    private readonly ingestScrapedJob = inject(ApplicationJobDI.IngestScrapedJob)
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
