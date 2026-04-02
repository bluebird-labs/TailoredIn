import { createFileRoute } from '@tanstack/react-router';
import { Download, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ExperienceEditModal } from '@/components/resume/builder/ExperienceEditModal';
import { HeadlineSwapModal } from '@/components/resume/builder/HeadlineSwapModal';
import { PersonalInfoModal } from '@/components/resume/builder/PersonalInfoModal';
import { ResumePreview } from '@/components/resume/builder/ResumePreview';
import { VersionTabs } from '@/components/resume/builder/VersionTabs';
import type { Experience } from '@/components/resume/experience/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useArchetypes,
  useCreateArchetype,
  useDeleteArchetype,
  useSetArchetypeContent,
  useUpdateArchetype
} from '@/hooks/use-archetypes';
import type { Education } from '@/hooks/use-education';
import { useEducations } from '@/hooks/use-education';
import { useExperiences } from '@/hooks/use-experiences';
import { useHeadlines } from '@/hooks/use-headlines';
import { useProfile } from '@/hooks/use-profile';

export const Route = createFileRoute('/resume/builder')({
  component: BuilderPage
});

type Headline = { id: string; summaryText: string };

type ContentSelection = {
  experienceSelections: { experienceId: string; bulletVariantIds: string[] }[];
  educationIds: string[];
  skillCategoryIds: string[];
  skillItemIds: string[];
};

type Archetype = {
  id: string;
  key: string;
  label: string;
  headlineId: string | null;
  contentSelection: ContentSelection;
};

