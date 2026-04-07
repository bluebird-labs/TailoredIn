import { Minus, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function BulletRangePill({
  min,
  max,
  isOverridden,
  onSave,
  onReset
}: {
  min: number;
  max: number;
  isOverridden: boolean;
  onSave: (min: number, max: number) => void;
  onReset?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editMin, setEditMin] = useState(min);
  const [editMax, setEditMax] = useState(max);
  const didResetRef = useRef(false);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setEditMin(min);
      setEditMax(max);
      didResetRef.current = false;
    } else if (!didResetRef.current && (editMin !== min || editMax !== max)) {
      onSave(editMin, editMax);
    }
    setOpen(nextOpen);
  }

  const label = min === max ? `${min}` : `${min}–${max}`;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={<button type="button" />}
        className={cn(
          'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] transition-colors hover:bg-accent/40',
          isOverridden ? 'border-primary/60 text-accent-foreground' : 'border-border text-muted-foreground'
        )}
        title={isOverridden ? 'Overridden bullet range (click to edit)' : 'Default bullet range (click to override)'}
      >
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-auto shadow-none ring-1 ring-border" align="start" sideOffset={6}>
        <div className="flex gap-4">
          <Stepper
            label="Min"
            value={editMin}
            onDecrement={() => setEditMin(v => Math.max(1, v - 1))}
            onIncrement={() => setEditMin(v => Math.min(editMax, v + 1))}
            decrementDisabled={editMin <= 1}
            incrementDisabled={editMin >= editMax}
          />
          <Stepper
            label="Max"
            value={editMax}
            onDecrement={() => setEditMax(v => Math.max(editMin, v - 1))}
            onIncrement={() => setEditMax(v => Math.min(20, v + 1))}
            decrementDisabled={editMax <= editMin}
            incrementDisabled={editMax >= 20}
          />
        </div>
        {isOverridden && onReset && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                didResetRef.current = true;
                onReset();
                setOpen(false);
              }}
              className="text-[11px] text-muted-foreground transition-colors hover:text-destructive"
            >
              Reset to default
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function Stepper({
  label,
  value,
  onDecrement,
  onIncrement,
  decrementDisabled,
  incrementDisabled
}: {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementDisabled: boolean;
  incrementDisabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] tracking-wide text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-xs" onClick={onDecrement} disabled={decrementDisabled}>
          <Minus className="size-3" />
        </Button>
        <span className="w-5 text-center text-[13px] tabular-nums">{value}</span>
        <Button variant="ghost" size="icon-xs" onClick={onIncrement} disabled={incrementDisabled}>
          <Plus className="size-3" />
        </Button>
      </div>
    </div>
  );
}
