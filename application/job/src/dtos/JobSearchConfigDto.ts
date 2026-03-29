export type JobSearchConfigDto = {
  keywords: string;
  location: 'US' | 'NY';
  past?: 'month' | 'week' | 'day';
  twoHundredKOrHigher?: boolean;
  jobType?: 'full-time' | 'contract';
  remote?: ('remote' | 'on-site' | 'hybrid')[];
  maxPages?: number;
};
