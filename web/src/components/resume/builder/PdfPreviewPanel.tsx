import { Download, FileWarning, Loader2 } from 'lucide-react';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useCallback, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type PdfPreviewPanelProps = {
  pdfData: Uint8Array | null;
  isCompiling: boolean;
  error: string | null;
};

export function PdfPreviewPanel({ pdfData, isCompiling, error }: PdfPreviewPanelProps) {
  const [pageCount, setPageCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef(0);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setPageCount(numPages);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollTopRef.current;
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!pdfData) return;
    const blob = new Blob([pdfData.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume-preview.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }, [pdfData]);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      scrollTopRef.current = scrollRef.current.scrollTop;
    }
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-8">
        <FileWarning className="w-10 h-10" />
        <p className="text-sm text-center max-w-[300px]">{error}</p>
      </div>
    );
  }

  if (!pdfData && !isCompiling) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-8">
        <p className="text-sm">Edit your resume to see a preview</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <span className="text-xs text-muted-foreground font-medium">
          {pageCount > 0 ? `${pageCount} page${pageCount !== 1 ? 's' : ''}` : 'PDF Preview'}
        </span>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!pdfData}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </div>

      {/* PDF pages */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-muted/50 relative">
        {/* Loading overlay */}
        {isCompiling && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/80 rounded-lg px-4 py-2 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Compiling...
            </div>
          </div>
        )}

        {pdfData && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Document file={{ data: pdfData }} onLoadSuccess={onDocumentLoadSuccess} loading={null}>
              {Array.from({ length: pageCount }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: PDF pages are inherently ordered by index
                <div key={i} className="shadow-md rounded-sm overflow-hidden mb-4 last:mb-0">
                  <Page pageNumber={i + 1} width={550} renderTextLayer={false} renderAnnotationLayer={false} />
                </div>
              ))}
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}
