import { useDraggable } from '@dnd-kit/core';
import type { Application } from '@/hooks/use-applications';
import type { Company } from '@/hooks/use-companies';
import type { JobDescription } from '@/hooks/use-job-descriptions';

interface ApplicationCardProps {
  application: Application;
  company: Company | undefined;
  jobDescription: JobDescription | undefined;
  isDragOverlay?: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ApplicationCard({ application, company, jobDescription, isDragOverlay }: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: application.id,
    data: { status: application.status }
  });

  const title = jobDescription?.title ?? 'Untitled application';
  const companyName = company?.name ?? 'Unknown company';
  const initial = companyName.charAt(0).toUpperCase();

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      {...(!isDragOverlay ? { ...listeners, ...attributes } : {})}
      className={`rounded-[14px] border bg-card p-3 transition-colors ${
        isDragOverlay ? 'rotate-[3deg] scale-[1.02] shadow-lg' : 'cursor-grab hover:bg-accent/40 active:cursor-grabbing'
      } ${isDragging ? 'opacity-30' : ''}`}
    >
      <p className="truncate text-sm font-medium">{title}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-accent text-[9px] font-medium">
          {initial}
        </div>
        <span className="truncate text-xs text-muted-foreground">{companyName}</span>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{formatDate(application.appliedAt)}</p>
      {(application.archiveReason || application.withdrawReason) && (
        <p className="mt-1 truncate text-xs italic text-muted-foreground/70">
          {application.archiveReason ?? application.withdrawReason}
        </p>
      )}
    </div>
  );
}
