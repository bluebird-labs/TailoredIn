import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface FormModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description?: string;
  readonly children: React.ReactNode;
  readonly dirtyCount: number;
  readonly isSaving: boolean;
  readonly onSave: () => void | Promise<void>;
  readonly onDiscard: () => void;
  readonly saveLabel?: string;
  readonly savingLabel?: string;
  readonly saveDisabled?: boolean;
  readonly backAction?: () => void;
  readonly overlayClassName?: string;
}

function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  dirtyCount,
  isSaving,
  onSave,
  onDiscard,
  saveLabel,
  savingLabel,
  saveDisabled,
  backAction,
  overlayClassName
}: FormModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleClose() {
    if (dirtyCount > 0) {
      setConfirmOpen(true);
    } else {
      onOpenChange(false);
    }
  }

  function handleConfirmDiscard() {
    setConfirmOpen(false);
    onDiscard();
    onOpenChange(false);
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={next => {
          if (!next) {
            handleClose();
          }
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-lg" overlayClassName={overlayClassName}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto">{children}</div>

          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              <div>
                {backAction && (
                  <Button variant="ghost" size="sm" onClick={backAction} disabled={isSaving}>
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button size="sm" onClick={onSave} disabled={(saveDisabled ?? dirtyCount === 0) || isSaving}>
                  {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  {isSaving ? (savingLabel ?? 'Saving...') : (saveLabel ?? 'Save')}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have {dirtyCount} unsaved {dirtyCount === 1 ? 'change' : 'changes'} that will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDiscard}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export type { FormModalProps };
export { FormModal };
