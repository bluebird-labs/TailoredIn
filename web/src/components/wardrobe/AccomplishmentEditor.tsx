import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDeleteAccomplishment, useUpdateAccomplishment } from '@/hooks/use-accomplishments';

type Accomplishment = {
  id: string;
  title: string;
  narrative: string;
  skillTags: string[];
  ordinal: number;
};

type Props = {
  experienceId: string;
  accomplishment: Accomplishment;
};

export function AccomplishmentEditor({ experienceId, accomplishment }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(accomplishment.title);
  const [narrative, setNarrative] = useState(accomplishment.narrative);
  const [tagInput, setTagInput] = useState(accomplishment.skillTags.join(', '));

  const update = useUpdateAccomplishment(experienceId);
  const del = useDeleteAccomplishment(experienceId);

  function handleSave() {
    update.mutate(
      {
        accomplishmentId: accomplishment.id,
        title,
        narrative,
        skill_tags: tagInput
          .split(',')
          .map(t => t.trim())
          .filter(Boolean)
      },
      { onSuccess: () => setEditing(false) }
    );
  }

  if (editing) {
    return (
      <div className="border border-indigo-300 rounded-lg overflow-hidden">
        <div className="bg-indigo-50 px-3 py-2 border-b border-indigo-200 flex gap-2">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="font-medium text-sm h-7"
            placeholder="Accomplishment title"
          />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="p-3 space-y-2">
          <textarea
            value={narrative}
            onChange={e => setNarrative(e.target.value)}
            className="w-full text-sm min-h-24 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Describe what you did, why, and the outcome in detail..."
          />
          <Input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            className="text-xs h-7"
            placeholder="Skill tags (comma-separated): distributed-systems, performance"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden group">
      <div className="bg-muted/30 px-3 py-2 border-b flex items-center justify-between">
        <span className="font-medium text-sm">{accomplishment.title || 'Untitled'}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {accomplishment.skillTags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(true)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-destructive"
            onClick={() => del.mutate(accomplishment.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="p-3 text-sm text-muted-foreground leading-relaxed">
        {accomplishment.narrative || <span className="italic">No narrative yet. Click edit to add one.</span>}
      </div>
    </div>
  );
}
