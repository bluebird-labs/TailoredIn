import type { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  readonly title: string;
  readonly description: string;
  readonly confirmLabel?: string;
  readonly confirmVariant?: 'destructive' | 'default';
  readonly onConfirm: () => void | Promise<void>;
  readonly onCancel?: () => void;
  readonly trigger: ReactNode;
}

function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Delete',
  confirmVariant = 'destructive',
  onConfirm,
  onCancel,
  trigger
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export type { ConfirmDialogProps };
export { ConfirmDialog };
