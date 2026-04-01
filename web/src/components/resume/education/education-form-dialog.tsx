import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateEducation, useUpdateEducation } from '@/hooks/use-education';
import type { Education } from '@/routes/resume/education';

const educationSchema = z.object({
  degreeTitle: z.string().min(1, 'Required'),
  institutionName: z.string().min(1, 'Required'),
  graduationYear: z.coerce.number().int().min(1900, 'Invalid year').max(2100, 'Invalid year'),
  location: z.string().optional().default(''),
  honors: z.string().optional().default('')
});

type EducationFormData = z.infer<typeof educationSchema>;

type EducationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  education?: Education;
  nextOrdinal: number;
};

export function EducationFormDialog({ open, onOpenChange, education, nextOrdinal }: EducationFormDialogProps) {
  const isEditing = !!education;
  const createEducation = useCreateEducation();
  const updateEducation = useUpdateEducation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      degreeTitle: '',
      institutionName: '',
      graduationYear: undefined as unknown as number,
      location: '',
      honors: ''
    }
  });

  useEffect(() => {
    if (open) {
      reset(
        education
          ? {
              degreeTitle: education.degreeTitle,
              institutionName: education.institutionName,
              graduationYear: education.graduationYear,
              location: education.location ?? '',
              honors: education.honors ?? ''
            }
          : {
              degreeTitle: '',
              institutionName: '',
              graduationYear: undefined as unknown as number,
              location: '',
              honors: ''
            }
      );
    }
  }, [open, education, reset]);

  const isPending = createEducation.isPending || updateEducation.isPending;

  function onSubmit(data: EducationFormData) {
    const payload = {
      degree_title: data.degreeTitle,
      institution_name: data.institutionName,
      graduation_year: data.graduationYear,
      location: data.location || null,
      honors: data.honors || null
    };

    if (isEditing) {
      updateEducation.mutate(
        { id: education.id, ...payload, ordinal: education.ordinal },
        {
          onSuccess: () => {
            toast.success('Education updated');
            onOpenChange(false);
          }
        }
      );
    } else {
      createEducation.mutate(
        { ...payload, ordinal: nextOrdinal },
        {
          onSuccess: () => {
            toast.success('Education added');
            onOpenChange(false);
          }
        }
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Education' : 'Add Education'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="degreeTitle">Degree</Label>
            <Input id="degreeTitle" {...register('degreeTitle')} placeholder="B.S. Computer Science" />
            {errors.degreeTitle && <p className="text-xs text-destructive">{errors.degreeTitle.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="institutionName">Institution</Label>
            <Input id="institutionName" {...register('institutionName')} placeholder="MIT" />
            {errors.institutionName && <p className="text-xs text-destructive">{errors.institutionName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="graduationYear">Graduation Year</Label>
              <Input id="graduationYear" type="number" {...register('graduationYear')} placeholder="2018" />
              {errors.graduationYear && <p className="text-xs text-destructive">{errors.graduationYear.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register('location')} placeholder="Cambridge, MA" />
              {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="honors">Honors</Label>
            <Input id="honors" {...register('honors')} placeholder="Magna Cum Laude" />
            {errors.honors && <p className="text-xs text-destructive">{errors.honors.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Education'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
