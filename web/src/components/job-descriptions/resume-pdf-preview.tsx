import { FileText, Loader2, Maximize2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type ResumeTheme, useCachedResumePdf, useGenerateResumePdf } from '@/hooks/use-resume';

const THEME_OPTIONS: { value: ResumeTheme; label: string }[] = [
  { value: 'brilliant-cv', label: 'Brilliant CV' },
  { value: 'imprecv', label: 'ImpresCV' },
  { value: 'modern-cv', label: 'Modern CV' },
  { value: 'linked-cv', label: 'Linked CV' }
];

export function ResumePdfPreview({
  jobDescriptionId,
  hasCachedPdf,
  resumePdfTheme,
  refreshKey = 0
}: {
  jobDescriptionId: string;
  hasCachedPdf: boolean;
  resumePdfTheme: string | null;
  refreshKey?: number;
}) {
  const generatePdf = useGenerateResumePdf();
  const cachedPdf = useCachedResumePdf(jobDescriptionId, hasCachedPdf);

  const [theme, setTheme] = useState<ResumeTheme>((resumePdfTheme as ResumeTheme) ?? 'brilliant-cv');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [fullPage, setFullPage] = useState(false);
  const prevBlobRef = useRef<string | null>(null);
  const hasGeneratedRef = useRef(false);
  const lastRefreshKeyRef = useRef(refreshKey);

  useEffect(() => {
    return () => {
      if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
    };
  }, []);

  // Auto-display cached PDF when it loads
  useEffect(() => {
    if (cachedPdf.data) {
      if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
      const blob = new Blob([cachedPdf.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      prevBlobRef.current = url;
      setPdfBlobUrl(url);
      hasGeneratedRef.current = true;
    }
  }, [cachedPdf.data]);

  const handleGenerate = useCallback(() => {
    generatePdf.mutate(
      { jobDescriptionId, theme },
      {
        onSuccess: arrayBuffer => {
          if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          prevBlobRef.current = url;
          setPdfBlobUrl(url);
          hasGeneratedRef.current = true;
        },
        onError: err => {
          toast.error(err instanceof Error ? err.message : 'PDF generation failed');
        }
      }
    );
  }, [generatePdf, jobDescriptionId, theme]);

  useEffect(() => {
    if (refreshKey > 0 && refreshKey !== lastRefreshKeyRef.current && hasGeneratedRef.current) {
      lastRefreshKeyRef.current = refreshKey;
      handleGenerate();
    }
  }, [refreshKey, handleGenerate]);

  const isLoading = generatePdf.isPending || cachedPdf.isLoading;

  const themeSelector = (
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
  );

  const generateButton = (
    <Button size="sm" onClick={handleGenerate} disabled={generatePdf.isPending}>
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
  );

  const placeholder = (
    <div className="flex flex-1 items-center justify-center border rounded-lg bg-muted/30">
      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-[13px] text-muted-foreground">
            {cachedPdf.isLoading ? 'Loading PDF…' : 'Generating PDF…'}
          </p>
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground">Click "Generate PDF" to preview</p>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-4 sticky top-5" style={{ height: 'calc(100vh - 40px)' }}>
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-foreground">PDF Preview</p>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setFullPage(true)}
            disabled={!pdfBlobUrl}
            title="View full page"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {themeSelector}
          {generateButton}
        </div>

        {pdfBlobUrl ? (
          <iframe src={pdfBlobUrl} title="Resume PDF preview" className="w-full flex-1 border rounded-lg" />
        ) : (
          placeholder
        )}
      </div>

      <Dialog open={fullPage} onOpenChange={setFullPage}>
        <DialogContent
          showCloseButton
          className="fixed inset-4 flex w-auto max-w-none -translate-x-0 -translate-y-0 flex-col sm:max-w-none"
        >
          <DialogTitle className="sr-only">Resume PDF Preview</DialogTitle>
          <div className="flex items-center gap-2">
            {themeSelector}
            {generateButton}
          </div>
          {pdfBlobUrl ? (
            <iframe src={pdfBlobUrl} title="Resume PDF preview" className="flex-1 w-full border rounded-lg" />
          ) : (
            <div className="flex flex-1 items-center justify-center border rounded-lg bg-muted/30">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-[13px] text-muted-foreground">
                    {cachedPdf.isLoading ? 'Loading PDF…' : 'Generating PDF…'}
                  </p>
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">Click "Generate PDF" to preview</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
