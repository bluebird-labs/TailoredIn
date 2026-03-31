import type { JobSearchConfigDto } from '@tailoredin/application';

type JobSearcherConfig = {
  searches: Record<string, JobSearchConfigDto>;
  only?: (keyof JobSearcherConfig['searches'])[];
};

const past = 'week';

const config: JobSearcherConfig = {
  // only: ['senior_remote'],
  searches: {
    senior_remote: {
      keywords: 'senior engineer',
      remote: ['remote'],
      location: 'US',
      past: past,
      jobType: 'full-time'
    },
    senior_ny: {
      keywords: 'senior engineer',
      location: 'NY',
      past: past,
      jobType: 'full-time'
    },
    staff_remote: {
      keywords: 'staff engineer',
      remote: ['remote'],
      location: 'US',
      past: past,
      jobType: 'full-time'
    },
    staff_ny: {
      keywords: 'staff engineer',
      location: 'NY',
      past: past,
      jobType: 'full-time'
    }
  }
};

export default config;
