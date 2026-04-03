import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateHeadline, useDeleteHeadline, useHeadlines, useUpdateHeadline } from '@/hooks/use-headlines';
import { useProfile } from '@/hooks/use-profile';

type Headline = {
  id: string;
  label: string;
  summaryText: string;
  roleTags: { id: string; name: string; dimension: string }[];
};

export function HeadlineTab() {
  const { data: headlines = [], isLoading } = useHeadlines();
  const { data: profile } = useProfile();
  const createHeadline = useCreateHeadline();
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newSummaryText, setNewSummaryText] = useState('');

  function handleAdd() {
    if (!newLabel.trim()) {
      toast.error('Label is required');
      return;
    }
    if (!profile?.id) {
      toast.error('Profile not loaded');
      return;
    }
    createHeadline.mutate(
      { profile_id: profile.id, label: newLabel.trim(), summary_text: newSummaryText.trim() },
      {
        onSuccess: () => {
          setAdding(false);
          setNewLabel('');
          setNewSummaryText('');
        },
        onError: () => toast.error('Failed to create headline')
      }
    );
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-3">
      {(headlines as Headline[]).map(h => (
        <HeadlineCard key={h.id} headline={h} />
      ))}

      {adding ? (
        <div className="border border-indigo-300 rounded-lg p-3 space-y-2">
          <Input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Headline label (e.g. Staff Engineer)"
            className="text-sm"
          />
          <Textarea
            value={newSummaryText}
            onChange={e => setNewSummaryText(e.target.value)}
            placeholder="1–3 sentence professional summary..."
            className="text-sm min-h-16 resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={createHeadline.isPending}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setAdding(true)}>
          <Plus className="h-3 w-3 mr-1" />
          Add headline variant
        </Button>
      )}
    </div>
  );
}

function HeadlineCard({ headline }: { headline: Headline }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(headline.label);
  const [summaryText, setSummaryText] = useState(headline.summaryText);
  const update = useUpdateHeadline();
  const del = useDeleteHeadline();

  function handleSave() {
    update.mutate(
      { id: headline.id, label, summary_text: summaryText },
      {
        onSuccess: () => setEditing(false),
        onError: () => toast.error('Failed to update headline')
      }
    );
  }

  if (editing) {
    return (
      <div className="border border-indigo-300 rounded-lg p-3 space-y-2">
        <Input value={label} onChange={e => setLabel(e.target.value)} className="font-medium text-sm" />
        <Textarea
          value={summaryText}
          onChange={e => setSummaryText(e.target.value)}
          className="text-sm min-h-16 resize-none"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={update.isPending}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 flex items-start justify-between gap-2 group">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-sm">{headline.label}</span>
          {headline.roleTags.map(tag => (
            <Badge key={tag.id} variant="outline" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{headline.summaryText}</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive"
          onClick={() => del.mutate(headline.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
