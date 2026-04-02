import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { useCreateExperience } from '@/hooks/use-experiences';

const YM_REGEX = /^\d{4}-\d{2}$/;

const schema = z.object({
  title: z.string().min(1, 'Required'),
  companyName: z.string().min(1, 'Required'),
  location: z.string().min(1, 'Required'),
  startDate: z.string().regex(YM_REGEX, 'Pick a month'),
  endDate: z.string().regex(YM_REGEX, 'Pick a month'),
  summary: z.string().optional().default('')
});

type FormData = z.infer<typeof schema>;

type ExperienceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextOrdinal: number;
};

export function ExperienceFormDialog({ open, onOpenChange, nextOrdinal }: ExperienceFormDialogProps) {
  const createExperience = useCreateExperience();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      companyName: '',
      location: '',
      startDate: '',
      endDate: '',
      summary: ''
    }
  });

  useEffect(() => {
    if (open) {
      reset({ title: '', companyName: '', location: '', startDate: '', endDate: '', summary: '' });
    }
  }, [open, reset]);

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  function onSubmit(data: FormData) {
    createExperience.mutate(
      {
        title: data.title,
        company_name: data.companyName,
        location: data.location,
        start_date: data.startDate,
        end_date: data.endDate,
        summary: data.summary || null,
        ordinal: nextOrdinal
      },
      {
        onSuccess: () => {
          toast.success('Experience added');
          onOpenChange(false);
        }
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Experience</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} placeholder="Senior Software Engineer" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyName">Company</Label>
            <Input id="companyName" {...register('companyName')} placeholder="Acme Inc." />
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register('location')} placeholder="San Francisco, CA" />
            {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Start Date</Label>
              <MonthYearPicker value={startDate} onChange={v => setValue('startDate', v, { shouldValidate: true })} />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>End Date</Label>
              <MonthYearPicker value={endDate} onChange={v => setValue('endDate', v, { shouldValidate: true })} />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="summary">Summary (optional)</Label>
            <Input id="summary" {...register('summary')} placeholder="Brief description of the role" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createExperience.isPending}>
              {createExperience.isPending ? 'Saving...' : 'Add Experience'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
