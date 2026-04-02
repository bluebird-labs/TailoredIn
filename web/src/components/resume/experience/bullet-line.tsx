import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import type { Bullet } from './types';
import { invalidateExperiences } from './types';
import { VariantList } from './variant-list';

type BulletLineProps = {
  bullet: Bullet;
  experienceId: string;
};

export function BulletLine({ bullet, experienceId }: BulletLineProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(bullet.content);
  const [showVariants, setShowVariants] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async () =>
      api.bullets({ id: bullet.id }).put({
        experience_id: experienceId,
        content: editContent,
        ordinal: bullet.ordinal
      }),
    onSuccess: () => {
      invalidateExperiences(queryClient);
      setEditing(false);
      toast.success('Bullet updated');
    },
    onError: () => toast.error('Failed to update bullet')
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.bullets({ id: bullet.id }).delete({ experience_id: experienceId }),
    onSuccess: () => {
      invalidateExperiences(queryClient);
      toast.success('Bullet deleted');
    },
    onError: () => toast.error('Failed to delete bullet')
  });

  const hasVariants = bullet.variants.length > 0;

  return (
    <li className="list-none">
      <div className={`flex items-baseline gap-2 py-1.5 ${showVariants ? 'bg-[#f8faff] -mx-3 px-3 rounded-md' : ''}`}>
        <span className={showVariants ? 'text-[#6366f1]' : 'text-[#9ca3af]'}>•</span>

        {editing ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="flex-1 text-[13px] h-7"
              onKeyDown={e => {
                if (e.key === 'Enter' && editContent.trim()) updateMutation.mutate();
                if (e.key === 'Escape') {
                  setEditing(false);
                  setEditContent(bullet.content);
                }
              }}
            />
            <button
              type="button"
              className="rounded-[3px] border border-[#e5e7eb] px-1.5 py-px text-[10px] text-[#374151] hover:bg-[#f5f5f5] disabled:opacity-50"
              onClick={() => updateMutation.mutate()}
              disabled={!editContent.trim()}
            >
              save
            </button>
            <button
              type="button"
              className="rounded-[3px] border border-[#e5e7eb] px-1.5 py-px text-[10px] text-[#9ca3af] hover:bg-[#f5f5f5]"
              onClick={() => {
                setEditing(false);
                setEditContent(bullet.content);
              }}
            >
              cancel
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-[13px] text-[#374151]">{bullet.content}</span>
            <span className="inline-flex gap-0.5 shrink-0">
              <button
                type="button"
                className="rounded-[3px] border border-[#e5e7eb] px-1.5 py-px text-[10px] text-[#9ca3af] cursor-pointer hover:bg-[#f5f5f5]"
                onClick={() => setEditing(true)}
              >
                edit
              </button>
              {hasVariants && (
                <button
                  type="button"
                  className={`rounded-[3px] border px-1.5 py-px text-[10px] cursor-pointer font-semibold ${
                    showVariants
                      ? 'bg-[#6366f1] text-white border-[#6366f1]'
                      : 'bg-[#eef2ff] text-[#6366f1] border-[#e0e7ff]'
                  }`}
                  onClick={() => setShowVariants(!showVariants)}
                >
                  ⟳ {bullet.variants.length}
                  {showVariants ? ' ▴' : ''}
                </button>
              )}
            </span>
          </>
        )}
      </div>

      {showVariants && <VariantList variants={bullet.variants} bulletId={bullet.id} experienceId={experienceId} />}

      <ConfirmDeleteDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete Bullet"
        description="Are you sure you want to delete this bullet and all its variants?"
        onConfirm={() => deleteMutation.mutate()}
        isPending={deleteMutation.isPending}
      />
    </li>
  );
}
