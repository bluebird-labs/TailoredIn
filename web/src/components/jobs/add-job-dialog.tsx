import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddJob } from '@/hooks/use-jobs';

type AddJobDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (jobId: string) => void;
};

const urlSchema = z.object({
  url: z.string().url('Please enter a valid URL')
});

const manualSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  companyName: z.string().min(1, 'Company name is required'),
  companyLink: z.string().url('Must be a valid URL'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(1, 'Description is required'),
  salary: z.string().optional(),
  jobType: z.string().optional(),
  remote: z.string().optional(),
  applyLink: z.union([z.string().url('Must be a valid URL'), z.literal('')]).optional()
});

type UrlFormValues = z.infer<typeof urlSchema>;
type ManualFormValues = z.infer<typeof manualSchema>;

function descriptionToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

export function AddJobDialog({ open, onOpenChange, onSuccess }: AddJobDialogProps) {
  const [mode, setMode] = useState<'url' | 'manual'>('url');
  const addJob = useAddJob();

  const urlForm = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: '' }
  });

  const manualForm = useForm<ManualFormValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      jobTitle: '',
      companyName: '',
      companyLink: '',
      location: '',
      description: '',
      salary: '',
      jobType: '',
      remote: '',
      applyLink: ''
    }
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      urlForm.reset();
      manualForm.reset();
      setMode('url');
    }
    onOpenChange(next);
  }

  function onUrlSubmit(values: UrlFormValues) {
    addJob.mutate(
      { mode: 'url', url: values.url },
      {
        onSuccess: res => {
          handleOpenChange(false);
          if (res?.data) onSuccess((res as { data: { id: string } }).data.id);
        }
      }
    );
  }

  function onManualSubmit(values: ManualFormValues) {
    addJob.mutate(
      {
        mode: 'manual',
        fields: {
          jobTitle: values.jobTitle,
          companyName: values.companyName,
          companyLink: values.companyLink,
          location: values.location,
          description: values.description,
          descriptionHtml: descriptionToHtml(values.description),
          salary: values.salary || null,
          jobType: values.jobType || null,
          remote: values.remote || null,
          applyLink: values.applyLink || null
        }
      },
      {
        onSuccess: res => {
          handleOpenChange(false);
          if (res?.data) onSuccess((res as { data: { id: string } }).data.id);
        }
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Job</DialogTitle>
          <DialogDescription>
            Paste a LinkedIn URL to import automatically, or enter details manually.
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === 'url' ? 'default' : 'outline'}
            onClick={() => setMode('url')}
          >
            Paste URL
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'manual' ? 'default' : 'outline'}
            onClick={() => setMode('manual')}
          >
            Enter Manually
          </Button>
        </div>

        {mode === 'url' ? (
          <form onSubmit={urlForm.handleSubmit(onUrlSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aj-url">LinkedIn Job URL</Label>
              <Input id="aj-url" placeholder="https://www.linkedin.com/jobs/view/..." {...urlForm.register('url')} />
              {urlForm.formState.errors.url && (
                <p className="text-sm text-destructive">{urlForm.formState.errors.url.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addJob.isPending}>
                {addJob.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Job'
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aj-title">Job Title</Label>
                <Input id="aj-title" placeholder="Senior Software Engineer" {...manualForm.register('jobTitle')} />
                {manualForm.formState.errors.jobTitle && (
                  <p className="text-sm text-destructive">{manualForm.formState.errors.jobTitle.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="aj-company">Company Name</Label>
                <Input id="aj-company" placeholder="Acme Corp" {...manualForm.register('companyName')} />
                {manualForm.formState.errors.companyName && (
                  <p className="text-sm text-destructive">{manualForm.formState.errors.companyName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aj-companylink">Company LinkedIn URL</Label>
                <Input
                  id="aj-companylink"
                  placeholder="https://www.linkedin.com/company/..."
                  {...manualForm.register('companyLink')}
                />
                {manualForm.formState.errors.companyLink && (
                  <p className="text-sm text-destructive">{manualForm.formState.errors.companyLink.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="aj-location">Location</Label>
                <Input id="aj-location" placeholder="San Francisco, CA" {...manualForm.register('location')} />
                {manualForm.formState.errors.location && (
                  <p className="text-sm text-destructive">{manualForm.formState.errors.location.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aj-description">Description</Label>
              <textarea
                id="aj-description"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Paste the job description..."
                {...manualForm.register('description')}
              />
              {manualForm.formState.errors.description && (
                <p className="text-sm text-destructive">{manualForm.formState.errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aj-salary">Salary</Label>
                <Input id="aj-salary" placeholder="$150k - $200k" {...manualForm.register('salary')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aj-type">Job Type</Label>
                <Input id="aj-type" placeholder="Full-time" {...manualForm.register('jobType')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aj-remote">Remote</Label>
                <Input id="aj-remote" placeholder="Remote / Hybrid" {...manualForm.register('remote')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aj-apply">Apply Link</Label>
              <Input id="aj-apply" placeholder="https://..." {...manualForm.register('applyLink')} />
              {manualForm.formState.errors.applyLink && (
                <p className="text-sm text-destructive">{manualForm.formState.errors.applyLink.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addJob.isPending}>
                {addJob.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Add Job'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
