import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useJobDescriptions } from '@/hooks/use-job-descriptions';
import { cn } from '@/lib/utils';

export function JobSelector({ value, onChange }: { value: string | null; onChange: (jobId: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const { data: jobs, isLoading } = useJobDescriptions();

  const selected = value ? (jobs ?? []).find(j => j.id === value) : null;
  const label = selected ? `${selected.title} — ${selected.companyName}` : null;

  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Job Description</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={<Button variant="outline" className="w-full justify-between font-normal" disabled={isLoading} />}
        >
          <span className="truncate">{isLoading ? 'Loading jobs...' : (label ?? 'Select a job description...')}</span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[--anchor-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search jobs..." />
            <CommandList>
              <CommandEmpty>No jobs found.</CommandEmpty>
              <CommandGroup>
                {(jobs ?? []).map(job => (
                  <CommandItem
                    key={job.id}
                    value={`${job.title} ${job.companyName}`}
                    onSelect={() => {
                      onChange(job.id === value ? null : job.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-3.5 w-3.5', value === job.id ? 'opacity-100' : 'opacity-0')} />
                    {job.title} — {job.companyName}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
