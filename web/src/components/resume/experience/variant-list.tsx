import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import type { BulletVariant } from './types';
import { invalidateExperiences } from './types';
import { VariantCard } from './variant-card';

type VariantListProps = {
  variants: BulletVariant[];
  bulletId: string;
  experienceId: string;
};

export function VariantList({ variants, bulletId, experienceId }: VariantListProps) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [angle, setAngle] = useState('');

  const addMutation = useMutation({
    mutationFn: async () =>
      api.bullets({ id: bulletId }).variants.post({
        experience_id: experienceId,
        text,
        angle,
        source: 'manual',
        role_tags: [],
        skill_tags: []
      }),
    onSuccess: () => {
      invalidateExperiences(queryClient);
      setAdding(false);
      setText('');
      setAngle('');
      toast.success('Variant added');
    },
    onError: () => toast.error('Failed to add variant')
  });

  return (
    <div className="ml-5 border-l-2 border-[#c7d2fe] pl-3 mt-1 space-y-1.5">
      {variants.map(v => (
        <VariantCard key={v.id} variant={v} bulletId={bulletId} experienceId={experienceId} />
      ))}

      {adding ? (
        <div className="space-y-1.5">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Variant text..."
            className="text-xs h-7"
          />
          <div className="flex gap-1.5">
            <Input
              value={angle}
              onChange={e => setAngle(e.target.value)}
              placeholder="Angle (e.g. leadership)"
              className="flex-1 text-xs h-7"
            />
            <button
              type="button"
              className="rounded-[3px] border border-[#e5e7eb] px-2 py-0.5 text-[10px] text-[#374151] hover:bg-[#f5f5f5] disabled:opacity-50"
              onClick={() => addMutation.mutate()}
              disabled={!text.trim() || !angle.trim() || addMutation.isPending}
            >
              Add
            </button>
            <button
              type="button"
              className="rounded-[3px] border border-[#e5e7eb] px-2 py-0.5 text-[10px] text-[#9ca3af] hover:bg-[#f5f5f5]"
              onClick={() => {
                setAdding(false);
                setText('');
                setAngle('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="text-[11px] font-medium text-[#6366f1] hover:text-[#4f46e5] cursor-pointer py-1"
          onClick={() => setAdding(true)}
        >
          + Add variant
        </button>
      )}
    </div>
  );
}
