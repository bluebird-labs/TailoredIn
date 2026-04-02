import { Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Headline = { id: string; summaryText: string };

type HeadlineSwapModalProps = {
  open: boolean;
  onClose: () => void;
  headlines: Headline[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function HeadlineSwapModal({ open, onClose, headlines, selectedId, onSelect }: HeadlineSwapModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Headline</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          {headlines.map(h => {
            const isSelected = h.id === selectedId;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  onSelect(h.id);
                  onClose();
                }}
                className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                  isSelected ? 'border-[#6366f1] bg-[#eef2ff]' : 'border-[#e5e7eb] hover:border-[#c7d2fe]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 text-[13px] text-[#374151] leading-relaxed">{h.summaryText}</div>
                  {isSelected && <Check className="w-4 h-4 text-[#6366f1] shrink-0 mt-0.5" />}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
