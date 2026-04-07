import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditableField } from '@/components/shared/EditableField.js';
import { FieldError } from '@/components/shared/FieldError.js';
import { FormModal } from '@/components/shared/FormModal.js';
import { Label } from '@/components/ui/label';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import type { Company } from '@/hooks/use-companies';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import {
  type Experience,
  useCreateExperience,
  useLinkCompany,
  useUnlinkCompany,
  useUpdateExperience
} from '@/hooks/use-experiences';
import { cn } from '@/lib/utils';
import { type ExperienceFormState, hasErrors, type ValidationErrors, validateExperience } from '@/lib/validation.js';
import type { AccomplishmentItem } from './AccomplishmentEditor.js';
import { AccomplishmentListEditor } from './AccomplishmentListEditor.js';
import { CompanySearchPopover } from './CompanySearchPopover.js';

type ModalMode = { mode: 'create'; experienceCount: number } | { mode: 'edit'; experience: Experience };

interface Props {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly modalMode: ModalMode;
}

function emptyState(): ExperienceFormState {
  return {
    title: '',
    companyName: '',
    companyWebsite: '',
    companyAccent: '',
    location: '',
    startDate: '',
    endDate: '',
    summary: ''
  };
}

function stateFromExperience(exp: Experience): ExperienceFormState {
  return {
    title: exp.title,
    companyName: exp.companyName,
    companyWebsite: exp.companyWebsite ?? '',
    companyAccent: exp.companyAccent ?? '',
    location: exp.location,
    startDate: exp.startDate,
    endDate: exp.endDate,
    summary: exp.summary ?? ''
  };
}

function toLocalAccomplishments(accomplishments: Experience['accomplishments']): AccomplishmentItem[] {
  return accomplishments.map(acc => ({
    id: acc.id,
    tempId: acc.id,
    title: acc.title,
    narrative: acc.narrative,
    ordinal: acc.ordinal
  }));
}

