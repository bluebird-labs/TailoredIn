import { arrayMove } from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Bullet, Experience } from '@/components/resume/experience/types';
import { invalidateExperiences } from '@/components/resume/experience/types';
import { SortableItem, SortableList } from '@/components/shared/sortable-list';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { api } from '@/lib/api';

type ExperienceEditModalProps = {
  open: boolean;
  onClose: () => void;
  company: string;
  experiences: Experience[];
  visibleBulletVariantIds: Map<string, Set<string>>;
  onBulletVisibilityChange: (expId: string, variantIds: Set<string>) => void;
};

type PositionDraft = {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: Bullet[];
};

export function ExperienceEditModal({
  open,
  onClose,
  company,
  experiences,
  visibleBulletVariantIds,
  onBulletVisibilityChange
}: ExperienceEditModalProps) {
  const queryClient = useQueryClient();
  const [positions, setPositions] = useState<PositionDraft[]>([]);
  const [saving, setSaving] = useState(false);

  // Initialize position drafts from experiences
  useEffect(() => {
    if (open) {
      setPositions(
        experiences.map(exp => ({
          id: exp.id,
          title: exp.title,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate,
          bullets: [...exp.bullets].sort((a, b) => a.ordinal - b.ordinal)
        }))
      );
    }
  }, [open, experiences]);

  const updatePosition = useCallback((expId: string, field: keyof PositionDraft, value: string) => {
    setPositions(prev => prev.map(p => (p.id === expId ? { ...p, [field]: value } : p)));
  }, []);

  const handleBulletReorder = useCallback((expId: string, activeId: string, overId: string) => {
    setPositions(prev =>
      prev.map(p => {
        if (p.id !== expId) return p;
        const oldIndex = p.bullets.findIndex(b => b.id === activeId);
        const newIndex = p.bullets.findIndex(b => b.id === overId);
        if (oldIndex === -1 || newIndex === -1) return p;
        return { ...p, bullets: arrayMove(p.bullets, oldIndex, newIndex) };
      })
    );
  }, []);

  const toggleBulletVisibility = useCallback(
    (expId: string, bullet: Bullet) => {
      const currentIds = visibleBulletVariantIds.get(expId) ?? new Set<string>();
      const next = new Set(currentIds);
      // Find the first approved variant for this bullet
      const variant = bullet.variants.find(v => v.approvalStatus === 'APPROVED') ?? bullet.variants[0];
      if (!variant) return;
      if (next.has(variant.id)) {
        next.delete(variant.id);
      } else {
        next.add(variant.id);
      }
      onBulletVisibilityChange(expId, next);
    },
    [visibleBulletVariantIds, onBulletVisibilityChange]
  );

  const isBulletVisible = useCallback(
    (expId: string, bullet: Bullet): boolean => {
      const ids = visibleBulletVariantIds.get(expId);
      if (!ids) return false;
      return bullet.variants.some(v => ids.has(v.id));
    },
    [visibleBulletVariantIds]
  );

  const getBulletDisplayText = (bullet: Bullet): string => {
    const approved = bullet.variants.find(v => v.approvalStatus === 'APPROVED');
    return approved?.text ?? bullet.variants[0]?.text ?? bullet.content;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save position field changes
      for (const pos of positions) {
        const orig = experiences.find(e => e.id === pos.id);
        if (!orig) continue;
        const changed =
          pos.title !== orig.title ||
          pos.location !== orig.location ||
          pos.startDate !== orig.startDate ||
          pos.endDate !== orig.endDate;
        if (changed) {
          await api.experiences({ id: pos.id }).put({
            title: pos.title,
            company_name: company,
            location: pos.location,
            start_date: pos.startDate,
            end_date: pos.endDate,
            summary: orig.summary ?? undefined,
            ordinal: orig.ordinal
          });
        }

        // Save bullet reorder
        for (let i = 0; i < pos.bullets.length; i++) {
          const bullet = pos.bullets[i];
          if (bullet.ordinal !== i) {
            await api.bullets({ id: bullet.id }).put({
              experience_id: pos.id,
              content: bullet.content,
              ordinal: i
            });
          }
        }
      }

      await invalidateExperiences(queryClient);
      toast.success('Experience updated');
      onClose();
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {positions.map((pos, posIdx) => (
            <div key={pos.id}>
              {posIdx > 0 && <div className="border-t border-[#f0f0f0] mb-4" />}

              <div className="text-[11px] font-semibold text-[#666] uppercase tracking-wide mb-2">
                {pos.title || 'Position'}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] text-[#888]">Title</Label>
                  <Input
                    value={pos.title}
                    onChange={e => updatePosition(pos.id, 'title', e.target.value)}
                    className="text-[12px] py-1 h-8"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] text-[#888]">Location</Label>
                  <Input
                    value={pos.location}
                    onChange={e => updatePosition(pos.id, 'location', e.target.value)}
                    className="text-[12px] py-1 h-8"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] text-[#888]">Start</Label>
                  <MonthYearPicker
                    value={pos.startDate}
                    onChange={v => {
                      if (v) updatePosition(pos.id, 'startDate', v);
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] text-[#888]">End</Label>
                  <MonthYearPicker
                    value={pos.endDate}
                    onChange={v => {
                      if (v) updatePosition(pos.id, 'endDate', v);
                    }}
                  />
                </div>
              </div>

              {/* Bullets */}
              <div className="text-[10px] font-semibold text-[#888] uppercase tracking-wide mb-2">Bullets</div>
              <SortableList
                items={pos.bullets}
                onReorder={(activeId, overId) => handleBulletReorder(pos.id, activeId, overId)}
              >
                {pos.bullets.map(bullet => {
                  const visible = isBulletVisible(pos.id, bullet);
                  return (
                    <SortableItem key={bullet.id} id={bullet.id} className="mb-1">
                      <div
                        className={`flex items-start gap-2 p-2 rounded-md border border-[#eee] bg-[#fafafa] ${!visible ? 'opacity-40' : ''}`}
                      >
                        <span
                          className={`flex-1 text-[11px] leading-relaxed ${!visible ? 'line-through text-[#999]' : 'text-[#333]'}`}
                        >
                          {getBulletDisplayText(bullet)}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleBulletVisibility(pos.id, bullet)}
                          className="shrink-0 cursor-pointer p-0.5"
                          title={visible ? 'Exclude from resume' : 'Include in resume'}
                        >
                          {visible ? (
                            <Eye className="w-3.5 h-3.5 text-[#666]" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-[#999]" />
                          )}
                        </button>
                      </div>
                    </SortableItem>
                  );
                })}
              </SortableList>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Done'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
