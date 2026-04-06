import { FileText, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHeadlines } from '@/hooks/use-headlines';
import { type ResumeTheme, useGenerateResumePdf } from '@/hooks/use-resume';

const THEME_OPTIONS: { value: ResumeTheme; label: string }[] = [
  { value: 'brilliant-cv', label: 'Brilliant CV' },
  { value: 'imprecv', label: 'ImpresCV' },
  { value: 'modern-cv', label: 'Modern CV' },
  { value: 'linked-cv', label: 'Linked CV' }
];

export function ResumePdfPreview({ jobDescriptionId }: { jobDescriptionId: string }) {
  const { data: headlines } = useHeadlines();
  const generatePdf = useGenerateResumePdf();

  const [theme, setTheme] = useState<ResumeTheme>('brilliant-cv');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const prevBlobRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
    };
  }, []);

  const headlineId = headlines?.[0]?.id;

  function handleGenerate() {
    if (!headlineId) return;
    generatePdf.mutate(
      { jobDescriptionId, headlineId, theme },
      {
        onSuccess: arrayBuffer => {
          if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          prevBlobRef.current = url;
          setPdfBlobUrl(url);
        },
        onError: err => {
          toast.error(err instanceof Error ? err.message : 'PDF generation failed');
        }
      }
    );
  }

  return (
    <div className="space-y-4 sticky top-5">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-foreground">PDF Preview</p>
      </div>

      <div className="flex items-center gap-2">
        <Select value={theme} onValueChange={v => setTheme(v as ResumeTheme)}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEME_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" onClick={handleGenerate} disabled={!headlineId || generatePdf.isPending}>
          {generatePdf.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Generate PDF
            </>
          )}
        </Button>
      </div>

      {pdfBlobUrl ? (
        <iframe
          src={pdfBlobUrl}
          title="Resume PDF preview"
          className="w-full border rounded-lg"
          style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}
        />
      ) : (
        <div
          className="flex items-center justify-center border rounded-lg bg-muted/30"
          style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}
        >
          {generatePdf.isPending ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-[13px] text-muted-foreground">Generating PDF…</p>
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">
              {headlineId ? 'Click "Generate PDF" to preview' : 'No headlines available'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
