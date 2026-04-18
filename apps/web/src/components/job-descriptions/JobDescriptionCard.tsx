import { Link } from '@tanstack/react-router';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { JobDescription } from '@/hooks/use-job-descriptions';
import { formatEnumLabel } from './job-description-options.js';

interface JobDescriptionCardProps {
  readonly jobDescription: JobDescription;
  readonly showCompany?: boolean;
}

function formatSalary(jd: JobDescription): string | null {
  if (!jd.salaryRange) return null;
  const { min, max, currency } = jd.salaryRange;
  if (!min && !max) return null;
  const fmt = (n: number) => n.toLocaleString();
  if (min && max) return `${currency} ${fmt(min)} – ${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  if (max) return `Up to ${currency} ${fmt(max)}`;
  return null;
}

function fitScoreBadgeClass(score: number): string {
  if (score >= 70)
    return 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400';
  if (score >= 40)
    return 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400';
  return 'border-red-300 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400';
}

export function JobDescriptionCard({ jobDescription, showCompany }: JobDescriptionCardProps) {
  const levelLabel = formatEnumLabel('level', jobDescription.level);
  const locationTypeLabel = formatEnumLabel('locationType', jobDescription.locationType);
  const salary = formatSalary(jobDescription);
  const companyInitial = jobDescription.companyName?.charAt(0).toUpperCase() ?? '';

  return (
    <Link
      to="/jobs/$jobDescriptionId"
      params={{ jobDescriptionId: jobDescription.id }}
      className="group block w-full text-left border rounded-[14px] p-4 transition-colors hover:bg-accent/40"
    >
      <div className="min-w-0">
        <p className="font-medium truncate">{jobDescription.title}</p>
        {showCompany && jobDescription.companyName && (
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-accent text-[10px] font-medium text-accent-foreground overflow-hidden">
              {jobDescription.companyLogoUrl ? (
                <img
                  src={jobDescription.companyLogoUrl}
                  alt={jobDescription.companyName}
                  className="h-full w-full rounded object-contain"
                />
              ) : (
                companyInitial
              )}
            </div>
            <span className="text-xs text-muted-foreground truncate">{jobDescription.companyName}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {jobDescription.fitScore && (
            <Badge variant="outline" className={fitScoreBadgeClass(jobDescription.fitScore.overall)}>
              Fit: {jobDescription.fitScore.overall}
            </Badge>
          )}
          {locationTypeLabel && <Badge variant="secondary">{locationTypeLabel}</Badge>}
          {levelLabel && <Badge variant="secondary">{levelLabel}</Badge>}
          {salary && <Badge variant="outline">{salary}</Badge>}
        </div>
        {jobDescription.location && (
          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{jobDescription.location}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
