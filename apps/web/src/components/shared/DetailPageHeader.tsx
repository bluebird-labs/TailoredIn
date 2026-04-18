import type { ReactNode } from 'react';

interface DetailPageHeaderProps {
  readonly logo: ReactNode;
  readonly title: string;
  readonly meta: ReactNode;
  readonly actions: ReactNode;
}

export function DetailPageHeader({ logo, title, meta, actions }: DetailPageHeaderProps) {
  return (
    <div className="flex items-start gap-4">
      {logo}
      <div className="flex-1">
        <h1 className="text-[22px] font-medium leading-tight tracking-[-0.01em]">{title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2">{meta}</div>
      </div>
      <div className="flex flex-shrink-0 gap-2">{actions}</div>
    </div>
  );
}

export function MetaBadge({ children }: { readonly children: ReactNode }) {
  return <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">{children}</span>;
}

export function MetaDot() {
  return <span className="h-[3px] w-[3px] rounded-full bg-border" />;
}

export function MetaText({ children }: { readonly children: ReactNode }) {
  return <span className="text-[13px] text-muted-foreground">{children}</span>;
}
