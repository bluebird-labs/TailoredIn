import { JobStatus } from '../../orm/entities/jobs/JobStatus';
import { Job } from '../../orm/entities/jobs/Job';
import { Company } from '../../orm/entities/companies/Company';

export interface IJobElector {
  elect(job: Job, company: Company): Promise<JobStatus>;
}
