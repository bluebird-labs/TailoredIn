import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const positionSchema = z.object({
  title: z.string().min(1, 'Required'),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
  summary: z.string().nullable()
});

type PositionFormData = z.infer<typeof positionSchema>;

export type Position = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
};

type PositionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: Position;
  onSave: (data: PositionFormData) => void;
  isPending?: boolean;
};

export function PositionFormDialog({ open, onOpenChange, position, onSave, isPending }: PositionFormDialogProps) {
  const isEditing = !!position;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<PositionFormData>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      title: '',
      startDate: '',
      endDate: '',
      summary: null
    }
  });

  useEffect(() => {
    if (open) {
      reset(
        position
          ? {
              title: position.title,
              startDate: position.startDate,
              endDate: position.endDate,
              summary: position.summary
            }
          : {
              title: '',
              startDate: '',
              endDate: '',
              summary: null
            }
      );
    }
  }, [open, position, reset]);

  function onSubmit(data: PositionFormData) {
    onSave(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Position' : 'Add Position'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="posTitle">Title</Label>
            <Input id="posTitle" {...register('title')} placeholder="Senior Software Engineer" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="posStartDate">Start Date</Label>
              <Input id="posStartDate" {...register('startDate')} placeholder="Jan 2020" />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="posEndDate">End Date</Label>
              <Input id="posEndDate" {...register('endDate')} placeholder="Present" />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="posSummary">Summary (optional)</Label>
            <textarea
              id="posSummary"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Brief description of the role..."
              {...register('summary')}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Position'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
