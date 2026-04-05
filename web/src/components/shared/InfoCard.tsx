import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InfoCardProps {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export function InfoCard({ label, children, className }: InfoCardProps) {
  return (
    <div className={cn('rounded-[14px] border bg-card p-5', className)}>
      <div className="mb-3 text-[11px] uppercase tracking-[0.06em] text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

interface InfoRowProps {
  readonly label: string;
  readonly value: string | null | undefined;
  readonly href?: string;
}

export function InfoRow({ label, value, href }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 last:border-b-0">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      {value ? (
        href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-primary hover:underline">
            {value}
          </a>
        ) : (
          <span className="text-[13px] text-foreground">{value}</span>
        )
      ) : (
        <span className="text-[13px] italic text-muted-foreground">Not set</span>
      )}
    </div>
  );
}
