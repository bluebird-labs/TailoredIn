import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function BulletRangePill({
  min,
  max,
  isOverridden,
  onSave
}: {
  min: number;
  max: number;
  isOverridden: boolean;
  onSave: (min: number, max: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editMin, setEditMin] = useState(min);
  const [editMax, setEditMax] = useState(max);
  const containerRef = useRef<HTMLFieldSetElement>(null);

  useEffect(() => {
    if (!editing) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onSave(editMin, editMax);
        setEditing(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editing, editMin, editMax, onSave]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      onSave(editMin, editMax);
      setEditing(false);
    }
    if (e.key === 'Escape') {
      setEditMin(min);
      setEditMax(max);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <fieldset ref={containerRef} className="flex items-center gap-1 border-0 p-0 m-0" onKeyDown={handleKeyDown}>
        <Input
          type="number"
          min={1}
          max={20}
          value={editMin}
          onChange={e => setEditMin(Number(e.target.value))}
          className="h-5 w-10 px-1 text-[11px] text-center"
          autoFocus
        />
        <span className="text-[11px] text-muted-foreground">–</span>
        <Input
          type="number"
          min={1}
          max={20}
          value={editMax}
          onChange={e => setEditMax(Number(e.target.value))}
          className="h-5 w-10 px-1 text-[11px] text-center"
        />
      </fieldset>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setEditMin(min);
        setEditMax(max);
        setEditing(true);
      }}
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] transition-colors hover:bg-accent/40',
        isOverridden ? 'border-primary/60 text-accent-foreground' : 'border-border text-muted-foreground'
      )}
      title={isOverridden ? 'Overridden bullet range (click to edit)' : 'Default bullet range (click to override)'}
    >
      {min}–{max}
    </button>
  );
}
