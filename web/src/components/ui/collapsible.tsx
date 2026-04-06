import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import { ChevronDown } from 'lucide-react';
import type * as React from 'react';
import { cn } from '@/lib/utils';

const Collapsible = CollapsiblePrimitive.Root;

function CollapsibleTrigger({ className, children, ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn(
        'flex w-full cursor-pointer items-center justify-between text-[11px] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:text-foreground [&[data-panel-open]>svg]:rotate-180',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </CollapsiblePrimitive.Trigger>
  );
}

function CollapsiblePanel({ className, ...props }: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-panel"
      className={cn('overflow-hidden transition-[height] duration-200 ease-in-out', className)}
      {...props}
    />
  );
}

export { Collapsible, CollapsiblePanel, CollapsibleTrigger };
