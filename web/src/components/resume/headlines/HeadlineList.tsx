import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.js';
import { EditableField } from '@/components/shared/EditableField.js';
import { EditableSection } from '@/components/shared/EditableSection.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import { useCreateHeadline, useDeleteHeadline, useHeadlines, useUpdateHeadline } from '@/hooks/use-headlines';
import { useProfile } from '@/hooks/use-profile';
import { type HeadlineFormState, hasErrors, type ValidationErrors, validateHeadline } from '@/lib/validation.js';
import { HeadlineCardContent } from './HeadlineCardContent.js';

type Headline = {
  id: string;
  label: string;
  summaryText: string;
};

function HeadlineEditor({ headline }: { readonly headline: Headline }) {
  const update = useUpdateHeadline();
  const del = useDeleteHeadline();
  const [errors, setErrors] = useState<ValidationErrors<HeadlineFormState>>({});

  const savedState = useMemo(
    () => ({ label: headline.label, summaryText: headline.summaryText }),
    [headline.label, headline.summaryText]
  );
  const { current, setField, isDirtyField, isDirty, reset } = useDirtyTracking(savedState);

  function handleSave() {
    const validationErrors = validateHeadline(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    update.mutate(
      { id: headline.id, label: current.label.trim(), summary_text: current.summaryText.trim() },
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
      sectionId={`headline-${headline.id}`}
      onSave={handleSave}
      onDiscard={reset}
      isDirty={isDirty}
      isSaving={update.isPending}
    >
      <EditableSection.Display>
        <HeadlineCardContent headline={headline} />
      </EditableSection.Display>
      <EditableSection.Editor>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-3">
              <EditableField
                type="text"
                label="Label"
                required
                value={current.label}
                onChange={v => setField('label', v)}
                isDirty={isDirtyField('label')}
                error={errors.label}
                disabled={update.isPending}
                placeholder="e.g. Staff Engineer"
              />
              <EditableField
                type="textarea"
                label="Summary"
                value={current.summaryText}
                onChange={v => setField('summaryText', v)}
                isDirty={isDirtyField('summaryText')}
                rows={2}
                disabled={update.isPending}
                placeholder="1–3 sentence professional summary..."
              />
            </div>
            <ConfirmDialog
              title="Delete headline?"
              description="This headline will be permanently removed."
              onConfirm={() => del.mutate(headline.id)}
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

export function HeadlineList() {
  const { data: headlines = [], isLoading } = useHeadlines();
  const { data: profile } = useProfile();
  const createHeadline = useCreateHeadline();
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newSummaryText, setNewSummaryText] = useState('');
  const [createErrors, setCreateErrors] = useState<ValidationErrors<HeadlineFormState>>({});

  function handleAdd() {
    const validationErrors = validateHeadline({ label: newLabel, summaryText: newSummaryText });
    setCreateErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    if (!profile?.id) {
      toast.error('Profile not loaded');
      return;
    }
    createHeadline.mutate(
      { profile_id: profile.id, label: newLabel.trim(), summary_text: newSummaryText.trim() },
      {
        onSuccess: () => {
          setAdding(false);
          setNewLabel('');
          setNewSummaryText('');
          setCreateErrors({});
          toast.success('Headline created');
        },
        onError: () => toast.error('Failed to create headline')
      }
    );
  }

  if (isLoading) return <LoadingSkeleton variant="list" count={3} />;

  if ((headlines as Headline[]).length === 0 && !adding) {
    return <EmptyState message="No headlines yet." actionLabel="Add headline" onAction={() => setAdding(true)} />;
  }

  return (
    <div className="space-y-3">
      {(headlines as Headline[]).map(h => (
        <HeadlineEditor key={h.id} headline={h} />
      ))}

      {adding ? (
        <div className="border border-primary/30 rounded-lg p-4 space-y-3">
          <EditableField
            type="text"
            label="Label"
            required
            value={newLabel}
            onChange={setNewLabel}
            error={createErrors.label}
            placeholder="Headline label (e.g. Staff Engineer)"
          />
          <EditableField
            type="textarea"
            label="Summary"
            value={newSummaryText}
            onChange={setNewSummaryText}
            rows={2}
            placeholder="1–3 sentence professional summary..."
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={createHeadline.isPending}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setNewLabel('');
                setNewSummaryText('');
                setCreateErrors({});
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setAdding(true)}>
          <Plus className="h-3 w-3 mr-1" />
          Add headline
        </Button>
      )}
    </div>
  );
}
