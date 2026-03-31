import { JobStatus } from '@tailoredin/api/client';
import type { LucideIcon } from 'lucide-react';
import { Archive, Briefcase, GitBranch, Inbox } from 'lucide-react';

export type JobView = 'triage' | 'pipeline' | 'archive' | 'all';

type JobViewConfig = {
  label: string;
  icon: LucideIcon;
  statuses: JobStatus[] | undefined;
  defaultSort: 'score' | 'posted_at';
  statusOptions: { value: string; label: string }[];
};

const TRIAGE_STATUSES = [JobStatus.NEW, JobStatus.LATER];

const PIPELINE_STATUSES = [
  JobStatus.APPLIED,
  JobStatus.RECRUITER_SCREEN,
  JobStatus.TECHNICAL_SCREEN,
  JobStatus.HM_SCREEN,
  JobStatus.ON_SITE,
  JobStatus.OFFER
];

const ARCHIVE_STATUSES = [
  JobStatus.REJECTED,
  JobStatus.NO_NEWS,
  JobStatus.UNFIT,
  JobStatus.EXPIRED,
  JobStatus.LOW_SALARY,
  JobStatus.RETIRED,
  JobStatus.DUPLICATE,
  JobStatus.HIGH_APPLICANTS,
  JobStatus.LOCATION_UNFIT,
  JobStatus.POSTED_TOO_LONG_AGO
];

const STATUS_LABELS: Record<JobStatus, string> = {
  [JobStatus.NEW]: 'New',
  [JobStatus.LATER]: 'Later',
  [JobStatus.APPLIED]: 'Applied',
  [JobStatus.RECRUITER_SCREEN]: 'Recruiter Screen',
  [JobStatus.TECHNICAL_SCREEN]: 'Technical Screen',
  [JobStatus.HM_SCREEN]: 'HM Screen',
  [JobStatus.ON_SITE]: 'On-site',
  [JobStatus.OFFER]: 'Offer',
  [JobStatus.REJECTED]: 'Rejected',
  [JobStatus.NO_NEWS]: 'No News',
  [JobStatus.UNFIT]: 'Unfit',
  [JobStatus.EXPIRED]: 'Expired',
  [JobStatus.LOW_SALARY]: 'Low Salary',
  [JobStatus.RETIRED]: 'Retired',
  [JobStatus.DUPLICATE]: 'Duplicate',
  [JobStatus.HIGH_APPLICANTS]: 'High Applicants',
  [JobStatus.LOCATION_UNFIT]: 'Location Unfit',
  [JobStatus.POSTED_TOO_LONG_AGO]: 'Posted Too Long Ago'
};

function toOptions(statuses: JobStatus[]): { value: string; label: string }[] {
  return statuses.map(s => ({ value: s, label: STATUS_LABELS[s] }));
}

export const JOB_VIEW_CONFIG: Record<JobView, JobViewConfig> = {
  triage: {
    label: 'Triage',
    icon: Inbox,
    statuses: TRIAGE_STATUSES,
    defaultSort: 'score',
    statusOptions: toOptions(TRIAGE_STATUSES)
  },
  pipeline: {
    label: 'Pipeline',
    icon: GitBranch,
    statuses: PIPELINE_STATUSES,
    defaultSort: 'posted_at',
    statusOptions: toOptions(PIPELINE_STATUSES)
  },
  archive: {
    label: 'Archive',
    icon: Archive,
    statuses: ARCHIVE_STATUSES,
    defaultSort: 'posted_at',
    statusOptions: toOptions(ARCHIVE_STATUSES)
  },
  all: {
    label: 'All Jobs',
    icon: Briefcase,
    statuses: undefined,
    defaultSort: 'posted_at',
    statusOptions: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))
  }
};

export const JOB_VIEWS = Object.keys(JOB_VIEW_CONFIG) as JobView[];

export function isDiscardedStatus(status: JobStatus): boolean {
  return ARCHIVE_STATUSES.includes(status);
}

export function getViewStatuses(view: JobView, subStatus?: string): JobStatus[] | undefined {
  const config = JOB_VIEW_CONFIG[view];
  if (subStatus && subStatus !== 'all') {
    return [subStatus as JobStatus];
  }
  return config.statuses;
}
