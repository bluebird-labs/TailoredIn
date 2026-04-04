import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditableField } from '@/components/shared/EditableField.js';
import { FieldError } from '@/components/shared/FieldError.js';
import { FormModal } from '@/components/shared/FormModal.js';
import { Label } from '@/components/ui/label';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import { type Experience, useCreateExperience, useUpdateExperience } from '@/hooks/use-experiences';
import { cn } from '@/lib/utils';
import { type ExperienceFormState, hasErrors, type ValidationErrors, validateExperience } from '@/lib/validation.js';
import { AccomplishmentListEditor } from './AccomplishmentListEditor.js';

type ModalMode = { mode: 'create'; experienceCount: number } | { mode: 'edit'; experience: Experience };

interface Props {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly modalMode: ModalMode;
  readonly onAccomplishmentDirtyChange: (id: string, isDirty: boolean) => void;
}

function emptyState(): ExperienceFormState {
  return {
    title: '',
    companyName: '',
    companyWebsite: '',
    location: '',
    startDate: '',
    endDate: '',
    summary: '',
    narrative: ''
  };
}

function stateFromExperience(exp: Experience): ExperienceFormState {
  return {
    title: exp.title,
    companyName: exp.companyName,
    companyWebsite: exp.companyWebsite ?? '',
    location: exp.location,
    startDate: exp.startDate,
    endDate: exp.endDate,
    summary: exp.summary ?? '',
    narrative: exp.narrative ?? ''
  };
}

export function ExperienceFormModal({ open, onOpenChange, modalMode, onAccomplishmentDirtyChange }: Props) {
  const isCreate = modalMode.mode === 'create';
  const experience = modalMode.mode === 'edit' ? modalMode.experience : null;

  const createExperience = useCreateExperience();
  const updateExperience = useUpdateExperience();
  const isSaving = createExperience.isPending || updateExperience.isPending;

  const savedState = useMemo(() => (experience ? stateFromExperience(experience) : emptyState()), [experience]);

  const { current, setField, isDirtyField, dirtyCount, reset } = useDirtyTracking(savedState);
  const [errors, setErrors] = useState<ValidationErrors<ExperienceFormState>>({});

  function handleSave() {
    const validationErrors = validateExperience(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    if (isCreate) {
      createExperience.mutate(
        {
          title: current.title.trim(),
          company_name: current.companyName.trim(),
          company_website: current.companyWebsite.trim() || undefined,
          location: current.location.trim(),
          start_date: current.startDate.trim(),
          end_date: current.endDate.trim(),
          summary: current.summary.trim() || undefined,
          ordinal: modalMode.mode === 'create' ? modalMode.experienceCount : 0
        },
        {
          onSuccess: () => {
            setErrors({});
            reset();
            onOpenChange(false);
            toast.success('Experience created');
          },
          onError: () => toast.error('Failed to create experience')
        }
      );
    } else if (experience) {
      updateExperience.mutate(
        {
          id: experience.id,
          title: current.title.trim(),
          company_name: current.companyName.trim(),
          company_website: current.companyWebsite.trim() || undefined,
          location: current.location.trim(),
          start_date: current.startDate.trim(),
          end_date: current.endDate.trim(),
          summary: current.summary.trim() || undefined,
          narrative: current.narrative.trim() || undefined,
          ordinal: experience.ordinal
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
  }

  function handleDiscard() {
    reset();
    setErrors({});
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={isCreate ? 'Add Experience' : 'Edit Experience'}
      description={isCreate ? 'Add a new work experience to your profile.' : undefined}
      dirtyCount={dirtyCount}
      isSaving={isSaving}
      onSave={handleSave}
      onDiscard={handleDiscard}
    >
      <div className="grid grid-cols-2 gap-3">
        <EditableField
          type="text"
          label="Role / Title"
          required
          value={current.title}
          onChange={v => setField('title', v)}
          isDirty={isDirtyField('title')}
          error={errors.title}
          disabled={isSaving}
          placeholder="e.g. Senior Software Engineer"
        />
        <EditableField
          type="text"
          label="Company"
          required
          value={current.companyName}
          onChange={v => setField('companyName', v)}
          isDirty={isDirtyField('companyName')}
          error={errors.companyName}
          disabled={isSaving}
          placeholder="e.g. Acme Corp"
        />
      </div>

      <EditableField
        type="text"
        label="Company Website"
        value={current.companyWebsite}
        onChange={v => setField('companyWebsite', v)}
        isDirty={isDirtyField('companyWebsite')}
        disabled={isSaving}
        placeholder="https://..."
      />

      <EditableField
        type="text"
        label="Location"
        required
        value={current.location}
        onChange={v => setField('location', v)}
        isDirty={isDirtyField('location')}
        error={errors.location}
        disabled={isSaving}
        placeholder="e.g. San Francisco, CA"
      />

      <div className="grid grid-cols-2 gap-3">
        <div className={cn('space-y-1.5', isDirtyField('startDate') && 'border-l-2 border-primary/30 pl-3')}>
          <Label>
            Start Date
            <span className="text-destructive ml-0.5">*</span>
          </Label>
          <MonthYearPicker value={current.startDate} onChange={v => setField('startDate', v)} />
          <FieldError message={errors.startDate} />
        </div>
        <div className={cn('space-y-1.5', isDirtyField('endDate') && 'border-l-2 border-primary/30 pl-3')}>
          <Label>
            End Date
            <span className="text-destructive ml-0.5">*</span>
          </Label>
          <MonthYearPicker value={current.endDate} onChange={v => setField('endDate', v)} />
          <FieldError message={errors.endDate} />
        </div>
      </div>

      <EditableField
        type="textarea"
        label="Summary"
        value={current.summary}
        onChange={v => setField('summary', v)}
        isDirty={isDirtyField('summary')}
        rows={2}
        disabled={isSaving}
        placeholder="Brief role summary..."
      />

      <EditableField
        type="textarea"
        label="Narrative"
        value={current.narrative}
        onChange={v => setField('narrative', v)}
        isDirty={isDirtyField('narrative')}
        rows={3}
        disabled={isSaving}
        placeholder="Overall context for this role — scope, team, why it mattered..."
      />

      {experience && (
        <div className="pt-2 border-t">
          <AccomplishmentListEditor
            experienceId={experience.id}
            accomplishments={experience.accomplishments}
            onDirtyChange={onAccomplishmentDirtyChange}
          />
        </div>
      )}
    </FormModal>
  );
}
