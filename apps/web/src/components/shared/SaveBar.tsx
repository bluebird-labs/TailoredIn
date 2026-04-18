import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SaveBarProps {
  readonly dirtyCount: number;
  readonly onSave: () => void | Promise<void>;
  readonly onDiscard: () => void;
  readonly isSaving?: boolean;
  readonly className?: string;
  readonly variant?: 'sticky' | 'inline';
}

function SaveBar({ dirtyCount, onSave, onDiscard, isSaving = false, className, variant = 'sticky' }: SaveBarProps) {
  if (variant === 'sticky' && dirtyCount === 0) return null;

  return (
    <div
      data-slot="save-bar"
      className={cn(
        variant === 'sticky'
          ? 'sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t border-border bg-card px-5 py-3 animate-in slide-in-from-bottom-2 duration-200'
          : 'pt-3 mt-3 border-t border-border flex items-center justify-end gap-2',
        className
      )}
    >
      {variant === 'sticky' && (
        <p className="text-sm text-muted-foreground">
          {dirtyCount} unsaved {dirtyCount === 1 ? 'change' : 'changes'}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={isSaving}>
          Discard
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

export type { SaveBarProps };
export { SaveBar };
