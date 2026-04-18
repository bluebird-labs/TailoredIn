import { Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

const ARCHIVE_REASONS = ['Role closed', 'Position filled', 'No longer interested', 'Company not a fit'] as const;

const WITHDRAW_REASONS = [
  'Accepted another offer',
  'Compensation mismatch',
  'Role not as described',
  'No longer interested'
] as const;

interface StatusReasonDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: (reason: string) => void;
  readonly status: 'archived' | 'withdrawn';
  readonly isPending: boolean;
}

export function StatusReasonDialog({ open, onOpenChange, onConfirm, status, isPending }: StatusReasonDialogProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const presets = status === 'archived' ? ARCHIVE_REASONS : WITHDRAW_REASONS;
  const title = status === 'archived' ? 'Archive application' : 'Withdraw application';
  const description =
    status === 'archived' ? 'Why are you archiving this application?' : 'Why are you withdrawing this application?';
  const confirmLabel = status === 'archived' ? 'Archive' : 'Withdraw';

  const reason = useCustom ? customReason.trim() : selected;
  const canConfirm = !!reason && !isPending;

  function reset() {
    setSelected(null);
    setCustomReason('');
    setUseCustom(false);
  }

  function handlePresetClick(preset: string) {
    setUseCustom(false);
    setSelected(preset === selected ? null : preset);
  }

  function handleCustomFocus() {
    setUseCustom(true);
    setSelected(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {presets.map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              disabled={isPending}
              className={`rounded-[10px] border px-3 py-2 text-left text-sm transition-colors ${
                selected === preset && !useCustom
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border bg-card text-card-foreground hover:bg-accent/40'
              } ${isPending ? 'opacity-50' : ''}`}
            >
              {preset}
            </button>
          ))}

          <Textarea
            placeholder="Other reason..."
            value={customReason}
            onChange={e => {
              setCustomReason(e.target.value);
              if (!useCustom) setUseCustom(true);
              setSelected(null);
            }}
            onFocus={handleCustomFocus}
            disabled={isPending}
            rows={2}
            className={`mt-1 resize-none ${useCustom && customReason.trim() ? 'border-primary' : ''}`}
          />
        </div>

        <DialogFooter>
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={() => reason && onConfirm(reason)} disabled={!canConfirm}>
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {isPending ? `${confirmLabel === 'Archive' ? 'Archiving' : 'Withdrawing'}...` : confirmLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
