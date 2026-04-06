import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { useGenerateResumePdf } from '@/hooks/use-resume';

interface GenerateResumeModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly jobDescriptionId: string;
  readonly jobTitle: string;
  readonly companyName: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function GenerateResumeModal({
  open,
  onOpenChange,
  jobDescriptionId,
  jobTitle,
  companyName
}: GenerateResumeModalProps) {
  const [selectedHeadlineId, setSelectedHeadlineId] = useState<string | null>(null);
  const { data: headlines = [] } = useHeadlines();
  const mutation = useGenerateResumePdf();

  useEffect(() => {
    if (headlines.length === 1 && selectedHeadlineId === null) {
      setSelectedHeadlineId(headlines[0].id);
    }
  }, [headlines, selectedHeadlineId]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSelectedHeadlineId(null);
      mutation.reset();
    }
    onOpenChange(next);
  }

  async function handleGenerate() {
    if (!selectedHeadlineId) return;
    mutation.mutate(
      { jobDescriptionId, headlineId: selectedHeadlineId },
      {
        onSuccess: blob => {
          const date = new Date().toISOString().slice(0, 10);
          const filename = `${slugify(companyName)}-${slugify(jobTitle)}-${date}.pdf`;
          downloadBlob(blob, filename);
          toast.success('Resume downloaded!');
          handleOpenChange(false);
        },
        onError: err => {
          toast.error(err instanceof Error ? err.message : 'Generation failed');
        }
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Resume</DialogTitle>
          <DialogDescription>Select a headline, then generate a tailored resume PDF for this role.</DialogDescription>
        </DialogHeader>

        <Select value={selectedHeadlineId ?? ''} onValueChange={v => setSelectedHeadlineId(v || null)}>
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
          <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button size="sm" disabled={selectedHeadlineId === null || mutation.isPending} onClick={handleGenerate}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Generating…
              </>
            ) : (
              'Generate'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { GenerateResumeModalProps };
export { GenerateResumeModal };
