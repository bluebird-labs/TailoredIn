import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { ExperienceFormDialog } from '@/components/resume/experience/experience-form-dialog';
import { ExperienceRow } from '@/components/resume/experience/experience-row';
import type { Experience } from '@/components/resume/experience/types';
import { invalidateExperiences } from '@/components/resume/experience/types';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useExperiences } from '@/hooks/use-experiences';
import { api } from '@/lib/api';

export const Route = createFileRoute('/resume/experience')({
  component: ExperiencePage
});

function ExperiencePage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useExperiences();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Experience | null>(null);

  const experiences = ((data ?? []) as Experience[]).sort((a, b) => b.startDate.localeCompare(a.startDate));

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.experiences({ id }).delete(),
    onSuccess: () => {
      invalidateExperiences(queryClient);
      setDeleteTarget(null);
      toast.success('Experience deleted');
    },
    onError: () => toast.error('Failed to delete experience')
  });

  function openAdd() {
    setEditingExperience(null);
    setDialogOpen(true);
  }

  function openEdit(exp: Experience) {
    setEditingExperience(exp);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
        <div>
          <h1 className="text-xl font-bold text-[#111]">Work Experience</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">Your career history — click any bullet to edit inline</p>
        </div>
        <button
          type="button"
          className="bg-[#111] text-white px-3.5 py-1.5 rounded-md text-[13px] font-medium cursor-pointer hover:bg-[#333]"
          onClick={openAdd}
        >
          + Add Experience
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && experiences.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-muted-foreground">No experiences yet.</p>
          <p className="text-sm text-muted-foreground">Add your first experience to get started.</p>
        </div>
      )}

      {/* Experience list */}
      {!isLoading &&
        experiences.map(exp => (
          <ExperienceRow
            key={exp.id}
            experience={exp}
            onEdit={() => openEdit(exp)}
            onDelete={() => setDeleteTarget(exp)}
          />
        ))}

      {/* Create / Edit Dialog */}
      <ExperienceFormDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open);
          if (!open) setEditingExperience(null);
        }}
        experience={editingExperience}
      />

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title="Delete Experience"
        description={`Are you sure you want to delete "${deleteTarget?.title}" at ${deleteTarget?.companyName}? This will also delete all bullets and variants.`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
