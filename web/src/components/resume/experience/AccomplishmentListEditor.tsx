import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { EditableField } from '@/components/shared/EditableField.js';
import { Button } from '@/components/ui/button';
import {
  type AccomplishmentFormState,
  hasErrors,
  type ValidationErrors,
  validateAccomplishment
} from '@/lib/validation.js';
import { AccomplishmentEditor, type AccomplishmentItem } from './AccomplishmentEditor.js';

interface Props {
  readonly accomplishments: AccomplishmentItem[];
  readonly onAdd: (title: string, narrative: string) => void;
  readonly onChange: (tempId: string, field: 'title' | 'narrative', value: string) => void;
  readonly onDelete: (tempId: string) => void;
  readonly onMoveUp: (index: number) => void;
  readonly onMoveDown: (index: number) => void;
  readonly disabled?: boolean;
}

export function AccomplishmentListEditor({
  accomplishments,
  onAdd,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  disabled
}: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Accomplishments</p>
      {accomplishments.map((acc, index) => (
        <AccomplishmentEditor
          key={acc.tempId}
          accomplishment={acc}
          isFirst={index === 0}
          isLast={index === accomplishments.length - 1}
          onMoveUp={() => onMoveUp(index)}
          onMoveDown={() => onMoveDown(index)}
          onChange={onChange}
          onDelete={onDelete}
          disabled={disabled}
        />
      ))}
      <AddAccomplishmentForm onAdd={onAdd} disabled={disabled} />
    </div>
  );
}

function AddAccomplishmentForm({
  onAdd,
  disabled
}: {
  readonly onAdd: (title: string, narrative: string) => void;
  readonly disabled?: boolean;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [narrative, setNarrative] = useState('');
  const [errors, setErrors] = useState<ValidationErrors<AccomplishmentFormState>>({});

  function handleConfirm() {
    const validationErrors = validateAccomplishment({ title, narrative });
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;
    onAdd(title.trim(), narrative.trim());
    setTitle('');
    setNarrative('');
    setErrors({});
    setIsAdding(false);
  }

  function handleCancel() {
    setTitle('');
    setNarrative('');
    setErrors({});
    setIsAdding(false);
  }

  if (!isAdding) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full border-dashed"
        onClick={() => setIsAdding(true)}
        disabled={disabled}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add accomplishment
      </Button>
    );
  }

  return (
    <div className="border rounded-lg p-3 space-y-3 border-dashed">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">New accomplishment</p>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancel} disabled={disabled}>
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
        disabled={disabled}
        placeholder="Accomplishment title"
      />
      <EditableField
        type="textarea"
        label="Narrative"
        value={narrative}
        onChange={setNarrative}
        error={errors.narrative}
        rows={3}
        disabled={disabled}
        placeholder="Describe what you did, why, and the outcome in detail..."
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={disabled}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleConfirm} disabled={disabled}>
          Add
        </Button>
      </div>
    </div>
  );
}
