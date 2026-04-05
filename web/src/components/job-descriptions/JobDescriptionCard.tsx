import { Link } from '@tanstack/react-router';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { JobDescription } from '@/hooks/use-job-descriptions';
import { formatEnumLabel } from './job-description-options.js';

interface JobDescriptionCardProps {
  readonly jobDescription: JobDescription;
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

export function JobDescriptionCard({ jobDescription }: JobDescriptionCardProps) {
  const levelLabel = formatEnumLabel('level', jobDescription.level);
  const locationTypeLabel = formatEnumLabel('locationType', jobDescription.locationType);
  const salary = formatSalary(jobDescription);

  return (
    <Link
      to="/job-descriptions/$jobDescriptionId"
      params={{ jobDescriptionId: jobDescription.id }}
      className="group block w-full text-left border rounded-[14px] p-4 transition-colors hover:bg-accent/40"
    >
      <div className="min-w-0">
        <p className="font-medium truncate">{jobDescription.title}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
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
