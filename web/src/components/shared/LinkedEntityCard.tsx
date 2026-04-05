import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

interface LinkedEntityCardProps {
  readonly to: string;
  readonly logo: string;
  readonly name: string;
  readonly meta: string;
}

export function LinkedEntityCard({ to, logo, name, meta }: LinkedEntityCardProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-[14px] border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/40"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent text-[14px] font-medium text-accent-foreground">
        {logo}
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-medium text-foreground">{name}</div>
        <div className="text-[11px] text-muted-foreground">{meta}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
