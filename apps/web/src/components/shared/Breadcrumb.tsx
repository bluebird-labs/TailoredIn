import { Link } from '@tanstack/react-router';

interface BreadcrumbProps {
  readonly parentLabel: string;
  readonly parentTo: string;
  readonly current: string;
}

export function Breadcrumb({ parentLabel, parentTo, current }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-[13px]">
      <Link to={parentTo} className="text-primary hover:underline">
        {parentLabel}
      </Link>
      <span className="text-border">/</span>
      <span className="text-muted-foreground">{current}</span>
    </nav>
  );
}
