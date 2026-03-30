import { Logger } from '@tailoredin/core';
import { type Company, type JobPosting, type JobRepository, JobStatus } from '@tailoredin/domain';
import type { IngestJobByUrlInput, ManualJobFieldsDto } from '../dtos/IngestJobByUrlDto.js';
import type { ScrapeResultDto } from '../dtos/ScrapeResultDto.js';
import type { JobScraper } from '../ports/JobScraper.js';
import type { IngestScrapedJob } from './IngestScrapedJob.js';

export class InvalidLinkedInUrlError extends Error {
  public constructor(url: string) {
    super(`URL must be a LinkedIn job posting (linkedin.com/jobs/view/...): ${url}`);
    this.name = 'InvalidLinkedInUrlError';
  }
}

export class ScrapeFailedError extends Error {
  public constructor(cause: unknown) {
    super("Could not scrape job posting. The page may have been removed or LinkedIn's layout may have changed.");
    this.name = 'ScrapeFailedError';
    this.cause = cause;
  }
}

export type IngestJobByUrlOutput = {
  job: JobPosting;
  company: Company;
};

const LINKEDIN_JOB_URL_PATTERN = /linkedin\.com\/jobs\/view\/\d+/;

export class IngestJobByUrl {
  private readonly log = Logger.create(IngestJobByUrl.name);

  public constructor(
    private readonly jobScraper: JobScraper,
    private readonly jobRepository: JobRepository,
    private readonly ingestScrapedJob: IngestScrapedJob
  ) {}

  public async execute(input: IngestJobByUrlInput): Promise<IngestJobByUrlOutput> {
    if (input.mode === 'manual') {
      return this.ingestManual(input.fields);
    }
    return this.ingestByUrl(input.url);
  }

  private async ingestByUrl(url: string): Promise<IngestJobByUrlOutput> {
    if (!LINKEDIN_JOB_URL_PATTERN.test(url)) {
      throw new InvalidLinkedInUrlError(url);
    }

    await this.jobScraper.connect();

    try {
      const { result, fetchDetails } = await this.jobScraper.scrapeByUrl(url).catch((err: unknown) => {
        throw new ScrapeFailedError(err);
      });

      this.log.info(`Scraped job: ${result.jobTitle} at ${result.companyName}`);

      const { job, company } = await this.ingestScrapedJob.execute(result);

      if (job.status === JobStatus.NEW) {
        const { applyLink, companyWebsite } = await fetchDetails();

        if (companyWebsite !== null) {
          company.setWebsite(companyWebsite);
        }

        if (applyLink !== null) {
          job.setApplyLink(applyLink);
        }

        await this.jobRepository.save(job);
      }

      if (job.status === JobStatus.NEW) {
        this.log.info(`Job imported: ${job.title} at ${company.name}`);
      } else {
        this.log.warn(`Job imported but auto-rejected (${job.status}): ${job.title}`);
      }

      return { job, company };
    } finally {
      await this.jobScraper.close();
    }
  }

  private async ingestManual(fields: ManualJobFieldsDto): Promise<IngestJobByUrlOutput> {
    const scrapeResult: ScrapeResultDto = {
      jobId: crypto.randomUUID(),
      jobTitle: fields.jobTitle,
      jobLink: '',
      applyLink: fields.applyLink ?? null,
      location: fields.location,
      salary: fields.salary ?? null,
      jobType: fields.jobType ?? null,
      remote: fields.remote ?? null,
      posted: fields.posted ?? null,
      jobLevel: fields.jobLevel ?? null,
      applicants: fields.applicants ?? null,
      description: fields.description,
      descriptionHtml: fields.descriptionHtml,
      companyName: fields.companyName,
      companyLogoUrl: fields.companyLogoUrl ?? '',
      companyLink: fields.companyLink,
      companyWebsite: fields.companyWebsite ?? null
    };

    this.log.info(`Manually importing job: ${fields.jobTitle} at ${fields.companyName}`);

    return this.ingestScrapedJob.execute(scrapeResult);
  }
}
