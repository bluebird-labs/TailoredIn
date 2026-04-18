import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  readonly message: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly className?: string;
}

function EmptyState({ message, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div data-slot="empty-state" className={cn('flex flex-col items-center justify-center py-12 gap-3', className)}>
      <p className="text-sm text-muted-foreground">{message}</p>
      {actionLabel && onAction && (
        <Button variant="default" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export type { EmptyStateProps };
export { EmptyState };
