import { X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TagInputProps = {
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
};

export function TagInput({ value, onChange, placeholder = 'Add item...' }: TagInputProps) {
  const [input, setInput] = useState('');

  function addTag() {
    const tag = input.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
      setInput('');
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter(v => v !== tag));
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={!input.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}
