import { useMemo } from 'react';
import { toast } from 'sonner';
import { EditableField } from '@/components/shared/EditableField.js';
import { EditableSection } from '@/components/shared/EditableSection.js';
import { InfoCard } from '@/components/shared/InfoCard.js';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import { type Experience, useUpdateExperience } from '@/hooks/use-experiences';

interface ExperienceSummaryEditorProps {
  readonly experience: Experience;
}

function ExperienceSummaryEditor({ experience }: ExperienceSummaryEditorProps) {
  const update = useUpdateExperience();

  const savedState = useMemo(() => ({ summary: experience.summary ?? '' }), [experience.summary]);

  const { current, setField, isDirtyField, isDirty, reset } = useDirtyTracking(savedState);

  function handleSave() {
    update.mutate(
      {
        id: experience.id,
        title: experience.title,
        company_name: experience.companyName,
        company_website: experience.companyWebsite ?? undefined,
        company_accent: experience.companyAccent ?? undefined,
        location: experience.location,
        start_date: experience.startDate,
        end_date: experience.endDate,
        summary: current.summary.trim() || undefined,
        ordinal: experience.ordinal,
        accomplishments: experience.accomplishments.map(a => ({
          id: a.id,
          title: a.title,
          narrative: a.narrative,
          ordinal: a.ordinal
        })),
        bullet_min: experience.bulletMin,
        bullet_max: experience.bulletMax
      },
      {
        onSuccess: () => toast.success('Changes saved'),
        onError: () => toast.error('Failed to save. Please try again.')
      }
    );
  }

  return (
    <EditableSection
      variant="card"
      sectionId="experience-summary"
      onSave={handleSave}
      onDiscard={reset}
      isDirty={isDirty}
      isSaving={update.isPending}
    >
      <EditableSection.Display>
        <InfoCard label="Summary">
          {experience.summary ? (
            <p className="text-[14px] leading-relaxed tracking-[0.01em]">{experience.summary}</p>
          ) : (
            <p className="text-[14px] italic text-muted-foreground">No summary</p>
          )}
        </InfoCard>
      </EditableSection.Display>
      <EditableSection.Editor>
        <EditableField
          type="textarea"
          label="Summary"
          value={current.summary}
          onChange={v => setField('summary', v)}
          isDirty={isDirtyField('summary')}
          disabled={update.isPending}
          rows={5}
          placeholder="Describe this role..."
        />
      </EditableSection.Editor>
    </EditableSection>
  );
}

export { ExperienceSummaryEditor };
