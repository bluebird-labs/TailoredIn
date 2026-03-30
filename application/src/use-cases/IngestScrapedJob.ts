import { Logger } from '@tailoredin/core';
import {
  type Company,
  type CompanyRepository,
  type JobElector,
  type JobPosting,
  type JobRepository,
  JobStatus
} from '@tailoredin/domain';
import * as DateParser from 'any-date-parser';
import type { ScrapeResultDto } from '../dtos/ScrapeResultDto.js';

export type IngestScrapedJobResult = {
  job: JobPosting;
  company: Company;
};

export class IngestScrapedJob {
  private static readonly JOB_VIEW_BASE = 'https://www.linkedin.com/jobs/view';
  private readonly log = Logger.create(IngestScrapedJob.name);

  public constructor(
    private readonly jobRepository: JobRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly jobElector: JobElector
  ) {}

  public async execute(scrapeResult: ScrapeResultDto): Promise<IngestScrapedJobResult> {
    const companyProps = {
      name: scrapeResult.companyName,
      website: scrapeResult.companyWebsite,
      linkedinLink: scrapeResult.companyLink,
      logoUrl: scrapeResult.companyLogoUrl
    };

    const company = await this.companyRepository.upsertByLinkedinLink(companyProps);

    const salary = this.parseSalary(scrapeResult.salary);
    const posted = this.parsePosted(scrapeResult.posted);
    const applicantsCount = this.parseApplicants(scrapeResult.applicants);

    const jobProps = {
      status: JobStatus.NEW,
      applyLink: scrapeResult.applyLink,
      linkedinId: scrapeResult.jobId,
      linkedinLink: `${IngestScrapedJob.JOB_VIEW_BASE}/${scrapeResult.jobId}`,
      title: scrapeResult.jobTitle,
      type: scrapeResult.jobType?.toLowerCase() ?? null,
      level: scrapeResult.jobLevel,
      remote: scrapeResult.remote?.toLowerCase() ?? null,
      locationRaw: scrapeResult.location,
      postedAt: posted.at,
      isRepost: posted.isRepost,
      salaryLow: salary.low,
      salaryHigh: salary.high,
      salaryRaw: scrapeResult.salary,
      description: scrapeResult.description,
      descriptionHtml: scrapeResult.descriptionHtml,
      applicantsCount
    };

    const job = await this.jobRepository.upsertByLinkedinId(jobProps, company);
    const electedStatus = this.jobElector.elect(job, company);

    if (electedStatus !== job.status) {
      job.setInitialStatus(electedStatus);
      await this.jobRepository.save(job);
    }

    return { job, company };
  }

  private parsePosted(posted: string | null): { at: Date | null; isRepost: boolean | null } {
    if (!posted) return { at: null, isRepost: null };

    const isRepost = posted.startsWith('Reposted');
    const text = isRepost ? posted.replace('Reposted', '').trim() : posted;
    const parsed: { year: number; month: number; day: number } = DateParser.attempt(text);
    const at = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));

    return { at, isRepost };
  }

  private parseSalary(salary: string | null): { low: number | null; high: number | null } {
    if (!salary) return { low: null, high: null };

    const reg = /\$([0-9]+)(?:\.[0-9]+)?K\/yr/;

    const parsePart = (part: string): number | null => {
      const match = part.match(reg);
      if (!match) {
        this.log.warn(`Unhandled salary format: ${salary}`);
        return null;
      }
      const ksStr = match[1];
      const result = ksStr ? parseInt(ksStr, 10) * 1000 : null;
      if (result !== null && Number.isNaN(result)) return null;
      return result;
    };

    if (salary.startsWith('Starting at')) {
      return { low: parsePart(salary.replace('Starting at', '').trim()), high: null };
    }

    if (salary.includes('-')) {
      const parts = salary.split('-').map(x => x.trim());
      if (parts.length !== 2) {
        this.log.warn(`Unhandled salary format: ${salary}`);
        return { low: null, high: null };
      }
      return { low: parsePart(parts[0]), high: parsePart(parts[1]) };
    }

    const amount = parsePart(salary.trim());
    return { low: amount, high: amount };
  }

  private parseApplicants(applicants: string | null): number | null {
    if (!applicants) return null;
    const match = applicants.match(/.*([0-9]+).*/);
    if (!match) return null;
    return parseInt(match[1], 10);
  }
}
