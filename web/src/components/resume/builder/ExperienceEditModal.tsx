import { arrayMove } from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Accomplishment, Experience } from '@/components/resume/experience/types';
import { invalidateExperiences } from '@/components/resume/experience/types';
import { SortableItem, SortableList } from '@/components/shared/sortable-list';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { api } from '@/lib/api';

// biome-ignore lint/suspicious/noExplicitAny: Eden Treaty merges inconsistent route param names (:id vs :experienceId) causing union type conflicts
type AnyRouteSegment = any;

type ExperienceEditModalProps = {
  open: boolean;
  onClose: () => void;
  company: string;
  experiences: Experience[];
  visibleBulletIds: Map<string, Set<string>>;
  onBulletVisibilityChange: (expId: string, accomplishmentIds: Set<string>) => void;
};

type PositionDraft = {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  accomplishments: Accomplishment[];
};

export function ExperienceEditModal({
  open,
  onClose,
  company,
  experiences,
  visibleBulletIds,
  onBulletVisibilityChange
}: ExperienceEditModalProps) {
  const queryClient = useQueryClient();
  const [positions, setPositions] = useState<PositionDraft[]>([]);
  const [saving, setSaving] = useState(false);

  // Inline editing state
  const [editingAccomplishmentId, setEditingAccomplishmentId] = useState<string | null>(null);
  const [accomplishmentDraft, setAccomplishmentDraft] = useState('');
  const [deletedAccomplishmentIds, setDeletedAccomplishmentIds] = useState<Set<string>>(new Set());
  const [newAccomplishmentIds, setNewAccomplishmentIds] = useState<Set<string>>(new Set());
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Summary inline editing state
  const [editingSummaryExpId, setEditingSummaryExpId] = useState<string | null>(null);
  const [summaryDraft, setSummaryDraft] = useState('');
  const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);

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
          summary: exp.summary,
          accomplishments: [...exp.accomplishments].sort((a, b) => a.ordinal - b.ordinal)
        }))
      );
      setEditingAccomplishmentId(null);
      setAccomplishmentDraft('');
      setEditingSummaryExpId(null);
      setSummaryDraft('');
      setDeletedAccomplishmentIds(new Set());
      setNewAccomplishmentIds(new Set());
    }
  }, [open, experiences]);

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (editingAccomplishmentId && editTextareaRef.current) {
      const ta = editTextareaRef.current;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }
  }, [editingAccomplishmentId]);

  useEffect(() => {
    if (editingSummaryExpId && summaryTextareaRef.current) {
      const ta = summaryTextareaRef.current;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }
  }, [editingSummaryExpId]);

  const updatePosition = useCallback((expId: string, field: keyof PositionDraft, value: string) => {
    setPositions(prev => prev.map(p => (p.id === expId ? { ...p, [field]: value } : p)));
  }, []);

  const handleAccomplishmentReorder = useCallback((expId: string, activeId: string, overId: string) => {
    setPositions(prev =>
      prev.map(p => {
        if (p.id !== expId) return p;
        const oldIndex = p.accomplishments.findIndex(a => a.id === activeId);
        const newIndex = p.accomplishments.findIndex(a => a.id === overId);
        if (oldIndex === -1 || newIndex === -1) return p;
        return { ...p, accomplishments: arrayMove(p.accomplishments, oldIndex, newIndex) };
      })
    );
  }, []);

  const toggleAccomplishmentVisibility = useCallback(
    (expId: string, acc: Accomplishment) => {
      const currentIds = visibleBulletIds.get(expId) ?? new Set<string>();
      const next = new Set(currentIds);
      if (next.has(acc.id)) {
        next.delete(acc.id);
      } else {
        next.add(acc.id);
      }
      onBulletVisibilityChange(expId, next);
    },
    [visibleBulletIds, onBulletVisibilityChange]
  );

  const isAccomplishmentVisible = useCallback(
    (expId: string, acc: Accomplishment): boolean => {
      const ids = visibleBulletIds.get(expId);
      if (!ids) return false;
      return ids.has(acc.id);
    },
    [visibleBulletIds]
  );

  // -- Inline editing --

  const startEditing = (accId: string, title: string) => {
    setEditingAccomplishmentId(accId);
    setAccomplishmentDraft(title);
  };

  const commitEdit = () => {
    if (!editingAccomplishmentId) return;
    const trimmed = accomplishmentDraft.trim();
    if (trimmed) {
      setPositions(prev =>
        prev.map(p => ({
          ...p,
          accomplishments: p.accomplishments.map(a => (a.id === editingAccomplishmentId ? { ...a, title: trimmed } : a))
        }))
      );
    }
    setEditingAccomplishmentId(null);
    setAccomplishmentDraft('');
  };

  const cancelEdit = () => {
    setEditingAccomplishmentId(null);
    setAccomplishmentDraft('');
  };

  // -- Summary inline editing --

  const startEditingSummary = (expId: string, summary: string | null) => {
    setEditingSummaryExpId(expId);
    setSummaryDraft(summary ?? '');
  };

  const commitSummaryEdit = () => {
    if (!editingSummaryExpId) return;
    const trimmed = summaryDraft.trim();
    setPositions(prev => prev.map(p => (p.id === editingSummaryExpId ? { ...p, summary: trimmed || null } : p)));
    setEditingSummaryExpId(null);
    setSummaryDraft('');
  };

  const cancelSummaryEdit = () => {
    setEditingSummaryExpId(null);
    setSummaryDraft('');
  };

  // -- Delete accomplishment --

  const markDeleted = (accId: string) => {
    // If it's a new accomplishment that hasn't been saved, just remove it entirely
    if (newAccomplishmentIds.has(accId)) {
      setPositions(prev =>
        prev.map(p => ({
          ...p,
          accomplishments: p.accomplishments.filter(a => a.id !== accId)
        }))
      );
      setNewAccomplishmentIds(prev => {
        const next = new Set(prev);
        next.delete(accId);
        return next;
      });
      return;
    }
    setDeletedAccomplishmentIds(prev => new Set(prev).add(accId));
  };

  const unmarkDeleted = (accId: string) => {
    setDeletedAccomplishmentIds(prev => {
      const next = new Set(prev);
      next.delete(accId);
      return next;
    });
  };

  // -- Add accomplishment --

  const addAccomplishment = (expId: string) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    setPositions(prev =>
      prev.map(p => {
        if (p.id !== expId) return p;
        return {
          ...p,
          accomplishments: [
            ...p.accomplishments,
            {
              id: tempId,
              title: '',
              narrative: '',
              skillTags: [],
              ordinal: p.accomplishments.length
            }
          ]
        };
      })
    );
    setNewAccomplishmentIds(prev => new Set(prev).add(tempId));
    startEditing(tempId, '');
  };

  // -- Save flow --

  const handleSave = async () => {
    // Commit any in-progress edits
    if (editingAccomplishmentId) commitEdit();
    if (editingSummaryExpId) commitSummaryEdit();

    setSaving(true);
    try {
      for (const pos of positions) {
        const orig = experiences.find(e => e.id === pos.id);
        if (!orig) continue;

        // Save position field changes
        const changed =
          pos.title !== orig.title ||
          pos.location !== orig.location ||
          pos.startDate !== orig.startDate ||
          pos.endDate !== orig.endDate ||
          pos.summary !== orig.summary;
        const expSegment = api.experiences({ id: pos.id, experienceId: pos.id } as AnyRouteSegment);

        if (changed) {
          await (expSegment as AnyRouteSegment).put({
            title: pos.title,
            company_name: company,
            location: pos.location,
            start_date: pos.startDate,
            end_date: pos.endDate,
            summary: pos.summary ?? undefined,
            ordinal: orig.ordinal
          });
        }

        const accSegment = (expSegment as AnyRouteSegment).accomplishments as AnyRouteSegment;

        // Create new accomplishments
        for (const acc of pos.accomplishments) {
          if (newAccomplishmentIds.has(acc.id) && !deletedAccomplishmentIds.has(acc.id) && acc.title.trim()) {
            await accSegment.post({
              title: acc.title,
              narrative: acc.narrative || acc.title,
              skill_tags: acc.skillTags,
              ordinal: pos.accomplishments.indexOf(acc)
            });
          }
        }

        // Delete marked accomplishments
        for (const accId of deletedAccomplishmentIds) {
          const belongsToPos = orig.accomplishments.some(a => a.id === accId);
          if (belongsToPos) {
            await accSegment({ accomplishmentId: accId }).delete();
            // Remove from visible accomplishment IDs
            const currentVisible = visibleBulletIds.get(pos.id);
            if (currentVisible?.has(accId)) {
              const next = new Set(currentVisible);
              next.delete(accId);
              onBulletVisibilityChange(pos.id, next);
            }
          }
        }

        // Update existing accomplishments (title + ordinal changes)
        const existingAccomplishments = pos.accomplishments.filter(
          a => !newAccomplishmentIds.has(a.id) && !deletedAccomplishmentIds.has(a.id)
        );
        for (let i = 0; i < existingAccomplishments.length; i++) {
          const acc = existingAccomplishments[i];
          const origAcc = orig.accomplishments.find(a => a.id === acc.id);
          if (!origAcc) continue;
          const titleChanged = acc.title !== origAcc.title;
          const ordinalChanged = i !== origAcc.ordinal;
          if (titleChanged || ordinalChanged) {
            await accSegment({ accomplishmentId: acc.id }).put({
              title: acc.title,
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

              {/* Summary */}
              <div className="text-[10px] font-semibold text-[#888] uppercase tracking-wide mb-1">Summary</div>
              <div className="mb-3">
                {editingSummaryExpId === pos.id ? (
                  <div className="p-2 rounded-md border-2 border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.1)] bg-[#fafafa]">
                    <textarea
                      ref={summaryTextareaRef}
                      value={summaryDraft}
                      onChange={e => setSummaryDraft(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          commitSummaryEdit();
                        } else if (e.key === 'Escape') {
                          cancelSummaryEdit();
                        }
                      }}
                      onBlur={commitSummaryEdit}
                      className="w-full text-[11px] leading-relaxed text-[#333] border-none bg-transparent resize-none outline-none font-[inherit] min-h-[36px]"
                      placeholder="Brief summary of this role..."
                    />
                    <div className="text-[9px] text-[#999] mt-0.5">Enter to confirm · Esc to cancel</div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="w-full text-left p-2 rounded-md border border-[#eee] bg-[#fafafa] text-[11px] leading-relaxed cursor-text"
                    onClick={() => startEditingSummary(pos.id, pos.summary)}
                  >
                    {pos.summary ? (
                      <span className="text-[#333]">{pos.summary}</span>
                    ) : (
                      <span className="text-[#bbb] italic">No summary — click to add</span>
                    )}
                  </button>
                )}
              </div>

              {/* Accomplishments */}
              <div className="text-[10px] font-semibold text-[#888] uppercase tracking-wide mb-2">Accomplishments</div>
              <SortableList
                items={pos.accomplishments.filter(a => !deletedAccomplishmentIds.has(a.id))}
                onReorder={(activeId, overId) => handleAccomplishmentReorder(pos.id, activeId, overId)}
              >
                {pos.accomplishments.map(acc => {
                  const isDeleted = deletedAccomplishmentIds.has(acc.id);
                  const isNew = newAccomplishmentIds.has(acc.id);
                  const isEditing = editingAccomplishmentId === acc.id;
                  const visible = isAccomplishmentVisible(pos.id, acc);

                  if (isDeleted) {
                    return (
                      <div
                        key={acc.id}
                        className="flex items-start gap-2 p-2 rounded-md border border-red-200 bg-red-50 mb-1"
                      >
                        <span className="flex-1 text-[11px] leading-relaxed line-through text-[#999]">{acc.title}</span>
                        <button
                          type="button"
                          onClick={() => unmarkDeleted(acc.id)}
                          className="shrink-0 text-[10px] text-blue-500 underline cursor-pointer"
                        >
                          Undo
                        </button>
                      </div>
                    );
                  }

                  return (
                    <SortableItem key={acc.id} id={acc.id} className="mb-1">
                      <div
                        className={`flex items-start gap-2 p-2 rounded-md border ${
                          isEditing
                            ? 'border-blue-500 border-2 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'
                            : isNew
                              ? 'border-green-300 border-l-3 border-l-green-500 bg-green-50'
                              : 'border-[#eee] bg-[#fafafa]'
                        } ${!visible && !isEditing ? 'opacity-40' : ''}`}
                      >
                        {isEditing ? (
                          <div className="flex-1">
                            <textarea
                              ref={editTextareaRef}
                              value={accomplishmentDraft}
                              onChange={e => setAccomplishmentDraft(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  commitEdit();
                                } else if (e.key === 'Escape') {
                                  cancelEdit();
                                }
                              }}
                              onBlur={commitEdit}
                              className="w-full text-[11px] leading-relaxed text-[#333] border-none bg-transparent resize-none outline-none font-[inherit] min-h-[36px]"
                              placeholder="Type your accomplishment title..."
                            />
                            <div className="text-[9px] text-[#999] mt-0.5">Enter to confirm · Esc to cancel</div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={`flex-1 text-left text-[11px] leading-relaxed cursor-text ${!visible ? 'line-through text-[#999]' : 'text-[#333]'}`}
                            onClick={() => startEditing(acc.id, acc.title)}
                          >
                            {acc.title || <span className="text-[#bbb] italic">Empty accomplishment</span>}
                          </button>
                        )}
                        {!isEditing && (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleAccomplishmentVisibility(pos.id, acc)}
                              className="shrink-0 cursor-pointer p-0.5"
                              title={visible ? 'Exclude from resume' : 'Include in resume'}
                            >
                              {visible ? (
                                <Eye className="w-3.5 h-3.5 text-[#666]" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-[#999]" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => markDeleted(acc.id)}
                              className="shrink-0 cursor-pointer p-0.5 opacity-40 hover:opacity-100 transition-opacity"
                              title="Delete accomplishment"
                            >
                              <X className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </SortableItem>
                  );
                })}
              </SortableList>

              {/* Add accomplishment button */}
              <button
                type="button"
                onClick={() => addAccomplishment(pos.id)}
                className="mt-1 w-full py-1.5 border border-dashed border-[#ccc] rounded-md bg-transparent text-[#888] text-[11px] cursor-pointer flex items-center justify-center gap-1 hover:border-[#999] hover:text-[#666] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add accomplishment
              </button>
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
