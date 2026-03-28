import { injectable } from 'inversify';
import { JobStatus } from '../../orm/entities/jobs/JobStatus';
import { IJobElector } from './index';
import { Job } from '../../orm/entities/jobs/Job';
import { Company } from '../../orm/entities/companies/Company';
import { isBefore, sub } from 'date-fns';

type ParsedLocation = {
  city: string | null;
  state: string | null;
  country: string;
};

@injectable()
export class MyJobElector implements IJobElector {
  public async elect(job: Job, company: Company): Promise<JobStatus> {
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
      const parsedLocation = this.parseLocation(job.locationRaw);

      if (parsedLocation.country !== 'US') {
        return JobStatus.LOCATION_UNFIT;
      }

      if (parsedLocation.state !== null) {
        if (parsedLocation.state !== 'NY') {
          return JobStatus.LOCATION_UNFIT;
        }
      } else if (parsedLocation.city !== null && !/New York|NY|NYC/gi.test(parsedLocation.city)) {
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

    return { city, state, country };
  }
}
