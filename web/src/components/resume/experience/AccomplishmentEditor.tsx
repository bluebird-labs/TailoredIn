import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.js';
import { EditableField } from '@/components/shared/EditableField.js';
import { SaveBar } from '@/components/shared/SaveBar.js';
import { Button } from '@/components/ui/button';
import { useDeleteAccomplishment, useUpdateAccomplishment } from '@/hooks/use-accomplishments';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import {
  type AccomplishmentFormState,
  hasErrors,
  type ValidationErrors,
  validateAccomplishment
} from '@/lib/validation.js';

interface Props {
  readonly experienceId: string;
  readonly accomplishment: { id: string; title: string; narrative: string; ordinal: number };
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly onMoveUp?: () => void;
  readonly onMoveDown?: () => void;
  readonly onDirtyChange: (id: string, isDirty: boolean) => void;
}

export function AccomplishmentEditor({
  experienceId,
  accomplishment,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDirtyChange
}: Props) {
  const update = useUpdateAccomplishment(experienceId);
  const del = useDeleteAccomplishment(experienceId);
  const [errors, setErrors] = useState<ValidationErrors<AccomplishmentFormState>>({});

  const savedState = useMemo(
    () => ({ title: accomplishment.title, narrative: accomplishment.narrative }),
    [accomplishment.title, accomplishment.narrative]
  );

  const { current, setField, isDirtyField, isDirty, dirtyCount, reset } = useDirtyTracking(savedState);

  useEffect(() => {
    onDirtyChange(`acc-${accomplishment.id}`, isDirty);
  }, [accomplishment.id, isDirty, onDirtyChange]);

  function handleSave() {
    const validationErrors = validateAccomplishment(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    update.mutate(
      {
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

  return (
    <div className="border rounded-lg p-3 space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-0.5 shrink-0 pt-5">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            disabled={isFirst}
            onClick={onMoveUp}
            aria-label="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            disabled={isLast}
            onClick={onMoveDown}
            aria-label="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 space-y-3">
          <EditableField
            type="text"
            label="Title"
            required
            value={current.title}
            onChange={v => setField('title', v)}
            isDirty={isDirtyField('title')}
            error={errors.title}
            disabled={update.isPending}
            placeholder="Accomplishment title"
          />
          <EditableField
            type="textarea"
            label="Narrative"
            value={current.narrative}
            onChange={v => setField('narrative', v)}
            isDirty={isDirtyField('narrative')}
            rows={3}
            disabled={update.isPending}
            placeholder="Describe what you did, why, and the outcome in detail..."
          />
        </div>
        <ConfirmDialog
          title="Delete accomplishment?"
          description="This accomplishment will be permanently removed."
          onConfirm={() => del.mutate(accomplishment.id)}
          trigger={
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0">
              <Trash2 className="h-3 w-3" />
            </Button>
          }
        />
      </div>
      <SaveBar dirtyCount={dirtyCount} onSave={handleSave} onDiscard={reset} isSaving={update.isPending} />
    </div>
  );
}
