import { arrayMove } from '@dnd-kit/sortable';
import { Plus, X } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { SortableItem, SortableList } from '@/components/shared/sortable-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAddSkillItem, useDeleteSkillItem, useUpdateSkillItem } from '@/hooks/use-skills';

type SkillItem = {
  id: string;
  skillName: string;
  ordinal: number;
};

type SkillItemListProps = {
  categoryId: string;
  items: SkillItem[];
};

export function SkillItemList({ categoryId, items }: SkillItemListProps) {
  const sorted = [...items].sort((a, b) => a.ordinal - b.ordinal);
  const addItem = useAddSkillItem();
  const updateItem = useUpdateSkillItem();
  const deleteItem = useDeleteSkillItem();
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SkillItem | null>(null);

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    const ordinal = sorted.length > 0 ? Math.max(...sorted.map(i => i.ordinal)) + 1 : 0;
    addItem.mutate({ categoryId, skill_name: name, ordinal }, { onSuccess: () => setNewName('') });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  function handleReorder(activeId: string, overId: string) {
    const oldIndex = sorted.findIndex(i => i.id === activeId);
    const newIndex = sorted.findIndex(i => i.id === overId);
    const reordered = arrayMove(sorted, oldIndex, newIndex);
    for (let i = 0; i < reordered.length; i++) {
      const item = reordered[i];
      if (item.ordinal !== i) {
        updateItem.mutate({ categoryId, itemId: item.id, ordinal: i });
      }
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteItem.mutate(
      { categoryId, itemId: deleteTarget.id },
      {
        onSuccess: () => {
          toast.success(`${deleteTarget.skillName} removed`);
          setDeleteTarget(null);
        }
      }
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <SortableList items={sorted} onReorder={handleReorder}>
        {sorted.map(item => (
          <SortableItem key={item.id} id={item.id} className="py-0.5">
            <Badge variant="secondary" className="gap-1 pr-1">
              {item.skillName}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setDeleteTarget(item)}
              >
                <X className="size-3" />
              </button>
            </Badge>
          </SortableItem>
        ))}
      </SortableList>

      <div className="flex items-center gap-2">
        <Input
          className="h-7 text-sm"
          placeholder="Add a skill..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button variant="ghost" size="icon-sm" onClick={handleAdd} disabled={!newName.trim()}>
          <Plus className="size-4" />
        </Button>
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title="Remove Skill"
        description={`Remove "${deleteTarget?.skillName}" from this category?`}
        onConfirm={handleDelete}
        isPending={deleteItem.isPending}
      />
    </div>
  );
}
