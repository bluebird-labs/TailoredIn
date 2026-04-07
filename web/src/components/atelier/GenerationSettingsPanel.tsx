import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BulletRangeInput } from './BulletRangeInput.js';
import { ModelTierSelector } from './ModelTierSelector.js';
import { MOCK_SETTINGS } from './mock-data.js';
import { PromptsAccordion } from './PromptsAccordion.js';

export function GenerationSettingsPanel() {
  const [modelTier, setModelTier] = useState(MOCK_SETTINGS.modelTier);
  const [bulletMin, setBulletMin] = useState(MOCK_SETTINGS.bulletMin);
  const [bulletMax, setBulletMax] = useState(MOCK_SETTINGS.bulletMax);
  const [prompts, setPrompts] = useState(MOCK_SETTINGS.prompts);

  function handlePromptChange(scope: 'resume' | 'headline' | 'experience', value: string) {
    setPrompts(prev => ({ ...prev, [scope]: value }));
  }

  function handleSave() {
    toast.success('Settings saved');
  }

  function handleDiscard() {
    setModelTier(MOCK_SETTINGS.modelTier);
    setBulletMin(MOCK_SETTINGS.bulletMin);
    setBulletMax(MOCK_SETTINGS.bulletMax);
    setPrompts(MOCK_SETTINGS.prompts);
  }

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r">
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <p className="text-[14px] font-medium text-foreground">Settings</p>
        <ModelTierSelector value={modelTier} onChange={setModelTier} />
        <Separator />
        <BulletRangeInput min={bulletMin} max={bulletMax} onMinChange={setBulletMin} onMaxChange={setBulletMax} />
        <Separator />
        <PromptsAccordion prompts={prompts} onChange={handlePromptChange} />
      </div>
      <div className="flex items-center gap-2 border-t px-5 py-3">
        <Button size="sm" onClick={handleSave}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDiscard}>
          Discard
        </Button>
      </div>
    </div>
  );
}
