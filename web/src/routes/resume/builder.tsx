import { createFileRoute } from '@tanstack/react-router';
import { ChevronDown, ChevronRight, Download, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Experience } from '@/components/resume/experience/types';
import { formatDateRange } from '@/components/resume/experience/types';
import { Skeleton } from '@/components/ui/skeleton';
import type { Education } from '@/hooks/use-education';
import { useEducations } from '@/hooks/use-education';
import { useExperiences } from '@/hooks/use-experiences';
import { useHeadlines } from '@/hooks/use-headlines';
import { useSkillCategories } from '@/hooks/use-skills';

export const Route = createFileRoute('/resume/builder')({
  component: BuilderPage
});

type Headline = { id: string; summaryText: string };
type SkillItem = { id: string; name: string; ordinal: number };
type SkillCategory = { id: string; name: string; ordinal: number; items: SkillItem[] };

function BuilderPage() {
  const { data: headlinesRaw, isLoading: headlinesLoading } = useHeadlines();
  const { data: experiencesRaw, isLoading: experiencesLoading } = useExperiences();
  const { data: educationsRaw, isLoading: educationsLoading } = useEducations();
  const { data: skillCategoriesRaw, isLoading: skillsLoading } = useSkillCategories();

  const headlines = (headlinesRaw ?? []) as Headline[];
  const experiences = useMemo(
    () => ((experiencesRaw ?? []) as Experience[]).sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [experiencesRaw]
  );
  const educations = (educationsRaw ?? []) as Education[];
  const skillCategories = (skillCategoriesRaw ?? []) as SkillCategory[];

  const isLoading = headlinesLoading || experiencesLoading || educationsLoading || skillsLoading;

  // ── State ───────────────────────────────────────────────────────────────
  const [selectedHeadlineId, setSelectedHeadlineId] = useState('');
  const [selectedExperiences, setSelectedExperiences] = useState<Map<string, Set<string>>>(new Map());
  const [expandedExperiences, setExpandedExperiences] = useState<Set<string>>(new Set());
  const [selectedEducationIds, setSelectedEducationIds] = useState<Set<string>>(new Set());
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [keywords, setKeywords] = useState('');
  const [generating, setGenerating] = useState(false);

  // Auto-select everything on load
  useEffect(() => {
    if (headlines.length > 0 && !selectedHeadlineId) {
      setSelectedHeadlineId(headlines[0].id);
    }
  }, [headlines, selectedHeadlineId]);

  useEffect(() => {
    if (experiences.length > 0 && selectedExperiences.size === 0) {
      const map = new Map<string, Set<string>>();
      for (const exp of experiences) {
        const variantIds = new Set<string>();
        for (const bullet of exp.bullets) {
          for (const v of bullet.variants) {
            if (v.approvalStatus === 'APPROVED') variantIds.add(v.id);
          }
        }
        map.set(exp.id, variantIds);
      }
      setSelectedExperiences(map);
    }
  }, [experiences, selectedExperiences.size]);

  useEffect(() => {
    if (educations.length > 0 && selectedEducationIds.size === 0) {
      setSelectedEducationIds(new Set(educations.map(e => e.id)));
    }
  }, [educations, selectedEducationIds.size]);

  // ── Experience toggle ───────────────────────────────────────────────────
  const toggleExperience = useCallback((exp: Experience) => {
    setSelectedExperiences(prev => {
      const next = new Map(prev);
      if (next.has(exp.id)) {
        next.delete(exp.id);
      } else {
        // Auto-select all APPROVED variants
        const variantIds = new Set<string>();
        for (const bullet of exp.bullets) {
          for (const v of bullet.variants) {
            if (v.approvalStatus === 'APPROVED') {
              variantIds.add(v.id);
            }
          }
        }
        next.set(exp.id, variantIds);
      }
      return next;
    });
  }, []);

  const toggleVariant = useCallback((expId: string, variantId: string) => {
    setSelectedExperiences(prev => {
      const next = new Map(prev);
      const variants = new Set(next.get(expId) ?? []);
      if (variants.has(variantId)) {
        variants.delete(variantId);
      } else {
        variants.add(variantId);
      }
      next.set(expId, variants);
      return next;
    });
  }, []);

  const toggleExpanded = useCallback((expId: string) => {
    setExpandedExperiences(prev => {
      const next = new Set(prev);
      if (next.has(expId)) {
        next.delete(expId);
      } else {
        next.add(expId);
      }
      return next;
    });
  }, []);

  // ── Education toggle ────────────────────────────────────────────────────
  const toggleEducation = useCallback((id: string) => {
    setSelectedEducationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // ── Skill toggles ──────────────────────────────────────────────────────
  const toggleCategory = useCallback((cat: SkillCategory) => {
    setSelectedCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(cat.id)) {
        next.delete(cat.id);
        // Deselect all items in category
        setSelectedItemIds(prevItems => {
          const nextItems = new Set(prevItems);
          for (const item of cat.items) {
            nextItems.delete(item.id);
          }
          return nextItems;
        });
      } else {
        next.add(cat.id);
        // Select all items in category
        setSelectedItemIds(prevItems => {
          const nextItems = new Set(prevItems);
          for (const item of cat.items) {
            nextItems.add(item.id);
          }
          return nextItems;
        });
      }
      return next;
    });
  }, []);

  const toggleSkillItem = useCallback((itemId: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  // ── Generate handler ────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedHeadlineId) {
      toast.error('Please select a headline');
      return;
    }

    const experienceSelections = [];
    for (const [expId, variantIds] of selectedExperiences) {
      experienceSelections.push({
        experience_id: expId,
        bullet_variant_ids: [...variantIds]
      });
    }

    const body = {
      headline_id: selectedHeadlineId,
      experience_selections: experienceSelections,
      education_ids: [...selectedEducationIds],
      skill_category_ids: [...selectedCategoryIds],
      skill_item_ids: [...selectedItemIds],
      keywords: keywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)
    };

    setGenerating(true);
    try {
      const response = await fetch('/api/resumes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message ?? 'Generation failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] ?? 'resume.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Resume downloaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
        <div>
          <h1 className="text-xl font-bold text-[#111]">Resume Builder</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">Select content and generate a standalone resume</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — content selection */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-8 w-48 rounded" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-8 w-48 rounded" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : (
            <>
              {/* ── Headlines ───────────────────────────────────────── */}
              <section>
                <h2 className="text-[13px] font-semibold text-[#6b7280] uppercase tracking-wide mb-3">Headline</h2>
                <div className="space-y-2">
                  {headlines.map(h => (
                    <label
                      key={h.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedHeadlineId === h.id
                          ? 'border-[#6366f1] bg-[#eef2ff]'
                          : 'border-[#e5e7eb] hover:border-[#c7d2fe]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="headline"
                        value={h.id}
                        checked={selectedHeadlineId === h.id}
                        onChange={() => setSelectedHeadlineId(h.id)}
                        className="mt-0.5 accent-[#6366f1]"
                      />
                      <span className="text-[13px] text-[#374151]">{h.summaryText}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* ── Experiences ──────────────────────────────────────── */}
              <section>
                <h2 className="text-[13px] font-semibold text-[#6b7280] uppercase tracking-wide mb-3">Experience</h2>
                <div className="space-y-2">
                  {experiences.map(exp => {
                    const isSelected = selectedExperiences.has(exp.id);
                    const isExpanded = expandedExperiences.has(exp.id);
                    const selectedVariantIds = selectedExperiences.get(exp.id) ?? new Set<string>();

                    return (
                      <div
                        key={exp.id}
                        className={`rounded-lg border border-[#e5e7eb] transition-opacity ${!isSelected ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-center gap-3 p-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleExperience(exp)}
                            className="accent-[#6366f1]"
                          />
                          <button
                            type="button"
                            className="p-0.5 hover:bg-[#f3f4f6] rounded cursor-pointer"
                            onClick={() => toggleExpanded(exp.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-[#6b7280]" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-[#6b7280]" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium text-[#111]">{exp.title}</div>
                            <div className="text-[12px] text-[#6b7280]">
                              {exp.companyName} &middot; {formatDateRange(exp.startDate, exp.endDate)}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-3 pb-3">
                            {exp.bullets.map(bullet => (
                              <div key={bullet.id} className="mb-2">
                                <div className="text-[12px] text-[#9ca3af] mb-1 pl-2">{bullet.content}</div>
                                <div className="ml-2 pl-3 border-l-2 border-[#c7d2fe] space-y-1">
                                  {bullet.variants.map(v => (
                                    <label key={v.id} className="flex items-start gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={selectedVariantIds.has(v.id)}
                                        onChange={() => toggleVariant(exp.id, v.id)}
                                        className="mt-0.5 accent-[#6366f1]"
                                        disabled={!isSelected}
                                      />
                                      <span className="text-[12px] text-[#374151]">
                                        <span className="text-[#9ca3af]">[{v.angle}]</span> {v.text}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── Education ───────────────────────────────────────── */}
              <section>
                <h2 className="text-[13px] font-semibold text-[#6b7280] uppercase tracking-wide mb-3">Education</h2>
                <div className="space-y-2">
                  {educations.map(edu => (
                    <label
                      key={edu.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-[#e5e7eb] cursor-pointer hover:border-[#c7d2fe]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEducationIds.has(edu.id)}
                        onChange={() => toggleEducation(edu.id)}
                        className="mt-0.5 accent-[#6366f1]"
                      />
                      <div>
                        <div className="text-[13px] font-medium text-[#111]">{edu.degreeTitle}</div>
                        <div className="text-[12px] text-[#6b7280]">
                          {edu.institutionName} &middot; {edu.graduationYear}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {/* ── Skills ──────────────────────────────────────────── */}
              <section>
                <h2 className="text-[13px] font-semibold text-[#6b7280] uppercase tracking-wide mb-3">Skills</h2>
                <div className="space-y-4">
                  {skillCategories.map(cat => (
                    <div key={cat.id}>
                      <label className="flex items-center gap-2 mb-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.has(cat.id)}
                          onChange={() => toggleCategory(cat)}
                          className="accent-[#6366f1]"
                        />
                        <span className="text-[13px] font-medium text-[#111]">{cat.name}</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5 ml-6">
                        {cat.items.map(item => {
                          const isItemSelected = selectedItemIds.has(item.id);
                          return (
                            <label
                              key={item.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[12px] cursor-pointer transition-colors ${
                                isItemSelected
                                  ? 'bg-[#eef2ff] border-[#e0e7ff] text-[#374151]'
                                  : 'bg-[#fafafa] border-[#f0f0f0] text-[#9ca3af]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isItemSelected}
                                onChange={() => toggleSkillItem(item.id)}
                                className="hidden"
                              />
                              {item.name}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Right panel — controls */}
        <div className="w-64 border-l border-[#e5e7eb] p-4 flex flex-col gap-5">
          <label className="block">
            <span className="text-[13px] font-semibold text-[#6b7280] uppercase tracking-wide block mb-1.5">
              Keywords
            </span>
            <input
              type="text"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              placeholder="react, typescript, aws"
              className="w-full border border-[#e5e7eb] rounded-md px-2.5 py-1.5 text-[13px] text-[#111]"
            />
            <p className="text-[11px] text-[#9ca3af] mt-1">Comma-separated keywords for the PDF footer</p>
          </label>

          <div className="mt-auto">
            <button
              type="button"
              disabled={generating}
              onClick={handleGenerate}
              className="w-full bg-[#111] text-white px-3.5 py-2 rounded-md text-[13px] font-medium cursor-pointer hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate Resume
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
