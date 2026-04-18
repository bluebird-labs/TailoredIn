import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';

type PromptScope = 'resume' | 'headline' | 'experience';

const SCOPES: { value: PromptScope; label: string }[] = [
  { value: 'resume', label: 'Resume' },
  { value: 'headline', label: 'Headline' },
  { value: 'experience', label: 'Experience' }
];

export function PromptsAccordion({
  prompts,
  onChange
}: {
  prompts: Record<PromptScope, string>;
  onChange: (scope: PromptScope, value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Prompts</p>
      <div className="space-y-1">
        {SCOPES.map(scope => (
          <Collapsible key={scope.value} defaultOpen={scope.value === 'resume'}>
            <div className="rounded-lg border px-3 py-2">
              <CollapsibleTrigger className="text-[13px] normal-case tracking-normal text-foreground">
                {scope.label}
              </CollapsibleTrigger>
              <CollapsiblePanel>
                <div className="pt-2">
                  <Textarea
                    placeholder={`${scope.label} generation instructions...`}
                    value={prompts[scope.value]}
                    onChange={e => onChange(scope.value, e.target.value)}
                    className="text-[13px] min-h-[72px] resize-none"
                  />
                </div>
              </CollapsiblePanel>
            </div>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
