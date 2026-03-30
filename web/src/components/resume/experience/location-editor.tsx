import { Plus, X } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReplaceLocations } from '@/hooks/use-companies';

type Location = {
  label: string;
  ordinal: number;
};

type LocationEditorProps = {
  companyId: string;
  locations: Location[];
};

export function LocationEditor({ companyId, locations }: LocationEditorProps) {
  const sorted = [...locations].sort((a, b) => a.ordinal - b.ordinal);
  const replaceLocations = useReplaceLocations();
  const [newLabel, setNewLabel] = useState('');
  const [showInput, setShowInput] = useState(false);

  function handleAdd() {
    const label = newLabel.trim();
    if (!label) return;
    const ordinal = sorted.length > 0 ? Math.max(...sorted.map(l => l.ordinal)) + 1 : 0;
    replaceLocations.mutate({
      companyId,
      locations: [...sorted, { label, ordinal }]
    });
    setNewLabel('');
    setShowInput(false);
  }

  function handleRemove(index: number) {
    const updated = sorted.filter((_, i) => i !== index).map((loc, i) => ({ label: loc.label, ordinal: i }));
    replaceLocations.mutate({ companyId, locations: updated });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      setShowInput(false);
      setNewLabel('');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sorted.map((loc, index) => (
        <Badge key={loc.label} variant="secondary" className="gap-1 pr-1">
          {loc.label}
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => handleRemove(index)}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {showInput ? (
        <Input
          className="h-6 w-32 text-xs"
          placeholder="Location..."
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (!newLabel.trim()) setShowInput(false);
          }}
          autoFocus
        />
      ) : (
        <Button variant="ghost" size="icon-xs" onClick={() => setShowInput(true)}>
          <Plus className="size-3" />
        </Button>
      )}
    </div>
  );
}
