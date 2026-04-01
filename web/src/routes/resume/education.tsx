import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { EducationCard } from '@/components/resume/education/education-card';
import { EducationFormDialog } from '@/components/resume/education/education-form-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { type Education, useEducations } from '@/hooks/use-education';

export const Route = createFileRoute('/resume/education')({
  component: EducationPage
});

function EducationPage() {
  const { data, isLoading } = useEducations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Education | undefined>();

  const entries = ([...(data ?? [])] as Education[]).sort((a, b) => a.ordinal - b.ordinal);
  const nextOrdinal = entries.length > 0 ? Math.max(...entries.map(e => e.ordinal)) + 1 : 0;

  function handleAdd() {
    setEditingEntry(undefined);
    setDialogOpen(true);
  }

  function handleEdit(entry: Education) {
    setEditingEntry(entry);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Education</h1>
          <p className="text-muted-foreground mt-1">Degrees and certifications.</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="size-4" data-icon="inline-start" />
          Add Entry
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && entries.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-muted-foreground">No education entries yet.</p>
          <p className="text-sm text-muted-foreground">Add your first degree or certification.</p>
        </div>
      )}

      {!isLoading && entries.length > 0 && (
        <div className="flex flex-col gap-4">
          {entries.map(entry => (
            <EducationCard key={entry.id} education={entry} onEdit={() => handleEdit(entry)} />
          ))}
        </div>
      )}

      <EducationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        education={editingEntry}
        nextOrdinal={nextOrdinal}
      />
    </div>
  );
}
