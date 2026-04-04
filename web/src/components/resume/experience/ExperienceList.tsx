import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditableField } from '@/components/shared/EditableField.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { SaveBar } from '@/components/shared/SaveBar.js';
import { Button } from '@/components/ui/button';
import { useAddAccomplishment } from '@/hooks/use-accomplishments';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import { useExperiences, useUpdateExperience } from '@/hooks/use-experiences';
import { type ExperienceFormState, hasErrors, type ValidationErrors, validateExperience } from '@/lib/validation.js';
import { AccomplishmentEditor } from './AccomplishmentEditor.js';

type AccomplishmentDto = {
  id: string;
  title: string;
  narrative: string;
  ordinal: number;
};

type Experience = {
  id: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  narrative: string | null;
  ordinal: number;
  accomplishments: AccomplishmentDto[];
};

interface ExperienceListProps {
  readonly onDirtyChange: (id: string, isDirty: boolean) => void;
}

export function ExperienceList({ onDirtyChange }: ExperienceListProps) {
  const { data: experiences = [], isLoading } = useExperiences();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <LoadingSkeleton variant="list" count={3} />;

  return (
    <div className="space-y-3">
      {(experiences as Experience[]).map(exp => (
        <ExperienceCard
          key={exp.id}
          experience={exp}
          expanded={expandedId === exp.id}
          onToggle={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
          onDirtyChange={onDirtyChange}
        />
      ))}
    </div>
  );
}

function ExperienceCard({
  experience,
  expanded,
  onToggle,
  onDirtyChange
}: {
  readonly experience: Experience;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly onDirtyChange: (id: string, isDirty: boolean) => void;
}) {
  const updateExperience = useUpdateExperience();
  const addAccomplishment = useAddAccomplishment(experience.id);
  const [errors, setErrors] = useState<ValidationErrors<ExperienceFormState>>({});

  const savedState = useMemo(
    () => ({
      title: experience.title,
      companyName: experience.companyName,
      location: experience.location,
      startDate: experience.startDate,
      endDate: experience.endDate,
      summary: experience.summary ?? '',
      narrative: experience.narrative ?? ''
    }),
    [
      experience.title,
      experience.companyName,
      experience.location,
      experience.startDate,
      experience.endDate,
      experience.summary,
      experience.narrative
    ]
  );

  const { current, setField, isDirtyField, isDirty, dirtyCount, reset } = useDirtyTracking(savedState);

  useEffect(() => {
    onDirtyChange(experience.id, isDirty);
  }, [experience.id, isDirty, onDirtyChange]);

  function handleSave() {
    const validationErrors = validateExperience(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    updateExperience.mutate(
      {
        id: experience.id,
        title: current.title.trim(),
        company_name: current.companyName.trim(),
        company_website: experience.companyWebsite ?? undefined,
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

  function handleAddAccomplishment() {
    addAccomplishment.mutate(
      { title: '', narrative: '', ordinal: experience.accomplishments.length },
      { onError: () => toast.error('Failed to add accomplishment') }
    );
  }

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
        onClick={onToggle}
      >
        <div>
          <span className="font-medium">{experience.companyName}</span>
          <span className="text-muted-foreground text-sm ml-2">· {experience.title}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span>{experience.accomplishments.length} accomplishments</span>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t pt-4">
          <div className="grid grid-cols-2 gap-3">
            <EditableField
              type="text"
              label="Title"
              required
              value={current.title}
              onChange={v => setField('title', v)}
              isDirty={isDirtyField('title')}
              error={errors.title}
              disabled={updateExperience.isPending}
            />
            <EditableField
              type="text"
              label="Company"
              required
              value={current.companyName}
              onChange={v => setField('companyName', v)}
              isDirty={isDirtyField('companyName')}
              error={errors.companyName}
              disabled={updateExperience.isPending}
            />
          </div>

          <EditableField
            type="text"
            label="Location"
            required
            value={current.location}
            onChange={v => setField('location', v)}
            isDirty={isDirtyField('location')}
            error={errors.location}
            disabled={updateExperience.isPending}
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
              disabled={updateExperience.isPending}
              placeholder="e.g. Jan 2023"
            />
            <EditableField
              type="text"
              label="End Date"
              required
              value={current.endDate}
              onChange={v => setField('endDate', v)}
              isDirty={isDirtyField('endDate')}
              error={errors.endDate}
              disabled={updateExperience.isPending}
              placeholder="e.g. Present"
            />
          </div>

          <EditableField
            type="textarea"
            label="Summary"
            value={current.summary}
            onChange={v => setField('summary', v)}
            isDirty={isDirtyField('summary')}
            rows={2}
            disabled={updateExperience.isPending}
            placeholder="Brief role summary..."
          />

          <EditableField
            type="textarea"
            label="Narrative"
            value={current.narrative}
            onChange={v => setField('narrative', v)}
            isDirty={isDirtyField('narrative')}
            rows={3}
            disabled={updateExperience.isPending}
            placeholder="Overall context for this role — scope, team, why it mattered..."
          />

          <SaveBar
            dirtyCount={dirtyCount}
            onSave={handleSave}
            onDiscard={reset}
            isSaving={updateExperience.isPending}
          />

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Accomplishments</p>
            <div className="space-y-2">
              {experience.accomplishments.map(acc => (
                <AccomplishmentEditor
                  key={acc.id}
                  experienceId={experience.id}
                  accomplishment={acc}
                  onDirtyChange={onDirtyChange}
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={handleAddAccomplishment}
                disabled={addAccomplishment.isPending}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add accomplishment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
