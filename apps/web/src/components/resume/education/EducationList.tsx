import { Plus, Trash2 } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.js';
import { EditableField } from '@/components/shared/EditableField.js';
import { EditableSection } from '@/components/shared/EditableSection.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { FormModal } from '@/components/shared/FormModal.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import {
  type Education,
  useCreateEducation,
  useDeleteEducation,
  useEducations,
  useUpdateEducation
} from '@/hooks/use-educations';
import { cn } from '@/lib/utils';
import { type EducationFormState, hasErrors, type ValidationErrors, validateEducation } from '@/lib/validation.js';
import { EducationCardContent } from './EducationCardContent.js';

const EMPTY_EDUCATION: EducationFormState = {
  institutionName: '',
  degreeTitle: '',
  graduationYear: '',
  location: '',
  honors: '',
  hiddenByDefault: 'false'
};

function HiddenByDefaultCheckbox({
  checked,
  onChange,
  isDirty,
  disabled
}: {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly isDirty?: boolean;
  readonly disabled?: boolean;
}) {
  const fieldId = useId();
  return (
    <div className={cn('flex items-center gap-2 py-1', isDirty && 'border-l-2 border-primary/30 pl-3')}>
      <Checkbox id={fieldId} checked={checked} onCheckedChange={onChange} disabled={disabled} />
      <Label htmlFor={fieldId} className="text-sm leading-none">
        Hidden by default on new resumes
      </Label>
    </div>
  );
}

