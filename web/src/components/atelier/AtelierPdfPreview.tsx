import { FileText, Maximize2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const THEME_OPTIONS = [
  { value: 'brilliant-cv', label: 'Brilliant CV' },
  { value: 'imprecv', label: 'ImpresCV' },
  { value: 'modern-cv', label: 'Modern CV' },
  { value: 'linked-cv', label: 'Linked CV' }
];

export function AtelierPdfPreview() {
  const [theme, setTheme] = useState<string | null>('brilliant-cv');

  return (
    <div className="flex h-full w-[35%] shrink-0 flex-col border-l">
      <div className="flex flex-col gap-4 p-5" style={{ height: '100%' }}>
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-foreground">PDF Preview</p>
          <Button variant="ghost" size="icon-sm" disabled title="View full page">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={theme} onValueChange={setTheme}>
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
          <Button size="sm" disabled>
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Generate PDF
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center rounded-lg border bg-muted/30">
          <p className="px-6 text-center text-[13px] text-muted-foreground">
            Select a job and generate content to preview PDF
          </p>
        </div>
      </div>
    </div>
  );
}
