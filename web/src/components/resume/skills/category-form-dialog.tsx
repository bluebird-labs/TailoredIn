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
  categoryName: z.string().min(1, 'Required')
});

type CategoryFormData = z.infer<typeof categorySchema>;

type Category = {
  id: string;
  categoryName: string;
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
    defaultValues: { categoryName: '' }
  });

  useEffect(() => {
    if (open) {
      reset({ categoryName: category?.categoryName ?? '' });
    }
  }, [open, category, reset]);

  const isPending = createCategory.isPending || updateCategory.isPending;

  function onSubmit(data: CategoryFormData) {
    if (isEditing) {
      updateCategory.mutate(
        { id: category.id, category_name: data.categoryName },
        {
          onSuccess: () => {
            toast.success('Category updated');
            onOpenChange(false);
          }
        }
      );
    } else {
      createCategory.mutate(
        { category_name: data.categoryName, ordinal: nextOrdinal },
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
            <Label htmlFor="categoryName">Category Name</Label>
            <Input id="categoryName" {...register('categoryName')} placeholder="Languages & Frameworks" />
            {errors.categoryName && <p className="text-xs text-destructive">{errors.categoryName.message}</p>}
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
