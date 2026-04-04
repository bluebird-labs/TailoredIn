import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EditableField } from '@/components/shared/EditableField.js';
import { Button } from '@/components/ui/button';
import { useAddAccomplishment, useUpdateAccomplishment } from '@/hooks/use-accomplishments';
import type { AccomplishmentDto } from '@/hooks/use-experiences';
import {
  type AccomplishmentFormState,
  hasErrors,
  type ValidationErrors,
  validateAccomplishment
} from '@/lib/validation.js';
import { AccomplishmentEditor } from './AccomplishmentEditor.js';

interface Props {
  readonly experienceId: string;
  readonly accomplishments: AccomplishmentDto[];
  readonly onDirtyChange: (id: string, isDirty: boolean) => void;
}

export function AccomplishmentListEditor({ experienceId, accomplishments, onDirtyChange }: Props) {
  const updateAccomplishment = useUpdateAccomplishment(experienceId);

  function handleMoveUp(index: number) {
    const current = accomplishments[index];
    const above = accomplishments[index - 1];
    if (!current || !above) return;
    updateAccomplishment.mutate({ accomplishmentId: current.id, ordinal: above.ordinal });
    updateAccomplishment.mutate({ accomplishmentId: above.id, ordinal: current.ordinal });
  }

  function handleMoveDown(index: number) {
    const current = accomplishments[index];
    const below = accomplishments[index + 1];
    if (!current || !below) return;
    updateAccomplishment.mutate({ accomplishmentId: current.id, ordinal: below.ordinal });
    updateAccomplishment.mutate({ accomplishmentId: below.id, ordinal: current.ordinal });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Accomplishments</p>
      {accomplishments.map((acc, index) => (
        <AccomplishmentEditor
          key={acc.id}
          experienceId={experienceId}
          accomplishment={acc}
          isFirst={index === 0}
          isLast={index === accomplishments.length - 1}
          onMoveUp={() => handleMoveUp(index)}
          onMoveDown={() => handleMoveDown(index)}
          onDirtyChange={onDirtyChange}
        />
      ))}
      <AddAccomplishmentForm experienceId={experienceId} nextOrdinal={accomplishments.length} />
    </div>
  );
}

function AddAccomplishmentForm({
  experienceId,
  nextOrdinal
}: {
  readonly experienceId: string;
  readonly nextOrdinal: number;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [narrative, setNarrative] = useState('');
  const [errors, setErrors] = useState<ValidationErrors<AccomplishmentFormState>>({});
  const addAccomplishment = useAddAccomplishment(experienceId);

  function handleSave() {
    const validationErrors = validateAccomplishment({ title, narrative });
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    addAccomplishment.mutate(
      { title: title.trim(), narrative: narrative.trim(), ordinal: nextOrdinal },
      {
        onSuccess: () => {
          setTitle('');
          setNarrative('');
          setErrors({});
          setIsAdding(false);
          toast.success('Accomplishment added');
        },
        onError: () => toast.error('Failed to add accomplishment')
      }
    );
  }

  function handleCancel() {
    setTitle('');
    setNarrative('');
    setErrors({});
    setIsAdding(false);
  }

  if (!isAdding) {
    return (
      <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setIsAdding(true)}>
        <Plus className="h-3 w-3 mr-1" />
        Add accomplishment
      </Button>
    );
  }

  return (
    <div className="border rounded-lg p-3 space-y-3 border-dashed">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">New accomplishment</p>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <EditableField
        type="text"
        label="Title"
        required
        value={title}
        onChange={setTitle}
        error={errors.title}
        disabled={addAccomplishment.isPending}
        placeholder="Accomplishment title"
      />
      <EditableField
        type="textarea"
        label="Narrative"
        value={narrative}
        onChange={setNarrative}
        error={errors.narrative}
        rows={3}
        disabled={addAccomplishment.isPending}
        placeholder="Describe what you did, why, and the outcome in detail..."
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={addAccomplishment.isPending}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={addAccomplishment.isPending}>
          {addAccomplishment.isPending ? 'Adding...' : 'Add'}
        </Button>
      </div>
    </div>
  );
}
