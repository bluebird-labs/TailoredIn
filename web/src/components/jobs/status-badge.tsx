import { JobStatus } from '@tailoredin/domain/web';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  [JobStatus.NEW]: { label: 'New', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  [JobStatus.LATER]: {
    label: 'Later',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
  },
  [JobStatus.APPLIED]: {
    label: 'Applied',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  },
  [JobStatus.RECRUITER_SCREEN]: {
    label: 'Recruiter',
    className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
  },
  [JobStatus.TECHNICAL_SCREEN]: {
    label: 'Technical',
    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
  },
  [JobStatus.HM_SCREEN]: {
    label: 'HM Screen',
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
  },
  [JobStatus.ON_SITE]: {
    label: 'On-site',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
  },
  [JobStatus.OFFER]: {
    label: 'Offer',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  },
  [JobStatus.REJECTED]: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  },
  [JobStatus.NO_NEWS]: {
    label: 'No News',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400'
  },
  [JobStatus.UNFIT]: {
    label: 'Unfit',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400'
  },
  [JobStatus.EXPIRED]: {
    label: 'Expired',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400'
  },
  [JobStatus.LOW_SALARY]: {
    label: 'Low Salary',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  },
  [JobStatus.RETIRED]: {
    label: 'Retired',
    className: 'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-500'
  },
  [JobStatus.DUPLICATE]: {
    label: 'Duplicate',
    className: 'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-500'
  },
  [JobStatus.HIGH_APPLICANTS]: {
    label: 'High Applicants',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  },
  [JobStatus.LOCATION_UNFIT]: {
    label: 'Location Unfit',
    className: 'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-500'
  },
  [JobStatus.POSTED_TOO_LONG_AGO]: {
    label: 'Too Old',
    className: 'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-500'
  }
};

export function JobStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: '' };
  return (
    <Badge variant="outline" className={cn('border-transparent', config.className)}>
      {config.label}
    </Badge>
  );
}
