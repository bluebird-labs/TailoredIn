import { JobSearchParams } from './src/services/LinkedInScrapper';

export type JobSearcherConfig = {
  searches: Record<string, JobSearchParams>;
  only?: (keyof JobSearcherConfig['searches'])[];
};

const past = 'week';
// TODO: add lead software engineer

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
    // principal_remote: {
    //   keywords: 'principal engineer',
    //   remote: ['remote'],
    //   location: 'US',
    //   past: past,
    //   jobType: 'full-time'
    // },
    // principal_ny: {
    //   keywords: 'principal engineer',
    //   location: 'NY',
    //   past: past,
    //   jobType: 'full-time'
    // },
    // head_remote: {
    //   keywords: 'head of engineering',
    //   remote: ['remote'],
    //   location: 'US',
    //   past: past,
    //   jobType: 'full-time'
    // },
    // head_ny: {
    //   keywords: 'head of engineering',
    //   location: 'NY',
    //   past: past,
    //   jobType: 'full-time'
    // },
    // director_remote: {
    //   keywords: 'director of engineering',
    //   remote: ['remote'],
    //   location: 'US',
    //   past: past,
    //   jobType: 'full-time'
    // },
    // director_ny: {
    //   keywords: 'director of engineering',
    //   location: 'NY',
    //   past: past,
    //   jobType: 'full-time'
    // }
  }
};

export default config;
