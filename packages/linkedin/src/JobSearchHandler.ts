import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { Company, Job, JobStatus, type QueryOpts, type TransientCompany, type TransientJob } from '@tailoredin/db';
import * as DateParser from 'any-date-parser';
import * as NpmLog from 'npmlog';
import { LinkedInDI } from './DI.js';
import { LinkedInUrls } from './LinkedInExplorer.js';
import type { LinkedInSearchJobsCommandResult } from './LinkedInSearchJobsCommand.js';

@injectable()
export class JobSearchHandler {
  constructor(private readonly orm = inject(LinkedInDI.Orm)) {}

  public async ingestJobSearchResult(
    jobSearchResult: LinkedInSearchJobsCommandResult,
    opts: QueryOpts = {}
  ): Promise<{ job: Job; company: Company }> {
    const transientCompany = this.extractTransientCompany(jobSearchResult);
    const transientJob = this.extractTransientJob(jobSearchResult);
    const em = opts.em ?? this.orm.em;

    return em.transactional(async em => {
      const company = await em.getRepository(Company).resolve(transientCompany);
      const job = await em.getRepository(Job).resolve(transientJob, company);

      await em.flush();

      return { job, company };
    });
  }

  private extractTransientCompany(jobSearchResult: LinkedInSearchJobsCommandResult): TransientCompany {
    return Company.createTransient({
      name: jobSearchResult.companyName,
      website: jobSearchResult.companyWebsite,
      linkedinLink: jobSearchResult.companyLink,
      logoUrl: jobSearchResult.companyLogoUrl
    });
  }

  private extractTransientJob(jobSearchResult: LinkedInSearchJobsCommandResult): TransientJob {
    const salary = this.parseSalary(jobSearchResult.salary);
    const posted = this.parsePosted(jobSearchResult.posted);
    const applicantsCount = this.parseApplicants(jobSearchResult.applicants);

    return Job.createTransient({
      status: JobStatus.NEW,
      applyLink: jobSearchResult.applyLink,
      linkedinId: jobSearchResult.jobId,
      linkedinLink: this.makeLinkedinLink(jobSearchResult.jobId),
      title: jobSearchResult.jobTitle,
      type: jobSearchResult.jobType?.toLowerCase() ?? null,
      level: jobSearchResult.jobLevel,
      remote: jobSearchResult.remote?.toLowerCase() ?? null,
      locationRaw: jobSearchResult.location,
      postedAt: posted.at,
      isRepost: posted.isRepost,
      salaryLow: salary.low,
      salaryHigh: salary.high,
      salaryRaw: jobSearchResult.salary,
      description: jobSearchResult.description,
      descriptionHtml: jobSearchResult.description_html,
      applicantsCount: applicantsCount
    });
  }

  private parsePosted(posted: string | null): { at: Date | null; isRepost: boolean | null } {
    if (!posted) {
      return { at: null, isRepost: null };
    }

    const isRepost = posted.startsWith('Reposted');

    if (isRepost) {
      posted = posted.replace('Reposted', '').trim();
    }

    const parsed: { year: number; month: number; day: number } = DateParser.attempt(posted);

    const at = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));

    return { at, isRepost };
  }

  private makeLinkedinLink(linkedinId: string): string {
    const url = new URL(LinkedInUrls.BASE);
    url.pathname = LinkedInUrls.JOB_VIEW + '/' + linkedinId;
    return url.href;
  }

  private parseSalary(salary: string | null): { low: number | null; high: number | null } {
    if (!salary) {
      return { low: null, high: null };
    }

    const reg = /\$([0-9]+)(?:\.[0-9]+)?K\/yr/;

    const parsePart = (part: string): number | null => {
      let result: number | null = null;

      const match = part.match(reg);

      if (match) {
        const ksStr = match.at(1);

        if (ksStr) {
          result = parseInt(ksStr, 10) * 1000;

          if (isNaN(result)) {
            result = null;
          }
        }
      }

      if (result === null) {
        NpmLog.warn(this.constructor.name, `Unhandled salary format: ${salary}`);
      }

      return result;
    };

    if (salary.startsWith('Starting at')) {
      // Starting at $130K/yr
      salary = salary.replace('Starting at', '').trim();

      return { low: parsePart(salary), high: null };
    } else if (salary.includes('-')) {
      // $170K/yr - $230K/yr
      const parts = salary.split('-').map(x => x.trim());

      if (parts.length !== 2) {
        NpmLog.warn(this.constructor.name, `Unhandled salary format: ${salary}`);

        return { low: null, high: null };
      }

      return { low: parsePart(parts[0]), high: parsePart(parts[1]) };
    } else {
      // $150K/yr
      const amount = parsePart(salary.trim());
      return { low: amount, high: amount };
    }
  }

  private parseApplicants(applicants: string | null) {
    if (applicants === null) {
      return null;
    }

    const numMatch = applicants.match(/.*([0-9]+).*/);

    if (numMatch === null) {
      return null;
    }

    return parseInt(numMatch[1], 10);
  }
}
