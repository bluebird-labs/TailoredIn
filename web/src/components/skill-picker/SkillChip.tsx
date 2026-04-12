import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SkillChipProps {
  readonly label: string;
  readonly onRemove?: () => void;
  readonly disabled?: boolean;
}

export function SkillChip({ label, onRemove, disabled }: SkillChipProps) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      <span className="text-xs">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted-foreground/20 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          aria-label={`Remove ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}
