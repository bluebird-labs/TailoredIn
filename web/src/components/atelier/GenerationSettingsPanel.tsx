import { useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking';
import {
  promptsToRecord,
  recordToPrompts,
  useGenerationSettings,
  useUpdateGenerationSettings
} from '@/hooks/use-generation-settings';
import { BulletRangeInput } from './BulletRangeInput.js';
import { ModelTierSelector } from './ModelTierSelector.js';
import { PromptsAccordion } from './PromptsAccordion.js';

type SettingsForm = {
  modelTier: 'fast' | 'balanced' | 'best';
  bulletMin: number;
  bulletMax: number;
  prompts: Record<'resume' | 'headline' | 'experience', string>;
};

export function GenerationSettingsPanel() {
  const { data: settings, isLoading } = useGenerationSettings();
  const updateSettings = useUpdateGenerationSettings();

  const savedState = useMemo<SettingsForm>(
    () =>
      settings
        ? {
            modelTier: settings.modelTier as SettingsForm['modelTier'],
            bulletMin: settings.bulletMin,
            bulletMax: settings.bulletMax,
            prompts: promptsToRecord(settings.prompts)
          }
        : { modelTier: 'balanced', bulletMin: 2, bulletMax: 5, prompts: { resume: '', headline: '', experience: '' } },
    [settings]
  );

  const { current, isDirty, setField, reset } = useDirtyTracking(savedState);

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

  if (isLoading) {
    return (
      <div className="flex h-full w-[280px] shrink-0 flex-col border-r">
        <div className="flex-1 space-y-5 p-5">
          <p className="text-[14px] font-medium text-foreground">Settings</p>
          <div className="space-y-4">
            <div className="h-8 animate-pulse rounded-lg bg-muted" />
            <div className="h-8 animate-pulse rounded-lg bg-muted" />
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r">
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <p className="text-[14px] font-medium text-foreground">Settings</p>
        <ModelTierSelector value={current.modelTier} onChange={v => setField('modelTier', v)} />
        <Separator />
        <BulletRangeInput
          min={current.bulletMin}
          max={current.bulletMax}
          onMinChange={v => setField('bulletMin', v)}
          onMaxChange={v => setField('bulletMax', v)}
        />
        <Separator />
        <PromptsAccordion prompts={current.prompts} onChange={handlePromptChange} />
      </div>
      <div className="flex items-center gap-2 border-t px-5 py-3">
        <Button size="sm" onClick={handleSave} disabled={!isDirty || updateSettings.isPending}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={reset} disabled={!isDirty}>
          Discard
        </Button>
      </div>
    </div>
  );
}
