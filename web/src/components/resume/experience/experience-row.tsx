import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { BulletLine } from './bullet-line';
import type { Experience } from './types';
import { formatDateRange, invalidateExperiences } from './types';

type ExperienceRowProps = {
  experience: Experience;
  onEdit: () => void;
  onDelete: () => void;
};

export function ExperienceRow({ experience, onEdit, onDelete }: ExperienceRowProps) {
  const queryClient = useQueryClient();
  const [addingBullet, setAddingBullet] = useState(false);
  const [newBulletContent, setNewBulletContent] = useState('');

  const addBulletMutation = useMutation({
    mutationFn: async () =>
      api.experiences({ id: experience.id }).bullets.post({
        content: newBulletContent,
        ordinal: experience.bullets.length
      }),
    onSuccess: () => {
      invalidateExperiences(queryClient);
      setAddingBullet(false);
      setNewBulletContent('');
      toast.success('Bullet added');
    },
    onError: () => toast.error('Failed to add bullet')
  });

  const totalVariants = experience.bullets.reduce((sum, b) => sum + b.variants.length, 0);

  return (
    <div className="flex border-b border-[#f0f0f0]">
      {/* Left panel — resume content */}
      <div className="flex-1 min-w-0 py-5 px-6">
        {/* Header: title + dates */}
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[15px] font-bold text-[#111]">{experience.title}</div>
            <div className="text-[13px] font-medium text-[#374151]">{experience.companyName}</div>
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className="text-xs text-[#6b7280]">{formatDateRange(experience.startDate, experience.endDate)}</div>
            <div className="text-xs text-[#9ca3af]">{experience.location}</div>
          </div>
        </div>

        {/* Summary */}
        {experience.summary && <p className="text-xs text-[#6b7280] italic mt-1.5">{experience.summary}</p>}

        {/* Bullet list */}
        <ul className="mt-2.5 space-y-0 text-[13px] text-[#374151] leading-relaxed p-0 m-0">
          {experience.bullets.map(bullet => (
            <BulletLine key={bullet.id} bullet={bullet} experienceId={experience.id} />
          ))}
        </ul>

        {/* Add bullet inline */}
        {addingBullet && (
          <div className="flex items-center gap-2 mt-2 ml-4">
            <Input
              value={newBulletContent}
              onChange={e => setNewBulletContent(e.target.value)}
              placeholder="Bullet point content..."
              className="flex-1 text-[13px] h-7"
              onKeyDown={e => {
                if (e.key === 'Enter' && newBulletContent.trim()) addBulletMutation.mutate();
                if (e.key === 'Escape') {
                  setAddingBullet(false);
                  setNewBulletContent('');
                }
              }}
              autoFocus
            />
            <button
              type="button"
              className="rounded-[3px] border border-[#e5e7eb] px-2 py-0.5 text-[10px] text-[#374151] hover:bg-[#f5f5f5] disabled:opacity-50"
              onClick={() => addBulletMutation.mutate()}
              disabled={!newBulletContent.trim() || addBulletMutation.isPending}
            >
              Add
            </button>
            <button
              type="button"
              className="rounded-[3px] border border-[#e5e7eb] px-2 py-0.5 text-[10px] text-[#9ca3af] hover:bg-[#f5f5f5]"
              onClick={() => {
                setAddingBullet(false);
                setNewBulletContent('');
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Right gutter — actions */}
      <div className="w-[120px] shrink-0 py-5 px-3 border-l border-[#f0f0f0] bg-[#fafafa] flex flex-col gap-1.5">
        <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wide">Experience</div>
        <button
          type="button"
          className="text-left text-xs text-[#374151] py-1 px-2 rounded bg-white border border-[#e5e7eb] cursor-pointer hover:bg-[#f5f5f5]"
          onClick={onEdit}
        >
          ✏️ Edit
        </button>
        <button
          type="button"
          className="text-left text-xs text-[#dc2626] py-1 px-2 rounded bg-white border border-[#e5e7eb] cursor-pointer hover:bg-[#fef2f2]"
          onClick={onDelete}
        >
          🗑 Delete
        </button>

        <div className="mt-2 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wide">Bullets</div>
        <button
          type="button"
          className="text-left text-xs text-[#374151] py-1 px-2 rounded bg-white border border-[#e5e7eb] cursor-pointer hover:bg-[#f5f5f5]"
          onClick={() => setAddingBullet(true)}
        >
          + Add
        </button>

        <div className="mt-auto text-[11px] text-[#9ca3af]">
          {experience.bullets.length} bullets · {totalVariants} var
        </div>
      </div>
    </div>
  );
}
