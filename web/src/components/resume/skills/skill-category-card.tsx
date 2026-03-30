import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeleteSkillCategory } from '@/hooks/use-skills';
import { SkillItemList } from './skill-item-list';

type SkillItem = {
  id: string;
  skillName: string;
  ordinal: number;
};

type SkillCategory = {
  id: string;
  categoryName: string;
  ordinal: number;
  items: SkillItem[];
};

type SkillCategoryCardProps = {
  category: SkillCategory;
  onEdit: () => void;
};

export function SkillCategoryCard({ category, onEdit }: SkillCategoryCardProps) {
  const [showDelete, setShowDelete] = useState(false);
  const deleteCategory = useDeleteSkillCategory();

  function handleDelete() {
    deleteCategory.mutate(category.id, {
      onSuccess: () => {
        toast.success(`${category.categoryName} deleted`);
        setShowDelete(false);
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{category.categoryName}</CardTitle>
          <CardAction>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-xs" onClick={onEdit}>
                <Pencil className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <SkillItemList categoryId={category.id} items={category.items} />
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={`Delete ${category.categoryName}?`}
        description="This will permanently remove the category and all its skills."
        onConfirm={handleDelete}
        isPending={deleteCategory.isPending}
      />
    </>
  );
}