function EducationEditor({ education }: { readonly education: Education }) {
  const update = useUpdateEducation();
  const del = useDeleteEducation();
  const [errors, setErrors] = useState<ValidationErrors<EducationFormState>>({});

  const savedState = useMemo(
    () => ({
      institutionName: education.institutionName,
      degreeTitle: education.degreeTitle,
      graduationYear: String(education.graduationYear),
      location: education.location ?? '',
      honors: education.honors ?? '',
      hiddenByDefault: String(education.hiddenByDefault)
    }),
    [
      education.institutionName,
      education.degreeTitle,
      education.graduationYear,
      education.location,
      education.honors,
      education.hiddenByDefault
    ]
  );

  const { current, setField, isDirtyField, isDirty, reset } = useDirtyTracking(savedState);

  function handleSave() {
    const validationErrors = validateEducation(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    const year = Number.parseInt(current.graduationYear, 10);
    update.mutate(
      {
        id: education.id,
        degree_title: current.degreeTitle.trim(),
        institution_name: current.institutionName.trim(),
        graduation_year: year,
        location: current.location.trim() || null,
        honors: current.honors.trim() || null,
        ordinal: education.ordinal,
        hidden_by_default: current.hiddenByDefault === 'true'
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
    <EditableSection
      variant="card"
      sectionId={`education-${education.id}`}
      onSave={handleSave}
      onDiscard={reset}
      isDirty={isDirty}
      isSaving={update.isPending}
    >
      <EditableSection.Display>
        <EducationCardContent education={education} />
      </EditableSection.Display>
      <EditableSection.Editor>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-3">
              <EditableField
                type="text"
                label="Institution"
                required
                value={current.institutionName}
                onChange={v => setField('institutionName', v)}
                isDirty={isDirtyField('institutionName')}
                error={errors.institutionName}
                disabled={update.isPending}
              />
              <EditableField
                type="text"
                label="Degree"
                required
                value={current.degreeTitle}
                onChange={v => setField('degreeTitle', v)}
                isDirty={isDirtyField('degreeTitle')}
                error={errors.degreeTitle}
                disabled={update.isPending}
              />
              <div className="grid grid-cols-2 gap-3">
                <EditableField
                  type="number"
                  label="Graduation Year"
                  required
                  value={current.graduationYear}
                  onChange={v => setField('graduationYear', v)}
                  isDirty={isDirtyField('graduationYear')}
                  error={errors.graduationYear}
                  disabled={update.isPending}
                />
                <EditableField
                  type="text"
                  label="Location"
                  value={current.location}
                  onChange={v => setField('location', v)}
                  isDirty={isDirtyField('location')}
                  disabled={update.isPending}
                />
              </div>
              <EditableField
                type="text"
                label="Honors"
                value={current.honors}
                onChange={v => setField('honors', v)}
                isDirty={isDirtyField('honors')}
                disabled={update.isPending}
                placeholder="e.g. Magna Cum Laude"
              />
              <HiddenByDefaultCheckbox
                checked={current.hiddenByDefault === 'true'}
                onChange={v => setField('hiddenByDefault', String(v))}
                isDirty={isDirtyField('hiddenByDefault')}
                disabled={update.isPending}
              />
            </div>
            <ConfirmDialog
              title="Delete education?"
              description="This education entry will be permanently removed."
              onConfirm={() => del.mutate(education.id)}
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

function CreateEducationModal({
  open,
  onOpenChange,
  educationCount
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly educationCount: number;
}) {
  const createEducation = useCreateEducation();

  const { current, setField, isDirtyField, dirtyCount, reset } = useDirtyTracking(EMPTY_EDUCATION);
  const [errors, setErrors] = useState<ValidationErrors<EducationFormState>>({});

  function handleSave() {
    const validationErrors = validateEducation(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    const year = Number.parseInt(current.graduationYear, 10);
    createEducation.mutate(
      {
        degree_title: current.degreeTitle.trim(),
        institution_name: current.institutionName.trim(),
        graduation_year: year,
        location: current.location.trim() || null,
        honors: current.honors.trim() || null,
        ordinal: educationCount,
        hidden_by_default: current.hiddenByDefault === 'true'
      },
      {
        onSuccess: () => {
          setErrors({});
          reset();
          onOpenChange(false);
          toast.success('Education created');
        },
        onError: () => toast.error('Failed to create education')
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
      title="Add Education"
      description="Add a new education entry to your profile."
      dirtyCount={dirtyCount}
      isSaving={createEducation.isPending}
      onSave={handleSave}
      onDiscard={handleDiscard}
    >
      <EditableField
        type="text"
        label="Institution"
        required
        value={current.institutionName}
        onChange={v => setField('institutionName', v)}
        isDirty={isDirtyField('institutionName')}
        error={errors.institutionName}
        placeholder="e.g. MIT"
      />
      <EditableField
        type="text"
        label="Degree"
        required
        value={current.degreeTitle}
        onChange={v => setField('degreeTitle', v)}
        isDirty={isDirtyField('degreeTitle')}
        error={errors.degreeTitle}
        placeholder="e.g. B.S. Computer Science"
      />
      <EditableField
        type="number"
        label="Graduation Year"
        required
        value={current.graduationYear}
        onChange={v => setField('graduationYear', v)}
        isDirty={isDirtyField('graduationYear')}
        error={errors.graduationYear}
      />
      <EditableField
        type="text"
        label="Location"
        value={current.location}
        onChange={v => setField('location', v)}
        isDirty={isDirtyField('location')}
        placeholder="e.g. Cambridge, MA"
      />
      <EditableField
        type="text"
        label="Honors"
        value={current.honors}
        onChange={v => setField('honors', v)}
        isDirty={isDirtyField('honors')}
        placeholder="e.g. Magna Cum Laude"
      />
      <HiddenByDefaultCheckbox
        checked={current.hiddenByDefault === 'true'}
        onChange={v => setField('hiddenByDefault', String(v))}
        isDirty={isDirtyField('hiddenByDefault')}
        disabled={createEducation.isPending}
      />
    </FormModal>
  );
}

export function EducationList() {
  const { data: educations = [], isLoading } = useEducations();
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) return <LoadingSkeleton variant="list" count={2} />;

  if ((educations as Education[]).length === 0 && !modalOpen) {
    return (
      <>
        <EmptyState
          message="No education entries yet."
          actionLabel="Add education"
          onAction={() => setModalOpen(true)}
        />
        <CreateEducationModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          educationCount={(educations as Education[]).length}
        />
      </>
    );
  }

  return (
    <div className="space-y-3">
      {(educations as Education[]).map(edu => (
        <EducationEditor key={edu.id} education={edu} />
      ))}

      <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setModalOpen(true)}>
        <Plus className="h-3 w-3 mr-1" />
        Add education
      </Button>

      <CreateEducationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        educationCount={(educations as Education[]).length}
      />
    </div>
  );
}
