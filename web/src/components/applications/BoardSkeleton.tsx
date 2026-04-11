import { Skeleton } from '@/components/ui/skeleton';

function ColumnSkeleton({ cardCount }: { cardCount: number }) {
  return (
    <div className="flex w-[280px] min-w-[280px] shrink-0 flex-col rounded-[14px] border bg-muted/30">
      <div className="border-b p-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
      </div>
      <div className="flex flex-col gap-2 p-2">
        {Array.from({ length: cardCount }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders never reorder
          <Skeleton key={i} className="h-[80px] rounded-[14px]" />
        ))}
      </div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      <ColumnSkeleton cardCount={2} />
      <ColumnSkeleton cardCount={3} />
      <ColumnSkeleton cardCount={1} />
      <ColumnSkeleton cardCount={2} />
      <ColumnSkeleton cardCount={1} />
    </div>
  );
}
