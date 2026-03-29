import { isBefore, sub } from 'date-fns';
import type { Company } from '../entities/Company.js';
import type { JobPosting } from '../entities/JobPosting.js';
import { JobStatus } from '../value-objects/JobStatus.js';

type ParsedLocation = {
  city: string | null;
  state: string | null;
  country: string;
};

/**
 * Domain service that decides the initial status of a newly scraped job.
 * All election rules live here and must stay pure — no I/O, no side effects.
 */
export class JobElectionService {
  elect(job: JobPosting, company: Company): JobStatus {
    if (!job.isNew()) {
      return job.status;
    }

    if (company.ignored) {
      return JobStatus.RETIRED;
    }

    if (job.postedAt !== null && isBefore(job.postedAt, sub(new Date(), { days: 2 }))) {
      return JobStatus.POSTED_TOO_LONG_AGO;
    }

    if (!job.isRemote()) {
      const location = this.parseLocation(job.locationRaw);

      if (location.country !== 'US') {
        return JobStatus.LOCATION_UNFIT;
      }

      if (location.state !== null) {
        if (location.state !== 'NY') {
          return JobStatus.LOCATION_UNFIT;
        }
      } else if (location.city !== null && !/New York|NY|NYC/gi.test(location.city)) {
        return JobStatus.LOCATION_UNFIT;
      }
    }

    if (job.hasMoreApplicantsThan(80)) {
      return JobStatus.HIGH_APPLICANTS;
    }

    if (!job.isWithinSalaryRange(200000, 215000)) {
      return JobStatus.LOW_SALARY;
    }

    return JobStatus.NEW;
  }

  private parseLocation(rawLocation: string): ParsedLocation {
    const parts = rawLocation.split(',').map(part => part.trim());

    let city: string | null = null;
    let state: string | null = null;
    let country: string;

    if (/Area/g.test(rawLocation) && parts.length < 3) {
      if (parts.length === 2) {
        [city, state] = parts;
        country = 'US';
      } else {
        city = parts[0];
        country = 'US';
      }
    } else {
      if (parts.length === 3) {
        [city, state, country] = parts;
      } else if (parts.length === 2) {
        if (parts[1].length === 2) {
          [city, state] = parts;
          country = 'US';
        } else {
          [state, country] = parts;
        }
      } else {
        country = parts[0];
      }
    }

    return { city, state, country: country! };
  }
}
