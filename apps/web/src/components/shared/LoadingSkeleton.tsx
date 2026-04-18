import type React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SkeletonVariant = 'card' | 'list' | 'form' | 'detail';

interface LoadingSkeletonProps {
  readonly variant: SkeletonVariant;
  readonly count?: number;
  readonly className?: string;
}

function CardSkeleton() {
  return (
    <div className="rounded-[14px] border border-border p-5 space-y-3">
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  );
}

function ListSkeleton({ count }: { readonly count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders, no state or reordering
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 4 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders, no state or reordering
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

const variants: Record<SkeletonVariant, React.FC<{ count?: number }>> = {
  card: CardSkeleton,
  list: ({ count = 3 }) => <ListSkeleton count={count} />,
  form: FormSkeleton,
  detail: DetailSkeleton
};

function LoadingSkeleton({ variant, count, className }: LoadingSkeletonProps) {
  const Variant = variants[variant];
  return (
    <div data-slot="loading-skeleton" className={cn('animate-in fade-in duration-300', className)}>
      <Variant count={count} />
    </div>
  );
}

export type { LoadingSkeletonProps, SkeletonVariant };
export { LoadingSkeleton };
