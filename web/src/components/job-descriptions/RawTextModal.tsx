import { FileUp, Loader2, Type } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { FormModal } from '@/components/shared/FormModal.js';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useExtractText } from '@/hooks/use-job-descriptions';

interface Props {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (text: string) => void;
  readonly isProcessing: boolean;
}

type SourceMode = 'file' | 'text';

export function RawTextModal({ open, onOpenChange, onSubmit, isProcessing }: Props) {
  const [sourceMode, setSourceMode] = useState<SourceMode>('text');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractText = useExtractText();

  const hasInput = sourceMode === 'text' ? pastedText.trim().length > 0 : selectedFile !== null;
  const isBusy = isExtracting || isProcessing;

  function resetState() {
    setSourceMode('text');
    setPastedText('');
    setSelectedFile(null);
    setIsExtracting(false);
  }

  function handleSubmit() {
    if (sourceMode === 'text' && pastedText.trim()) {
      onSubmit(pastedText.trim());
    } else if (sourceMode === 'file' && selectedFile) {
      setIsExtracting(true);
      extractText.mutate(selectedFile, {
        onSuccess: text => {
          setIsExtracting(false);
          onSubmit(text);
        },
        onError: () => {
          setIsExtracting(false);
          toast.error('Failed to extract text from file — try pasting the text instead.');
        }
      });
    }
  }

  return (
    <FormModal
      open={open}
      onOpenChange={next => {
        if (!next) resetState();
        onOpenChange(next);
      }}
      title="Provide Job Description Text"
      description="Paste or upload the raw job description text to reparse this job."
      dirtyCount={hasInput ? 1 : 0}
      isSaving={isBusy}
      onSave={handleSubmit}
      onDiscard={resetState}
      saveLabel="Reparse"
      savingLabel="Reparsing..."
      saveDisabled={!hasInput}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={sourceMode === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSourceMode('text')}
            disabled={isBusy}
          >
            <Type className="h-3.5 w-3.5 mr-1.5" />
            Paste text
          </Button>
          <Button
            variant={sourceMode === 'file' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSourceMode('file')}
            disabled={isBusy}
          >
            <FileUp className="h-3.5 w-3.5 mr-1.5" />
            Upload file
          </Button>
        </div>

        {sourceMode === 'text' && (
          <div className="space-y-1.5">
            <Label>Job description text</Label>
            <Textarea
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder="Paste the job description here..."
              rows={10}
              disabled={isBusy}
            />
          </div>
        )}

        {sourceMode === 'file' && (
          <div className="space-y-1.5">
            <Label>Upload a file</Label>
            <button
              type="button"
              className="w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                className="hidden"
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {isBusy ? (
                <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
              ) : (
                <FileUp className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              )}
              {selectedFile ? (
                <p className="text-sm">{selectedFile.name}</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Click to select a file</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, TXT, or Markdown</p>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </FormModal>
  );
}
