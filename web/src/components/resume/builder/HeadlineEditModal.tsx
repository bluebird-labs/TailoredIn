import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type HeadlineEditModalProps = {
  open: boolean;
  onClose: () => void;
  headlineText: string;
  onSave: (text: string) => void;
};

export function HeadlineEditModal({ open, onClose, headlineText, onSave }: HeadlineEditModalProps) {
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (open) {
      setDraft(headlineText);
    }
  }, [open, headlineText]);

  const handleSave = () => {
    const trimmed = draft.trim();
    if (trimmed !== headlineText) {
      onSave(trimmed);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Headline</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="headline-text">Headline</Label>
          <textarea
            id="headline-text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={3}
            placeholder="Enter a headline for your resume..."
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
