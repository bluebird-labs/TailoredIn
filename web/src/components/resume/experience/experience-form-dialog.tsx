import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { api } from '@/lib/api';
import type { Experience } from './types';
import { invalidateExperiences } from './types';

const experienceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  companyName: z.string().min(1, 'Company name is required'),
  companyWebsite: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, 'Select month and year'),
  endDate: z.string().regex(/^\d{4}-\d{2}$/, 'Select month and year'),
  summary: z.string().optional(),
  ordinal: z.coerce.number().int().min(0).optional().default(0)
});

type ExperienceFormValues = z.infer<typeof experienceSchema>;

type ExperienceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience?: Experience | null;
};

export function ExperienceFormDialog({ open, onOpenChange, experience }: ExperienceFormDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: '',
      companyName: '',
      companyWebsite: '',
      location: '',
      startDate: '',
      endDate: '',
      summary: '',
      ordinal: 0
    }
  });

  useEffect(() => {
    if (open) {
      if (experience) {
        reset({
          title: experience.title,
          companyName: experience.companyName,
          companyWebsite: experience.companyWebsite ?? '',
          location: experience.location,
          startDate: experience.startDate,
          endDate: experience.endDate,
          summary: experience.summary ?? '',
          ordinal: experience.ordinal
        });
      } else {
        reset({
          title: '',
          companyName: '',
          companyWebsite: '',
          location: '',
          startDate: '',
          endDate: '',
          summary: '',
          ordinal: 0
        });
      }
    }
  }, [open, experience, reset]);

  const createMutation = useMutation({
    mutationFn: async (values: ExperienceFormValues) =>
      api.experiences.post({
        title: values.title,
        company_name: values.companyName,
        company_website: values.companyWebsite || undefined,
        location: values.location,
        start_date: values.startDate,
        end_date: values.endDate,
        summary: values.summary || undefined,
        ordinal: values.ordinal
      }),
    onSuccess: () => {
      invalidateExperiences(queryClient);
      onOpenChange(false);
      toast.success('Experience created');
    },
    onError: () => toast.error('Failed to create experience')
  });

  const updateMutation = useMutation({
    mutationFn: async (values: ExperienceFormValues) =>
      api.experiences({ id: experience!.id }).put({
        title: values.title,
        company_name: values.companyName,
        company_website: values.companyWebsite || undefined,
        location: values.location,
        start_date: values.startDate,
        end_date: values.endDate,
        summary: values.summary || undefined,
        ordinal: values.ordinal
      }),
    onSuccess: () => {
      invalidateExperiences(queryClient);
      onOpenChange(false);
      toast.success('Experience updated');
    },
    onError: () => toast.error('Failed to update experience')
  });

  function onSubmit(values: ExperienceFormValues) {
    if (experience) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{experience ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
          <DialogDescription>
            {experience ? 'Update this work experience entry.' : 'Add a new work experience entry.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Senior Engineer" {...register('title')} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company</Label>
              <Input id="companyName" placeholder="Acme Corp" {...register('companyName')} />
              {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyWebsite">Website (optional)</Label>
              <Input id="companyWebsite" placeholder="https://acme.com" {...register('companyWebsite')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="San Francisco, CA" {...register('location')} />
              {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => <MonthYearPicker value={field.value} onChange={field.onChange} />}
              />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => <MonthYearPicker value={field.value} onChange={field.onChange} />}
              />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Summary (optional)</Label>
            <textarea
              id="summary"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Brief description of the role..."
              {...register('summary')}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
