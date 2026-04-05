import { Building2, Link2, MapPin, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Experience } from '@/hooks/use-experiences';
import { useDeleteExperience } from '@/hooks/use-experiences';

function formatMonthYear(value: string): string {
  if (!value) return '';
  const [year, month] = value.split('-');
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

interface ExperienceCardProps {
  readonly experience: Experience;
  readonly onEdit: () => void;
}

export function ExperienceCard({ experience, onEdit }: ExperienceCardProps) {
  const deleteExperience = useDeleteExperience();

  const startFormatted = formatMonthYear(experience.startDate);
  const endFormatted = formatMonthYear(experience.endDate);
  const dateRange = startFormatted && endFormatted ? `${startFormatted} — ${endFormatted}` : '';

  return (
    // biome-ignore lint/a11y/useSemanticElements: cannot use <button> because it contains a nested <button> (delete trigger)
    <div
      role="button"
      tabIndex={0}
      className="group w-full text-left border rounded-[14px] p-4 cursor-pointer transition-colors hover:bg-accent/40"
      onClick={onEdit}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit();
        }
      }}
    >
      <div className="flex items-start gap-3">
        {experience.company?.logoUrl ? (
          <img
            src={experience.company.logoUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg border object-contain bg-white p-0.5"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : experience.company ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted text-sm font-medium text-muted-foreground">
            {experience.company.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted/50 text-muted-foreground/50">
            <Building2 className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-medium truncate">{experience.companyName}</p>
            {experience.company && <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground truncate">{experience.title}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            {experience.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {experience.location}
              </span>
            )}
            {dateRange && <span>{dateRange}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {experience.accomplishments.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {experience.accomplishments.length} accomplishment{experience.accomplishments.length !== 1 ? 's' : ''}
            </Badge>
          )}
          <ConfirmDialog
            title="Delete experience?"
            description="This experience and all its accomplishments will be permanently removed."
            onConfirm={() => deleteExperience.mutate(experience.id)}
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => e.stopPropagation()}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
