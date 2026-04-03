import { Upload, Wand2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTailoredResumeFromText, useExtractTextFromFile } from '@/hooks/use-factory';

type Props = {
  onGenerated: (resumeId: string) => void;
};

export function FactoryInputStep({ onGenerated }: Props) {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extract = useExtractTextFromFile();
  const generate = useCreateTailoredResumeFromText();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    extract.mutate(file, {
      onSuccess: extracted => setText(extracted),
      onError: () => toast.error('Could not extract text from file')
    });
  }

  function handleGenerate() {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error('Enter a job description or describe your target role');
      return;
    }
    generate.mutate(trimmed, {
      onSuccess: resume => {
        if (resume?.id) onGenerated(resume.id);
      },
      onError: () => toast.error('Failed to generate resume')
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Generate a tailored resume</h2>
        <p className="text-sm text-muted-foreground">
          Paste a job description, a URL description, or just describe the role you're targeting. The factory reads your
          wardrobe and writes a resume.
        </p>
      </div>

      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste a job description here, or write: 'Focus on my infrastructure and distributed systems work for a senior SRE role at a fintech company.'"
        className="min-h-48 resize-none text-sm"
      />

      <div className="flex items-center gap-3">
        <Button
          onClick={handleGenerate}
          disabled={generate.isPending || !text.trim()}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          {generate.isPending ? (
            <>Generating...</>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Resume
            </>
          )}
        </Button>

        <span className="text-muted-foreground text-xs">or</span>

        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={extract.isPending}>
          <Upload className="h-3 w-3 mr-1" />
          {extract.isPending ? 'Extracting...' : 'Upload JD (PDF)'}
        </Button>
        <input ref={fileInputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  );
}
