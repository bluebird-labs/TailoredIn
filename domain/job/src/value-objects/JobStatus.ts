export enum JobStatus {
  NEW = 'new',
  LATER = 'later',

  APPLIED = 'applied',
  RECRUITER_SCREEN = 'recruiter_screen',
  TECHNICAL_SCREEN = 'technical_screen',
  HM_SCREEN = 'hm_screen',
  ON_SITE = 'on_site',
  OFFER = 'offer',
  REJECTED = 'rejected',
  NO_NEWS = 'no_news',

  UNFIT = 'unfit',
  EXPIRED = 'expired',
  LOW_SALARY = 'low_salary',
  RETIRED = 'retired',
  DUPLICATE = 'duplicate',
  HIGH_APPLICANTS = 'high_applicants',
  LOCATION_UNFIT = 'location_unfit',
  POSTED_TOO_LONG_AGO = 'posted_too_long_ago'
}

export const IN_PROCESS_JOB_STATUSES = new Set([
  JobStatus.APPLIED,
  JobStatus.RECRUITER_SCREEN,
  JobStatus.TECHNICAL_SCREEN,
  JobStatus.ON_SITE,
  JobStatus.OFFER,
  JobStatus.HM_SCREEN
]);

export const DISCARDED_JOB_STATUSES = new Set([
  JobStatus.REJECTED,
  JobStatus.EXPIRED,
  JobStatus.RETIRED,
  JobStatus.DUPLICATE,
  JobStatus.LOW_SALARY,
  JobStatus.UNFIT,
  JobStatus.NO_NEWS,
  JobStatus.HIGH_APPLICANTS,
  JobStatus.LOCATION_UNFIT,
  JobStatus.POSTED_TOO_LONG_AGO
]);
