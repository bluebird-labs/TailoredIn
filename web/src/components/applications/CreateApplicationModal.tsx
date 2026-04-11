import { Check, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { Application } from '@/hooks/use-applications';
import { useCreateApplication } from '@/hooks/use-applications';
import type { JobDescription } from '@/hooks/use-job-descriptions';

interface CreateApplicationModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly profileId: string;
  readonly jobDescriptions: JobDescription[];
  readonly applications: Application[];
}

export function CreateApplicationModal({
  open,
  onOpenChange,
  profileId,
  jobDescriptions,
  applications
}: CreateApplicationModalProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const createApplication = useCreateApplication();

  const appliedJobDescriptionIds = useMemo(
    () => new Set(applications.map(app => app.jobDescriptionId).filter(Boolean)),
    [applications]
  );

  const availableJobs = useMemo(
    () => jobDescriptions.filter(jd => !appliedJobDescriptionIds.has(jd.id)),
    [jobDescriptions, appliedJobDescriptionIds]
  );

  const selectedJob = selectedId ? availableJobs.find(jd => jd.id === selectedId) : undefined;

  function reset() {
    setSearch('');
    setSelectedId(null);
  }

  function handleCreate() {
    if (!selectedJob) return;

    createApplication.mutate(
      { profile_id: profileId, company_id: selectedJob.companyId, job_description_id: selectedJob.id },
      {
        onSuccess: () => {
          toast.success(`Application created for "${selectedJob.title}"`);
          reset();
          onOpenChange(false);
        }
      }
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add application</DialogTitle>
          <DialogDescription>Select a job description to create an application for.</DialogDescription>
        </DialogHeader>

        <Command shouldFilter value={search} onValueChange={setSearch}>
          <CommandInput placeholder="Search job descriptions..." disabled={createApplication.isPending} />
          <CommandList>
            <CommandEmpty>
              {availableJobs.length === 0
                ? 'All job descriptions already have applications.'
                : 'No matching job descriptions.'}
            </CommandEmpty>
            <CommandGroup>
              {availableJobs.map(jd => (
                <CommandItem
                  key={jd.id}
                  value={`${jd.title} ${jd.companyName ?? ''}`}
                  onSelect={() => setSelectedId(jd.id === selectedId ? null : jd.id)}
                  disabled={createApplication.isPending}
                >
                  <div className="flex w-full items-center gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent text-[9px] font-medium">
                      {(jd.companyName ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{jd.title}</p>
                      {jd.companyName && <p className="truncate text-xs text-muted-foreground">{jd.companyName}</p>}
                    </div>
                    {jd.id === selectedId && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            <div />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
                disabled={createApplication.isPending}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={!selectedId || createApplication.isPending}>
                {createApplication.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {createApplication.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
