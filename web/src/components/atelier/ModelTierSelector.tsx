import { cn } from '@/lib/utils';

type ModelTier = 'fast' | 'balanced' | 'best';

const TIERS: { value: ModelTier; label: string }[] = [
  { value: 'fast', label: 'Fast' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'best', label: 'Best' }
];

export function ModelTierSelector({ value, onChange }: { value: ModelTier; onChange: (tier: ModelTier) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Model Tier</p>
      <div className="flex rounded-lg border border-input bg-muted p-0.5">
        {TIERS.map(tier => (
          <button
            key={tier.value}
            type="button"
            onClick={() => onChange(tier.value)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-[13px] transition-colors',
              value === tier.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tier.label}
          </button>
        ))}
      </div>
    </div>
  );
}
