import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Application } from '@/hooks/use-applications';
import type { Company } from '@/hooks/use-companies';
import type { JobDescription } from '@/hooks/use-job-descriptions';
import { ApplicationCard } from './ApplicationCard';

interface BoardColumnProps {
  status: string;
  label: string;
  applications: Application[];
  companiesById: Map<string, Company>;
  jobDescriptionsById: Map<string, JobDescription>;
  isTerminal?: boolean;
}

export function BoardColumn({
  status,
  label,
  applications,
  companiesById,
  jobDescriptionsById,
  isTerminal
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex shrink-0 flex-col rounded-[14px] border bg-muted/30 ${
        isTerminal ? 'w-[220px] min-w-[220px] opacity-80' : 'w-[280px] min-w-[280px]'
      } ${isOver ? 'ring-2 ring-primary/20' : ''}`}
    >
      <div className="border-b p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{label}</span>
          <Badge variant="secondary" className="text-[11px]">
            {applications.length}
          </Badge>
        </div>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="flex flex-col gap-2">
          {applications.length === 0 ? (
            <div className="rounded-[14px] border border-dashed p-4 text-center text-xs text-muted-foreground">
              Drop here
            </div>
          ) : (
            applications.map(app => (
              <ApplicationCard
                key={app.id}
                application={app}
                company={companiesById.get(app.companyId)}
                jobDescription={app.jobDescriptionId ? jobDescriptionsById.get(app.jobDescriptionId) : undefined}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