export function ExperienceFormModal({ open, onOpenChange, modalMode }: Props) {
  const isCreate = modalMode.mode === 'create';
  const experience = modalMode.mode === 'edit' ? modalMode.experience : null;

  const createExperience = useCreateExperience();
  const updateExperience = useUpdateExperience();
  const linkCompany = useLinkCompany();
  const unlinkCompany = useUnlinkCompany();

  const [nestedModalOpen, setNestedModalOpen] = useState(false);

  const [linkedCompany, setLinkedCompany] = useState<Company | null>(
    modalMode.mode === 'edit' ? modalMode.experience.company : null
  );

  // Local accomplishment list — initialized once from server data on mount
  const [localAccomplishments, setLocalAccomplishments] = useState<AccomplishmentItem[]>(() =>
    toLocalAccomplishments(experience?.accomplishments ?? [])
  );

  const isSaving =
    createExperience.isPending || updateExperience.isPending || linkCompany.isPending || unlinkCompany.isPending;

  const savedState = useMemo(() => (experience ? stateFromExperience(experience) : emptyState()), [experience]);

  const { current, setField, isDirtyField, dirtyCount, reset } = useDirtyTracking(savedState);
  const [errors, setErrors] = useState<ValidationErrors<ExperienceFormState>>({});

  // Snapshot of accomplishments at mount — used to detect dirty state
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally snapshot once on mount
  const initialAccomplishments = useMemo(
    () => toLocalAccomplishments(experience?.accomplishments ?? []),
    [] // intentionally snapshot once on mount
  );

  const accomplishmentsDirty = useMemo(() => {
    if (localAccomplishments.length !== initialAccomplishments.length) return true;
    return localAccomplishments.some((acc, i) => {
      const orig = initialAccomplishments[i];
      return !orig || acc.tempId !== orig.tempId || acc.title !== orig.title || acc.narrative !== orig.narrative;
    });
  }, [localAccomplishments, initialAccomplishments]);

  const totalDirtyCount = dirtyCount + (accomplishmentsDirty ? 1 : 0);

  function handleAccomplishmentAdd(title: string, narrative: string) {
    setLocalAccomplishments(prev => [
      ...prev,
      {
        id: null,
        tempId: crypto.randomUUID(),
        title,
        narrative,
        ordinal: prev.length
      }
    ]);
  }

  function handleAccomplishmentChange(tempId: string, field: 'title' | 'narrative', value: string) {
    setLocalAccomplishments(prev => prev.map(acc => (acc.tempId === tempId ? { ...acc, [field]: value } : acc)));
  }

  function handleAccomplishmentDelete(tempId: string) {
    setLocalAccomplishments(prev => prev.filter(acc => acc.tempId !== tempId));
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    setLocalAccomplishments(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((acc, i) => ({ ...acc, ordinal: i }));
    });
  }

  function handleMoveDown(index: number) {
    setLocalAccomplishments(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((acc, i) => ({ ...acc, ordinal: i }));
    });
  }

  function handleLinkCompany(company: Company) {
    if (!experience) return;
    linkCompany.mutate(
      { experienceId: experience.id, companyId: company.id },
      {
        onSuccess: () => {
          setLinkedCompany(company);
          toast.success(`Linked to ${company.name}`);
        },
        onError: () => toast.error('Failed to link company')
      }
    );
  }

  function handleUnlinkCompany() {
    if (!experience) return;
    unlinkCompany.mutate(experience.id, {
      onSuccess: () => {
        setLinkedCompany(null);
        toast.success('Company unlinked');
      },
      onError: () => toast.error('Failed to unlink company')
    });
  }

  function handleSave() {
    const validationErrors = validateExperience(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    const invalidAccomplishments = localAccomplishments.filter(a => !a.title.trim());
    if (invalidAccomplishments.length > 0) {
      toast.error('All accomplishments must have a title.');
      return;
    }

    if (isCreate) {
      createExperience.mutate(
        {
          title: current.title.trim(),
          company_name: current.companyName.trim(),
          company_website: current.companyWebsite.trim() || undefined,
          company_accent: current.companyAccent.trim() || undefined,
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
          company_accent: current.companyAccent.trim() || undefined,
          location: current.location.trim(),
          start_date: current.startDate.trim(),
          end_date: current.endDate.trim(),
          summary: current.summary.trim() || undefined,
          ordinal: experience.ordinal,
          accomplishments: localAccomplishments.map((acc, index) => ({
            id: acc.id,
            title: acc.title.trim(),
            narrative: acc.narrative.trim(),
            ordinal: index
          }))
        },
        {
          onSuccess: () => {
            setErrors({});
            reset();
            onOpenChange(false);
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
    setLocalAccomplishments(toLocalAccomplishments(experience?.accomplishments ?? []));
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={isCreate ? 'Add Experience' : 'Edit Experience'}
      description={isCreate ? 'Add a new work experience to your profile.' : undefined}
      dirtyCount={totalDirtyCount}
      isSaving={isSaving}
      onSave={handleSave}
      onDiscard={handleDiscard}
      externalStacked={nestedModalOpen}
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
        <div>
          <div className="flex items-end gap-1">
            <div className="flex-1">
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
            {experience && (
              <CompanySearchPopover
                linkedCompany={linkedCompany}
                companyName={current.companyName}
                onLink={handleLinkCompany}
                onUnlink={handleUnlinkCompany}
                disabled={isSaving}
                onNestedModalChange={setNestedModalOpen}
              />
            )}
          </div>
          {linkedCompany && linkedCompany.name !== current.companyName && (
            <button
              type="button"
              className="mt-1 text-xs text-primary hover:underline"
              onClick={() => setField('companyName', linkedCompany.name)}
            >
              Use "{linkedCompany.name}"?
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
          label="Company Accent"
          value={current.companyAccent}
          onChange={v => setField('companyAccent', v)}
          isDirty={isDirtyField('companyAccent')}
          disabled={isSaving}
          placeholder="e.g. acquired by Volvo Cars"
        />
      </div>
      {linkedCompany?.website && linkedCompany.website !== current.companyWebsite && (
        <button
          type="button"
          className="mt-1 text-xs text-primary hover:underline"
          onClick={() => setField('companyWebsite', linkedCompany.website!)}
        >
          Use "{linkedCompany.website}"?
        </button>
      )}

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

      {experience && (
        <div className="pt-2 border-t">
          <AccomplishmentListEditor
            accomplishments={localAccomplishments}
            onAdd={handleAccomplishmentAdd}
            onChange={handleAccomplishmentChange}
            onDelete={handleAccomplishmentDelete}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            disabled={isSaving}
          />
        </div>
      )}
    </FormModal>
  );
}
