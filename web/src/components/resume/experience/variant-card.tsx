import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import type { BulletVariant } from './types';
import { invalidateExperiences } from './types';

const APPROVAL_STYLES: Record<string, string> = {
  APPROVED: 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]',
  PENDING: 'bg-[#fefce8] text-[#ca8a04] border border-[#fde68a]',
  REJECTED: 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]'
};

type VariantCardProps = {
  variant: BulletVariant;
  bulletId: string;
  experienceId: string;
};

export function VariantCard({ variant, bulletId, experienceId }: VariantCardProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(variant.text);

  const deleteMutation = useMutation({
    mutationFn: async () =>
      api.variants({ id: variant.id }).delete({ experience_id: experienceId, bullet_id: bulletId }),
    onSuccess: () => {
      invalidateExperiences(queryClient);
      toast.success('Variant deleted');
    },
    onError: () => toast.error('Failed to delete variant')
  });

  const approveMutation = useMutation({
    mutationFn: async () =>
      api.variants({ id: variant.id }).approve.put({ experience_id: experienceId, bullet_id: bulletId }),
    onSuccess: () => {
      invalidateExperiences(queryClient);
      toast.success('Variant approved');
    },
    onError: () => toast.error('Failed to approve variant')
  });

  const rejectMutation = useMutation({
    mutationFn: async () =>
      api.variants({ id: variant.id }).reject.put({ experience_id: experienceId, bullet_id: bulletId }),
    onSuccess: () => {
      invalidateExperiences(queryClient);
      toast.success('Variant rejected');
    },
    onError: () => toast.error('Failed to reject variant')
  });

  const updateMutation = useMutation({
    mutationFn: async () =>
      api.variants({ id: variant.id }).put({
        experience_id: experienceId,
        bullet_id: bulletId,
        text: editText,
        angle: variant.angle,
        role_tags: variant.roleTags.map(t => t.id),
        skill_tags: variant.skillTags.map(t => t.id)
      }),
    onSuccess: () => {
      invalidateExperiences(queryClient);
      setEditing(false);
      toast.success('Variant updated');
    },
    onError: () => toast.error('Failed to update variant')
  });

  return (
    <div className="rounded-[6px] border border-[#e5e7eb] bg-white p-2.5 text-xs leading-relaxed">
      {editing ? (
        <div className="flex items-center gap-2">
          <Input
            value={editText}
            onChange={e => setEditText(e.target.value)}
            className="flex-1 text-xs h-7"
            onKeyDown={e => {
              if (e.key === 'Enter' && editText.trim()) updateMutation.mutate();
              if (e.key === 'Escape') {
                setEditing(false);
                setEditText(variant.text);
              }
            }}
          />
          <Pill onClick={() => updateMutation.mutate()} disabled={!editText.trim()}>
            save
          </Pill>
          <Pill
            onClick={() => {
              setEditing(false);
              setEditText(variant.text);
            }}
          >
            cancel
          </Pill>
        </div>
      ) : (
        <>
          <p>{variant.text}</p>
          <div className="mt-1.5 flex items-center gap-1">
            <span className={`rounded-[3px] px-1.5 py-px text-[9px] ${APPROVAL_STYLES[variant.approvalStatus] ?? ''}`}>
              {variant.approvalStatus}
            </span>
            <TagBadge>{variant.angle}</TagBadge>
            <TagBadge>{variant.source}</TagBadge>
            <span className="flex-1" />
            {variant.approvalStatus === 'PENDING' && (
              <>
                <Pill
                  className="text-[#16a34a] border-[#bbf7d0]"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                >
                  ✓
                </Pill>
                <Pill
                  className="text-[#dc2626] border-[#fecaca]"
                  onClick={() => rejectMutation.mutate()}
                  disabled={rejectMutation.isPending}
                >
                  ✗
                </Pill>
              </>
            )}
            <Pill onClick={() => setEditing(true)}>edit</Pill>
            <Pill
              className="text-[#dc2626] border-[#fecaca]"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              del
            </Pill>
          </div>
        </>
      )}
    </div>
  );
}

function Pill({
  children,
  className = '',
  onClick,
  disabled
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`rounded-[3px] border border-[#e5e7eb] px-1 py-px text-[9px] text-[#9ca3af] cursor-pointer hover:bg-[#f5f5f5] disabled:opacity-50 ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function TagBadge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-[3px] bg-[#f5f5f5] px-1.5 py-px text-[9px] text-[#6b7280]">{children}</span>;
}
