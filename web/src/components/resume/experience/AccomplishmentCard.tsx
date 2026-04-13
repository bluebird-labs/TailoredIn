import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { type CSSProperties, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.js';
import { EditableField } from '@/components/shared/EditableField.js';
import { EditableSection } from '@/components/shared/EditableSection.js';
import { Button } from '@/components/ui/button';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import { type AccomplishmentDto, useDeleteAccomplishment, useUpdateAccomplishment } from '@/hooks/use-experiences';
import {
  type AccomplishmentFormState,
  hasErrors,
  type ValidationErrors,
  validateAccomplishment
} from '@/lib/validation.js';

interface AccomplishmentCardProps {
  readonly experienceId: string;
  readonly accomplishment: AccomplishmentDto;
  readonly index: number;
  readonly dragHandleProps?: Record<string, unknown>;
}

function AccomplishmentCard({ experienceId, accomplishment, index, dragHandleProps }: AccomplishmentCardProps) {
  const updateMutation = useUpdateAccomplishment();
  const deleteMutation = useDeleteAccomplishment();
  const [errors, setErrors] = useState<ValidationErrors<AccomplishmentFormState>>({});

  const savedState: AccomplishmentFormState = useMemo(
    () => ({
      title: accomplishment.title,
      narrative: accomplishment.narrative
    }),
    [accomplishment.title, accomplishment.narrative]
  );

  const { current, setField, isDirtyField, isDirty, reset } = useDirtyTracking(savedState);

  function handleSave() {
    const validationErrors = validateAccomplishment(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    updateMutation.mutate(
      {
        experienceId,
        accomplishmentId: accomplishment.id,
        title: current.title.trim(),
        narrative: current.narrative.trim()
      },
      {
        onSuccess: () => {
          setErrors({});
          toast.success('Changes saved');
        },
        onError: () => toast.error('Failed to save. Please try again.')
      }
    );
  }

  function handleDelete() {
    deleteMutation.mutate(
      { experienceId, accomplishmentId: accomplishment.id },
      {
        onSuccess: () => toast.success('Accomplishment deleted'),
        onError: () => toast.error('Failed to delete. Please try again.')
      }
    );
  }

  return (
    <EditableSection
      variant="card"
      sectionId={`accomplishment-${accomplishment.id}`}
      onSave={handleSave}
      onDiscard={reset}
      isDirty={isDirty}
      isSaving={updateMutation.isPending}
    >
      <EditableSection.Display>
        <div className="flex items-start gap-2">
          {dragHandleProps && (
            <button
              type="button"
              {...dragHandleProps}
              className="mt-1 cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
              onClick={e => e.stopPropagation()}
              onKeyDown={e => e.stopPropagation()}
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <span className="mt-0.5 text-[12px] text-muted-foreground">#{index + 1}</span>
          <div className="flex-1">
            <h3 className="text-[15px] font-medium">{accomplishment.title}</h3>
            {accomplishment.narrative && (
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{accomplishment.narrative}</p>
            )}
          </div>
        </div>
      </EditableSection.Display>
      <EditableSection.Editor>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-3">
              <EditableField
                type="text"
                label="Title"
                required
                value={current.title}
                onChange={v => setField('title', v)}
                isDirty={isDirtyField('title')}
                error={errors.title}
                disabled={updateMutation.isPending}
              />
              <EditableField
                type="textarea"
                label="Narrative"
                value={current.narrative}
                onChange={v => setField('narrative', v)}
                isDirty={isDirtyField('narrative')}
                disabled={updateMutation.isPending}
                rows={4}
              />
            </div>
            <ConfirmDialog
              title="Delete accomplishment?"
              description="This accomplishment will be permanently removed."
              onConfirm={handleDelete}
              trigger={
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0">
                  <Trash2 className="h-3 w-3" />
                </Button>
              }
            />
          </div>
        </div>
      </EditableSection.Editor>
    </EditableSection>
  );
}

interface SortableAccomplishmentCardProps {
  readonly experienceId: string;
  readonly accomplishment: AccomplishmentDto;
  readonly index: number;
}

function SortableAccomplishmentCard({ experienceId, accomplishment, index }: SortableAccomplishmentCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: accomplishment.id
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    position: 'relative',
    zIndex: isDragging ? 1 : undefined
  };

  return (
    <div ref={setNodeRef} style={style}>
      <AccomplishmentCard
        experienceId={experienceId}
        accomplishment={accomplishment}
        index={index}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export { AccomplishmentCard, SortableAccomplishmentCard };
