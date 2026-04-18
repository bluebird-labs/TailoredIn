import { useState } from 'react';
import { toast } from 'sonner';
import { EditableField } from '@/components/shared/EditableField.js';
import { FormModal } from '@/components/shared/FormModal.js';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import { useAddAccomplishment } from '@/hooks/use-experiences';
import {
  type AccomplishmentFormState,
  hasErrors,
  type ValidationErrors,
  validateAccomplishment
} from '@/lib/validation.js';

const EMPTY_ACCOMPLISHMENT: AccomplishmentFormState = {
  title: '',
  narrative: ''
};

interface CreateAccomplishmentModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly experienceId: string;
  readonly accomplishmentCount: number;
}

function CreateAccomplishmentModal({
  open,
  onOpenChange,
  experienceId,
  accomplishmentCount
}: CreateAccomplishmentModalProps) {
  const addAccomplishment = useAddAccomplishment();
  const { current, setField, isDirtyField, dirtyCount, reset } = useDirtyTracking(EMPTY_ACCOMPLISHMENT);
  const [errors, setErrors] = useState<ValidationErrors<AccomplishmentFormState>>({});

  function handleSave() {
    const validationErrors = validateAccomplishment(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    addAccomplishment.mutate(
      {
        experienceId,
        title: current.title.trim(),
        narrative: current.narrative.trim(),
        ordinal: accomplishmentCount
      },
      {
        onSuccess: () => {
          setErrors({});
          reset();
          onOpenChange(false);
          toast.success('Accomplishment added');
        },
        onError: () => toast.error('Failed to add accomplishment')
      }
    );
  }

  function handleDiscard() {
    reset();
    setErrors({});
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Accomplishment"
      description="Add a new accomplishment to this experience."
      dirtyCount={dirtyCount}
      isSaving={addAccomplishment.isPending}
      onSave={handleSave}
      onDiscard={handleDiscard}
    >
      <EditableField
        type="text"
        label="Title"
        required
        value={current.title}
        onChange={v => setField('title', v)}
        isDirty={isDirtyField('title')}
        error={errors.title}
        placeholder="Accomplishment title"
      />
      <EditableField
        type="textarea"
        label="Narrative"
        value={current.narrative}
        onChange={v => setField('narrative', v)}
        isDirty={isDirtyField('narrative')}
        placeholder="Describe what you did"
        rows={4}
      />
    </FormModal>
  );
}

export { CreateAccomplishmentModal };
