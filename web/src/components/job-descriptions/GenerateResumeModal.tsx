import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHeadlines } from '@/hooks/use-headlines';

interface GenerateResumeModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

function GenerateResumeModal({ open, onOpenChange }: GenerateResumeModalProps) {
  const [selectedHeadlineId, setSelectedHeadlineId] = useState<string | null>(null);
  const { data: headlines = [] } = useHeadlines();

  function handleOpenChange(next: boolean) {
    if (!next) setSelectedHeadlineId(null);
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Resume</DialogTitle>
          <DialogDescription>Select a headline to use for this resume.</DialogDescription>
        </DialogHeader>

        <Select value={selectedHeadlineId ?? undefined} onValueChange={v => setSelectedHeadlineId(v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a headline">
              {headlines.find(h => h.id === selectedHeadlineId)?.label ?? ''}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {headlines.map(headline => (
              <SelectItem key={headline.id} value={headline.id}>
                <div className="flex flex-col gap-0.5">
                  <span>{headline.label}</span>
                  {headline.summaryText && (
                    <span className="text-xs text-muted-foreground line-clamp-2">{headline.summaryText}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={selectedHeadlineId === null} onClick={() => {}}>
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { GenerateResumeModalProps };
export { GenerateResumeModal };
