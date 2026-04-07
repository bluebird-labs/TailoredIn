import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { BulletRangeInput } from '@/components/atelier/BulletRangeInput.js';
import { ModelTierSelector } from '@/components/atelier/ModelTierSelector.js';
import { PromptsAccordion } from '@/components/atelier/PromptsAccordion.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import {
  type GenerationSettings,
  promptsToRecord,
  recordToPrompts,
  useGenerationSettings,
  useUpdateGenerationSettings
} from '@/hooks/use-generation-settings';
import { useNavGuard } from '@/hooks/use-nav-guard.js';

export const Route = createFileRoute('/settings')({
  component: SettingsPage
});

type SettingsFormState = {
  modelTier: 'fast' | 'balanced' | 'best';
  bulletMin: number;
  bulletMax: number;
  prompts: Record<'resume' | 'headline' | 'experience', string>;
};

function SettingsPage() {
  const { data: settings, isLoading } = useGenerationSettings();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <LoadingSkeleton variant="form" />
      </div>
    );
  }

  return <SettingsForm settings={settings} />;
}

function PageHeader() {
  return (
    <div>
      <h1 className="page-heading">Settings</h1>
      <p className="text-muted-foreground text-sm">Configure generation model, bullet ranges, and custom prompts.</p>
    </div>
  );
}

function SettingsForm({ settings }: { readonly settings: GenerationSettings | undefined }) {
  const updateSettings = useUpdateGenerationSettings();

  const savedState = useMemo<SettingsFormState>(
    () =>
      settings
        ? {
            modelTier: settings.modelTier as SettingsFormState['modelTier'],
            bulletMin: settings.bulletMin,
            bulletMax: settings.bulletMax,
            prompts: promptsToRecord(settings.prompts)
          }
        : { modelTier: 'balanced', bulletMin: 2, bulletMax: 5, prompts: { resume: '', headline: '', experience: '' } },
    [settings]
  );

  const { current, isDirty, setField, reset } = useDirtyTracking(savedState);

  useNavGuard({ isDirty });

  function handlePromptChange(scope: 'resume' | 'headline' | 'experience', value: string) {
    setField('prompts', { ...current.prompts, [scope]: value });
  }

  function handleSave() {
    updateSettings.mutate(
      {
        model_tier: current.modelTier,
        bullet_min: current.bulletMin,
        bullet_max: current.bulletMax,
        prompts: recordToPrompts(current.prompts)
      },
      {
        onSuccess: () => toast.success('Settings saved'),
        onError: err => toast.error(err instanceof Error ? err.message : 'Failed to save settings')
      }
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      <div className="rounded-[14px] border p-5 space-y-5">
        <p className="text-[15px] font-medium text-foreground">Generation Model</p>
        <div className="grid grid-cols-2 gap-6">
          <ModelTierSelector value={current.modelTier} onChange={v => setField('modelTier', v)} />
          <BulletRangeInput
            min={current.bulletMin}
            max={current.bulletMax}
            onMinChange={v => setField('bulletMin', v)}
            onMaxChange={v => setField('bulletMax', v)}
          />
        </div>
      </div>

      <div className="rounded-[14px] border p-5 space-y-5">
        <p className="text-[15px] font-medium text-foreground">Generation Prompts</p>
        <PromptsAccordion prompts={current.prompts} onChange={handlePromptChange} />
      </div>

      {isDirty && (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={updateSettings.isPending}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            Discard
          </Button>
        </div>
      )}
    </div>
  );
}
