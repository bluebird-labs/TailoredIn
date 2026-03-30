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

const educationSchema = z.object({
  degreeTitle: z.string().min(1, 'Required'),
  institutionName: z.string().min(1, 'Required'),
  graduationYear: z.string().length(4, 'Must be 4 digits'),
  locationLabel: z.string().min(1, 'Required')
});

type EducationFormData = z.infer<typeof educationSchema>;

type Education = {
  id: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: string;
  locationLabel: string;
  ordinal: number;
};

type EducationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | undefined;
  education?: Education;
  nextOrdinal: number;
};

export function EducationFormDialog({ open, onOpenChange, userId, education, nextOrdinal }: EducationFormDialogProps) {
  const isEditing = !!education;
  const createEducation = useCreateEducation(userId);
  const updateEducation = useUpdateEducation(userId);

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
      graduationYear: '',
      locationLabel: ''
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
              locationLabel: education.locationLabel
            }
          : {
              degreeTitle: '',
              institutionName: '',
              graduationYear: '',
              locationLabel: ''
            }
      );
    }
  }, [open, education, reset]);

  const isPending = createEducation.isPending || updateEducation.isPending;

  function onSubmit(data: EducationFormData) {
    if (isEditing) {
      updateEducation.mutate(
        {
          id: education.id,
          degree_title: data.degreeTitle,
          institution_name: data.institutionName,
          graduation_year: data.graduationYear,
          location_label: data.locationLabel,
          ordinal: education.ordinal
        },
        {
          onSuccess: () => {
            toast.success('Education updated');
            onOpenChange(false);
          }
        }
      );
    } else {
      createEducation.mutate(
        {
          degree_title: data.degreeTitle,
          institution_name: data.institutionName,
          graduation_year: data.graduationYear,
          location_label: data.locationLabel,
          ordinal: nextOrdinal
        },
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
              <Input id="graduationYear" {...register('graduationYear')} placeholder="2018" maxLength={4} />
              {errors.graduationYear && <p className="text-xs text-destructive">{errors.graduationYear.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="locationLabel">Location</Label>
              <Input id="locationLabel" {...register('locationLabel')} placeholder="Cambridge, MA" />
              {errors.locationLabel && <p className="text-xs text-destructive">{errors.locationLabel.message}</p>}
            </div>
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
