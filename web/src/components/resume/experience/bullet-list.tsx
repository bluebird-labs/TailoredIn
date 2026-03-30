import { arrayMove } from '@dnd-kit/sortable';
import { Plus, Trash2 } from 'lucide-react';
import { type KeyboardEvent, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { SortableItem, SortableList } from '@/components/shared/sortable-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAddBullet, useDeleteBullet, useUpdateBullet } from '@/hooks/use-companies';

type Bullet = {
  id: string;
  content: string;
  ordinal: number;
};

type BulletListProps = {
  companyId: string;
  bullets: Bullet[];
};

export function BulletList({ companyId, bullets }: BulletListProps) {
  const sorted = [...bullets].sort((a, b) => a.ordinal - b.ordinal);
  const addBullet = useAddBullet();
  const updateBullet = useUpdateBullet();
  const deleteBullet = useDeleteBullet();
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Bullet | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAddBullet() {
    const content = newContent.trim();
    if (!content) return;
    const ordinal = sorted.length > 0 ? Math.max(...sorted.map(b => b.ordinal)) + 1 : 0;
    addBullet.mutate(
      { companyId, content, ordinal },
      {
        onSuccess: () => {
          setNewContent('');
          inputRef.current?.focus();
        }
      }
    );
  }

  function handleAddKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddBullet();
    }
  }

  function startEditing(bullet: Bullet) {
    setEditingId(bullet.id);
    setEditContent(bullet.content);
  }

  function commitEdit(bullet: Bullet) {
    const content = editContent.trim();
    if (!content || content === bullet.content) {
      setEditingId(null);
      return;
    }
    updateBullet.mutate({ companyId, bulletId: bullet.id, content }, { onSuccess: () => setEditingId(null) });
  }

  function handleEditKeyDown(e: KeyboardEvent, bullet: Bullet) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit(bullet);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  }

  function handleReorder(activeId: string, overId: string) {
    const oldIndex = sorted.findIndex(b => b.id === activeId);
    const newIndex = sorted.findIndex(b => b.id === overId);
    const reordered = arrayMove(sorted, oldIndex, newIndex);
    for (let i = 0; i < reordered.length; i++) {
      const bullet = reordered[i];
      if (bullet.ordinal !== i) {
        updateBullet.mutate({ companyId, bulletId: bullet.id, ordinal: i });
      }
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteBullet.mutate(
      { companyId, bulletId: deleteTarget.id },
      {
        onSuccess: () => {
          toast.success('Bullet deleted');
          setDeleteTarget(null);
        }
      }
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <SortableList items={sorted} onReorder={handleReorder}>
        {sorted.map(bullet => (
          <SortableItem key={bullet.id} id={bullet.id} className="py-1">
            {editingId === bullet.id ? (
              <input
                ref={(el: HTMLInputElement | null) => el?.focus()}
                type="text"
                className="w-full rounded border border-input bg-transparent px-2 py-1 text-sm outline-none focus:border-ring"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onBlur={() => commitEdit(bullet)}
                onKeyDown={e => handleEditKeyDown(e, bullet)}
              />
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex-1 cursor-text text-left text-sm text-foreground"
                  onClick={() => startEditing(bullet)}
                >
                  {bullet.content}
                </button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(bullet)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            )}
          </SortableItem>
        ))}
      </SortableList>

      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          className="h-7 text-sm"
          placeholder="Add a bullet point..."
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          onKeyDown={handleAddKeyDown}
        />
        <Button variant="ghost" size="icon-sm" onClick={handleAddBullet} disabled={!newContent.trim()}>
          <Plus className="size-4" />
        </Button>
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title="Delete Bullet"
        description="This bullet point will be permanently removed."
        onConfirm={handleDelete}
        isPending={deleteBullet.isPending}
      />
    </div>
  );
}