const STORAGE_KEY = 'activeArchetypeId';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function BuilderPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: headlinesRaw, isLoading: headlinesLoading } = useHeadlines();
  const { data: experiencesRaw, isLoading: experiencesLoading } = useExperiences();
  const { data: educationsRaw, isLoading: educationsLoading } = useEducations();
  const { data: archetypesRaw, isLoading: archetypesLoading } = useArchetypes();

  const createArchetype = useCreateArchetype();
  const updateArchetype = useUpdateArchetype();
  const deleteArchetype = useDeleteArchetype();
  const setArchetypeContent = useSetArchetypeContent();

  const headlines = (headlinesRaw ?? []) as Headline[];
  const experiences = useMemo(
    () => ((experiencesRaw ?? []) as Experience[]).sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [experiencesRaw]
  );
  const educations = (educationsRaw ?? []) as Education[];
  const archetypes = (archetypesRaw ?? []) as Archetype[];

  const isLoading = profileLoading || headlinesLoading || experiencesLoading || educationsLoading || archetypesLoading;

  // ── Active archetype ──────────────────────────────────────────────────
  const [activeArchetypeId, setActiveArchetypeId] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '');

  // Sync activeArchetypeId to a valid archetype
  useEffect(() => {
    if (archetypes.length === 0) return;
    if (!archetypes.some(a => a.id === activeArchetypeId)) {
      setActiveArchetypeId(archetypes[0].id);
    }
  }, [archetypes, activeArchetypeId]);

  // Persist to localStorage
  useEffect(() => {
    if (activeArchetypeId) {
      localStorage.setItem(STORAGE_KEY, activeArchetypeId);
    }
  }, [activeArchetypeId]);

  const activeArchetype = archetypes.find(a => a.id === activeArchetypeId);

  // ── Derive selections from archetype ──────────────────────────────────
  const selectedHeadlineId = activeArchetype?.headlineId ?? headlines[0]?.id ?? '';

  const visibleBulletVariantIds = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!activeArchetype) return map;
    for (const es of activeArchetype.contentSelection.experienceSelections) {
      map.set(es.experienceId, new Set(es.bulletVariantIds));
    }
    return map;
  }, [activeArchetype]);

  const visibleEducationIds = useMemo(() => {
    if (!activeArchetype) return new Set<string>();
    return new Set(activeArchetype.contentSelection.educationIds);
  }, [activeArchetype]);

  // ── Modal state ───────────────────────────────────────────────────────
  const [personalInfoModalOpen, setPersonalInfoModalOpen] = useState(false);
  const [headlineModalOpen, setHeadlineModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // ── Auto-save helpers ─────────────────────────────────────────────────
  const saveContent = useCallback(
    (patch: Partial<Pick<ContentSelection, 'experienceSelections' | 'educationIds'>>) => {
      if (!activeArchetype) return;
      const cs = activeArchetype.contentSelection;
      setArchetypeContent.mutate(
        {
          id: activeArchetype.id,
          experience_selections: (patch.experienceSelections ?? cs.experienceSelections).map(es => ({
            experience_id: es.experienceId,
            bullet_variant_ids: es.bulletVariantIds
          })),
          education_ids: patch.educationIds ?? cs.educationIds,
          skill_category_ids: cs.skillCategoryIds,
          skill_item_ids: cs.skillItemIds
        },
        {
          onError: () => toast.error('Failed to save changes')
        }
      );
    },
    [activeArchetype, setArchetypeContent]
  );

  // ── Callbacks ─────────────────────────────────────────────────────────
  const handleBulletVisibilityChange = useCallback(
    (expId: string, variantIds: Set<string>) => {
      if (!activeArchetype) return;
      const cs = activeArchetype.contentSelection;
      const updated = cs.experienceSelections.filter(es => es.experienceId !== expId);
      if (variantIds.size > 0) {
        updated.push({ experienceId: expId, bulletVariantIds: [...variantIds] });
      }
      saveContent({ experienceSelections: updated });
    },
    [activeArchetype, saveContent]
  );

  const toggleEducation = useCallback(
    (id: string) => {
      if (!activeArchetype) return;
      const current = new Set(activeArchetype.contentSelection.educationIds);
      if (current.has(id)) {
        current.delete(id);
      } else {
        current.add(id);
      }
      saveContent({ educationIds: [...current] });
    },
    [activeArchetype, saveContent]
  );

  const handleHeadlineSelect = useCallback(
    (headlineId: string) => {
      if (!activeArchetype) return;
      updateArchetype.mutate(
        {
          id: activeArchetype.id,
          key: activeArchetype.key,
          label: activeArchetype.label,
          headline_id: headlineId
        },
        {
          onError: () => toast.error('Failed to save headline')
        }
      );
    },
    [activeArchetype, updateArchetype]
  );

  // ── Version management ────────────────────────────────────────────────
  const handleCreate = useCallback(
    (mode: 'blank' | 'duplicate') => {
      const label = 'New Version';
      createArchetype.mutate(
        { key: slugify(label), label },
        {
          onSuccess: data => {
            const newId = (data as { data: { id: string } })?.data?.id;
            if (!newId) return;
            setActiveArchetypeId(newId);
            if (mode === 'duplicate' && activeArchetype) {
              const cs = activeArchetype.contentSelection;
              setArchetypeContent.mutate({
                id: newId,
                experience_selections: cs.experienceSelections.map(es => ({
                  experience_id: es.experienceId,
                  bullet_variant_ids: es.bulletVariantIds
                })),
                education_ids: cs.educationIds,
                skill_category_ids: cs.skillCategoryIds,
                skill_item_ids: cs.skillItemIds
              });
              if (activeArchetype.headlineId) {
                updateArchetype.mutate({
                  id: newId,
                  key: slugify(label),
                  label,
                  headline_id: activeArchetype.headlineId
                });
              }
            }
          }
        }
      );
    },
    [activeArchetype, createArchetype, setArchetypeContent, updateArchetype]
  );

  const handleRename = useCallback(
    (id: string, label: string) => {
      const arch = archetypes.find(a => a.id === id);
      if (!arch) return;
      updateArchetype.mutate(
        { id, key: slugify(label), label, headline_id: arch.headlineId },
        { onError: () => toast.error('Failed to rename') }
      );
    },
    [archetypes, updateArchetype]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteArchetype.mutate(id, {
        onSuccess: () => {
          if (activeArchetypeId === id) {
            const remaining = archetypes.filter(a => a.id !== id);
            if (remaining.length > 0) setActiveArchetypeId(remaining[0].id);
          }
        },
        onError: () => toast.error('Failed to delete')
      });
    },
    [activeArchetypeId, archetypes, deleteArchetype]
  );

  // ── Generate handler ──────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedHeadlineId) {
      toast.error('Please select a headline');
      return;
    }

    const experienceSelections = [];
    for (const [expId, variantIds] of visibleBulletVariantIds) {
      if (variantIds.size > 0) {
        experienceSelections.push({
          experience_id: expId,
          bullet_variant_ids: [...variantIds]
        });
      }
    }

    const body = {
      headline_id: selectedHeadlineId,
      experience_selections: experienceSelections,
      education_ids: [...visibleEducationIds],
      skill_category_ids: activeArchetype?.contentSelection.skillCategoryIds ?? [],
      skill_item_ids: activeArchetype?.contentSelection.skillItemIds ?? [],
      keywords: []
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

  // ── Experiences for the modal ─────────────────────────────────────────
  const editingExperiences = useMemo(() => {
    if (!editingCompany) return [];
    return experiences.filter(e => e.companyName === editingCompany);
  }, [editingCompany, experiences]);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#e5e7eb] sticky top-0 bg-[#f8f9fa] z-10">
        <span className="text-[13px] text-[#6b7280] font-medium">Resume Builder</span>
        <button
          type="button"
          disabled={generating}
          onClick={handleGenerate}
          className="bg-[#111] text-white px-4 py-2 rounded-md text-[13px] font-medium cursor-pointer hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Generate PDF
            </>
          )}
        </button>
      </div>

      {/* Version tabs */}
      {archetypes.length > 0 && (
        <VersionTabs
          archetypes={archetypes}
          activeId={activeArchetypeId}
          onSwitch={setActiveArchetypeId}
          onCreate={handleCreate}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      )}

      {/* Document area */}
      <div className="flex-1 overflow-y-auto bg-white">
        {isLoading || !profile ? (
          <div className="max-w-[680px] mx-auto px-10 py-8 space-y-4">
            <Skeleton className="h-8 w-64 rounded" />
            <Skeleton className="h-4 w-96 rounded" />
            <Skeleton className="h-16 w-full rounded" />
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-32 w-full rounded" />
            <Skeleton className="h-32 w-full rounded" />
          </div>
        ) : (
          <ResumePreview
            profile={profile}
            headlines={headlines}
            selectedHeadlineId={selectedHeadlineId}
            experiences={experiences}
            visibleBulletVariantIds={visibleBulletVariantIds}
            educations={educations}
            visibleEducationIds={visibleEducationIds}
            onEditPersonalInfo={() => setPersonalInfoModalOpen(true)}
            onSwapHeadline={() => setHeadlineModalOpen(true)}
            onEditCompany={setEditingCompany}
            onToggleEducation={toggleEducation}
          />
        )}
      </div>

      {/* Modals */}
      {profile && (
        <PersonalInfoModal
          open={personalInfoModalOpen}
          onClose={() => setPersonalInfoModalOpen(false)}
          profile={profile}
        />
      )}

      <HeadlineSwapModal
        open={headlineModalOpen}
        onClose={() => setHeadlineModalOpen(false)}
        headlines={headlines}
        selectedId={selectedHeadlineId}
        onSelect={handleHeadlineSelect}
      />

      {editingCompany && (
        <ExperienceEditModal
          open={!!editingCompany}
          onClose={() => setEditingCompany(null)}
          company={editingCompany}
          experiences={editingExperiences}
          visibleBulletVariantIds={visibleBulletVariantIds}
          onBulletVisibilityChange={handleBulletVisibilityChange}
        />
      )}
    </div>
  );
}
