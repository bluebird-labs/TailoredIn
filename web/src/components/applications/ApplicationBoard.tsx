import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { useMemo, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import type { Application } from '@/hooks/use-applications';
import { useUpdateApplicationStatus } from '@/hooks/use-applications';
import type { Company } from '@/hooks/use-companies';
import type { JobDescription } from '@/hooks/use-job-descriptions';
import { ApplicationCard } from './ApplicationCard';
import { BoardColumn } from './BoardColumn';
import { StatusReasonDialog } from './StatusReasonDialog';

const ACTIVE_STATUSES = [
  { status: 'draft', label: 'Draft' },
  { status: 'applied', label: 'Applied' },
  { status: 'screening', label: 'Screening' },
  { status: 'interviewing', label: 'Interviewing' },
  { status: 'offered', label: 'Offered' }
];

const TERMINAL_STATUSES = [
  { status: 'accepted', label: 'Accepted' },
  { status: 'rejected', label: 'Rejected' },
  { status: 'withdrawn', label: 'Withdrawn' },
  { status: 'archived', label: 'Archived' }
];

interface ApplicationBoardProps {
  applications: Application[];
  companies: Company[];
  jobDescriptions: JobDescription[];
}

export function ApplicationBoard({ applications, companies, jobDescriptions }: ApplicationBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingReasonAction, setPendingReasonAction] = useState<{
    applicationId: string;
    status: 'archived' | 'withdrawn';
  } | null>(null);
  const updateStatus = useUpdateApplicationStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const companiesById = useMemo(() => new Map(companies.map(c => [c.id, c])), [companies]);
  const jobDescriptionsById = useMemo(() => new Map(jobDescriptions.map(jd => [jd.id, jd])), [jobDescriptions]);
  const applicationsByStatus = useMemo(() => {
    const map = new Map<string, Application[]>();
    for (const app of applications) {
      const list = map.get(app.status) ?? [];
      list.push(app);
      map.set(app.status, list);
    }
    return map;
  }, [applications]);

  const activeApplication = activeId ? applications.find(a => a.id === activeId) : undefined;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);

    const { active, over } = event;
    if (!over) return;

    const applicationId = active.id as string;
    const targetStatus = over.id as string;
    const currentStatus = (active.data.current as { status: string } | undefined)?.status;

    if (targetStatus === currentStatus) return;

    if (targetStatus === 'archived' || targetStatus === 'withdrawn') {
      setPendingReasonAction({ applicationId, status: targetStatus });
      return;
    }

    updateStatus.mutate({ id: applicationId, status: targetStatus });
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ACTIVE_STATUSES.map(col => (
          <BoardColumn
            key={col.status}
            status={col.status}
            label={col.label}
            applications={applicationsByStatus.get(col.status) ?? []}
            companiesById={companiesById}
            jobDescriptionsById={jobDescriptionsById}
          />
        ))}

        <Separator orientation="vertical" className="mx-1 h-auto self-stretch" />

        {TERMINAL_STATUSES.map(col => (
          <BoardColumn
            key={col.status}
            status={col.status}
            label={col.label}
            applications={applicationsByStatus.get(col.status) ?? []}
            companiesById={companiesById}
            jobDescriptionsById={jobDescriptionsById}
            isTerminal
          />
        ))}
      </div>

      <DragOverlay>
        {activeApplication ? (
          <ApplicationCard
            application={activeApplication}
            company={companiesById.get(activeApplication.companyId)}
            jobDescription={
              activeApplication.jobDescriptionId
                ? jobDescriptionsById.get(activeApplication.jobDescriptionId)
                : undefined
            }
            isDragOverlay
          />
        ) : null}
      </DragOverlay>

      <StatusReasonDialog
        open={pendingReasonAction !== null}
        onOpenChange={open => {
          if (!open) setPendingReasonAction(null);
        }}
        status={pendingReasonAction?.status ?? 'archived'}
        isPending={updateStatus.isPending}
        onConfirm={reason => {
          if (!pendingReasonAction) return;
          const { applicationId, status } = pendingReasonAction;
          updateStatus.mutate(
            {
              id: applicationId,
              status,
              ...(status === 'archived' ? { archiveReason: reason } : { withdrawReason: reason })
            },
            { onSettled: () => setPendingReasonAction(null) }
          );
        }}
      />
    </DndContext>
  );
}
