import { EntityProps } from './src/orm/helpers';
import { Job as JobEntity } from './src/orm/entities/jobs/Job';

export type Job = EntityProps<JobEntity>;
