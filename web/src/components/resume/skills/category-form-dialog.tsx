import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateSkillCategory, useUpdateSkillCategory } from '@/hooks/use-skills';

const categorySchema = z.object({
  name: z.string().min(1, 'Required')
});

type CategoryFormData = z.infer<typeof categorySchema>;

type Category = {
  id: string;
  name: string;
  ordinal: number;
};

type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  nextOrdinal: number;
};

export function CategoryFormDialog({ open, onOpenChange, category, nextOrdinal }: CategoryFormDialogProps) {
  const isEditing = !!category;
  const createCategory = useCreateSkillCategory();
  const updateCategory = useUpdateSkillCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' }
  });

  useEffect(() => {
    if (open) {
      reset({ name: category?.name ?? '' });
    }
  }, [open, category, reset]);

  const isPending = createCategory.isPending || updateCategory.isPending;

  function onSubmit(data: CategoryFormData) {
    if (isEditing) {
      updateCategory.mutate(
        { id: category.id, name: data.name },
        {
          onSuccess: () => {
            toast.success('Category updated');
            onOpenChange(false);
          }
        }
      );
    } else {
      createCategory.mutate(
        { name: data.name, ordinal: nextOrdinal },
        {
          onSuccess: () => {
            toast.success('Category created');
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
          <DialogTitle>{isEditing ? 'Edit Category' : 'Add Category'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Category Name</Label>
            <Input id="name" {...register('name')} placeholder="Languages & Frameworks" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
