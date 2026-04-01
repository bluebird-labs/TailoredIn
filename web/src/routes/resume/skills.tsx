import { arrayMove } from '@dnd-kit/sortable';
import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CategoryFormDialog } from '@/components/resume/skills/category-form-dialog';
import { SkillCategoryCard } from '@/components/resume/skills/skill-category-card';
import { SortableItem, SortableList } from '@/components/shared/sortable-list';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSkillCategories, useUpdateSkillCategory } from '@/hooks/use-skills';

export const Route = createFileRoute('/resume/skills')({
  component: SkillsPage
});

type SkillCategory = {
  id: string;
  name: string;
  ordinal: number;
  items: { id: string; name: string; ordinal: number }[];
};

function SkillsPage() {
  const { data, isLoading } = useSkillCategories();
  const updateCategory = useUpdateSkillCategory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SkillCategory | undefined>();

  const categories = ([...(data ?? [])] as SkillCategory[]).sort((a, b) => a.ordinal - b.ordinal);

  const nextOrdinal = categories.length > 0 ? Math.max(...categories.map(c => c.ordinal)) + 1 : 0;

  function handleAdd() {
    setEditingCategory(undefined);
    setDialogOpen(true);
  }

  function handleEdit(category: SkillCategory) {
    setEditingCategory(category);
    setDialogOpen(true);
  }

  function handleReorderCategories(activeId: string, overId: string) {
    const oldIndex = categories.findIndex(c => c.id === activeId);
    const newIndex = categories.findIndex(c => c.id === overId);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    for (let i = 0; i < reordered.length; i++) {
      const cat = reordered[i];
      if (cat.ordinal !== i) {
        updateCategory.mutate({ id: cat.id, ordinal: i });
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Skills</h1>
          <p className="text-muted-foreground mt-1">Skill categories and items.</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="size-4" data-icon="inline-start" />
          Add Category
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && categories.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-muted-foreground">No skill categories yet.</p>
          <p className="text-sm text-muted-foreground">Add your first category to get started.</p>
        </div>
      )}

      {!isLoading && categories.length > 0 && (
        <SortableList items={categories} onReorder={handleReorderCategories}>
          <div className="flex flex-col gap-4">
            {categories.map(category => (
              <SortableItem key={category.id} id={category.id}>
                <SkillCategoryCard category={category} onEdit={() => handleEdit(category)} />
              </SortableItem>
            ))}
          </div>
        </SortableList>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        nextOrdinal={nextOrdinal}
      />
    </div>
  );
}
