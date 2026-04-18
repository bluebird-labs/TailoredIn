import { cn } from '@/lib/utils';

interface FieldErrorProps {
  readonly message?: string;
  readonly className?: string;
}

function FieldError({ message, className }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p data-slot="field-error" className={cn('text-destructive text-xs mt-1', className)}>
      {message}
    </p>
  );
}

export type { FieldErrorProps };
export { FieldError };
