import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditableField } from '@/components/shared/EditableField.js';
import { EditableSection } from '@/components/shared/EditableSection.js';
import { InfoCard, InfoRow } from '@/components/shared/InfoCard.js';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import { type Experience, useUpdateExperience } from '@/hooks/use-experiences';
import { type ExperienceFormState, hasErrors, type ValidationErrors, validateExperience } from '@/lib/validation.js';

interface ExperienceDetailsEditorProps {
  readonly experience: Experience;
}

function ExperienceDetailsEditor({ experience }: ExperienceDetailsEditorProps) {
  const update = useUpdateExperience();
  const [errors, setErrors] = useState<ValidationErrors<ExperienceFormState>>({});

  const savedState: ExperienceFormState = useMemo(
    () => ({
      title: experience.title,
      companyName: experience.companyName,
      companyWebsite: experience.companyWebsite ?? '',
      companyAccent: experience.companyAccent ?? '',
      location: experience.location,
      startDate: experience.startDate,
      endDate: experience.endDate,
      summary: experience.summary ?? '',
      bulletMin: experience.bulletMin,
      bulletMax: experience.bulletMax
    }),
    [
      experience.title,
      experience.companyName,
      experience.companyWebsite,
      experience.companyAccent,
      experience.location,
      experience.startDate,
      experience.endDate,
      experience.summary,
      experience.bulletMin,
      experience.bulletMax
    ]
  );

  const { current, setField, isDirtyField, isDirty, reset } = useDirtyTracking(savedState);

  function handleSave() {
    const validationErrors = validateExperience(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    update.mutate(
      {
        id: experience.id,
        title: current.title.trim(),
        company_name: current.companyName.trim(),
        company_website: current.companyWebsite.trim() || undefined,
        company_accent: current.companyAccent.trim() || undefined,
        location: current.location.trim(),
        start_date: current.startDate.trim(),
        end_date: current.endDate.trim(),
        summary: experience.summary ?? undefined,
        ordinal: experience.ordinal,
        accomplishments: experience.accomplishments.map(a => ({
          id: a.id,
          title: a.title,
          narrative: a.narrative,
          ordinal: a.ordinal
        })),
        bullet_min: current.bulletMin,
        bullet_max: current.bulletMax
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
      sectionId="experience-details"
      onSave={handleSave}
      onDiscard={reset}
      isDirty={isDirty}
      isSaving={update.isPending}
    >
      <EditableSection.Display>
        <InfoCard label="Details">
          <InfoRow label="Title" value={experience.title} />
          <InfoRow label="Company" value={experience.companyName} />
          {experience.companyWebsite && (
            <InfoRow label="Website" value={experience.companyWebsite} href={experience.companyWebsite} />
          )}
          <InfoRow label="Location" value={experience.location} />
          <InfoRow label="Start Date" value={experience.startDate} />
          <InfoRow label="End Date" value={experience.endDate} />
          <InfoRow label="Bullet Min" value={String(experience.bulletMin)} />
          <InfoRow label="Bullet Max" value={String(experience.bulletMax)} />
        </InfoCard>
      </EditableSection.Display>
      <EditableSection.Editor>
        <div className="space-y-3">
          <EditableField
            type="text"
            label="Title"
            required
            value={current.title}
            onChange={v => setField('title', v)}
            isDirty={isDirtyField('title')}
            error={errors.title}
            disabled={update.isPending}
          />
          <EditableField
            type="text"
            label="Company"
            required
            value={current.companyName}
            onChange={v => setField('companyName', v)}
            isDirty={isDirtyField('companyName')}
            error={errors.companyName}
            disabled={update.isPending}
          />
          <EditableField
            type="text"
            label="Website"
            value={current.companyWebsite}
            onChange={v => setField('companyWebsite', v)}
            isDirty={isDirtyField('companyWebsite')}
            disabled={update.isPending}
            placeholder="e.g. https://acme.com"
          />
          <EditableField
            type="text"
            label="Location"
            required
            value={current.location}
            onChange={v => setField('location', v)}
            isDirty={isDirtyField('location')}
            error={errors.location}
            disabled={update.isPending}
          />
          <div className="grid grid-cols-2 gap-3">
            <EditableField
              type="text"
              label="Start Date"
              required
              value={current.startDate}
              onChange={v => setField('startDate', v)}
              isDirty={isDirtyField('startDate')}
              error={errors.startDate}
              disabled={update.isPending}
            />
            <EditableField
              type="text"
              label="End Date"
              required
              value={current.endDate}
              onChange={v => setField('endDate', v)}
              isDirty={isDirtyField('endDate')}
              error={errors.endDate}
              disabled={update.isPending}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <EditableField
              type="number"
              label="Bullet Min"
              value={String(current.bulletMin)}
              onChange={v => setField('bulletMin', Number(v) || 0)}
              isDirty={isDirtyField('bulletMin')}
              error={errors.bulletMin}
              disabled={update.isPending}
            />
            <EditableField
              type="number"
              label="Bullet Max"
              value={String(current.bulletMax)}
              onChange={v => setField('bulletMax', Number(v) || 0)}
              isDirty={isDirtyField('bulletMax')}
              error={errors.bulletMax}
              disabled={update.isPending}
            />
          </div>
        </div>
      </EditableSection.Editor>
    </EditableSection>
  );
}

export { ExperienceDetailsEditor };
