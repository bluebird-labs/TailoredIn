import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ExperienceEditModal } from '@/components/resume/builder/ExperienceEditModal';
import { ExperienceFormDialog } from '@/components/resume/builder/ExperienceFormDialog';
import { PersonalInfoModal } from '@/components/resume/builder/PersonalInfoModal';
import { ResumePreview } from '@/components/resume/builder/ResumePreview';
import { TAB_COLORS, VersionTabs } from '@/components/resume/builder/VersionTabs';
import { EducationFormDialog } from '@/components/resume/education/education-form-dialog';
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
import { usePdfPreview } from '@/hooks/use-pdf-preview';
import { useProfile } from '@/hooks/use-profile';

const PdfPreviewPanel = lazy(() =>
  import('@/components/resume/builder/PdfPreviewPanel').then(m => ({ default: m.PdfPreviewPanel }))
);

export const Route = createFileRoute('/resume/builder')({
  component: BuilderPage
});

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
  headlineText: string;
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
  const { data: experiencesRaw, isLoading: experiencesLoading } = useExperiences();
  const { data: educationsRaw, isLoading: educationsLoading } = useEducations();
  const { data: archetypesRaw, isLoading: archetypesLoading } = useArchetypes();

  const createArchetype = useCreateArchetype();
  const updateArchetype = useUpdateArchetype();
  const deleteArchetype = useDeleteArchetype();
  const setArchetypeContent = useSetArchetypeContent();

  const experiences = useMemo(
    () => ((experiencesRaw ?? []) as Experience[]).sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [experiencesRaw]
  );
  const educations = (educationsRaw ?? []) as Education[];
  const archetypes = (archetypesRaw ?? []) as Archetype[];

  const isLoading = profileLoading || experiencesLoading || educationsLoading || archetypesLoading;

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
  const activeTabIndex = Math.max(
    0,
    archetypes.findIndex(a => a.id === activeArchetypeId)
  );

  // ── Derive selections from archetype ──────────────────────────────────
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
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [experienceDialogOpen, setExperienceDialogOpen] = useState(false);
  const [educationDialogOpen, setEducationDialogOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | undefined>();
  const [generating, setGenerating] = useState(false);

  const nextExperienceOrdinal = experiences.length > 0 ? Math.max(...experiences.map(e => e.ordinal)) + 1 : 0;
  const nextEducationOrdinal = educations.length > 0 ? Math.max(...educations.map(e => e.ordinal)) + 1 : 0;

  // ── PDF preview ─────────────────────────────────────────────────────
  const pdfSelection = useMemo(() => {
    if (!activeArchetype) return null;
    const cs = activeArchetype.contentSelection;
    return {
      headlineText: activeArchetype.headlineText,
      experienceSelections: cs.experienceSelections,
      educationIds: cs.educationIds,
      skillCategoryIds: cs.skillCategoryIds,
      skillItemIds: cs.skillItemIds
    };
  }, [activeArchetype]);

  const { pdfData, isCompiling, error: pdfError } = usePdfPreview(pdfSelection);

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

  const handleHeadlineChange = useCallback(
    (text: string) => {
      if (!activeArchetype) return;
      updateArchetype.mutate(
        {
          id: activeArchetype.id,
          key: activeArchetype.key,
          label: activeArchetype.label,
          headline_text: text
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
              updateArchetype.mutate({
                id: newId,
                key: slugify(label),
                label,
                headline_text: activeArchetype.headlineText
              });
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
        { id, key: slugify(label), label, headline_text: arch.headlineText },
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
    const headlineText = activeArchetype?.headlineText ?? '';

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
      headline_text: headlineText,
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
    <div className="-m-6 flex flex-col min-h-[calc(100vh-1px)]">
      {/* Sticky header + tabs */}
      <div className="sticky top-0 z-20">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h1 className="text-2xl font-bold">Resume Builder</h1>
        </div>

        {archetypes.length > 0 && (
          <VersionTabs
            archetypes={archetypes}
            activeId={activeArchetypeId}
            onSwitch={setActiveArchetypeId}
            onCreate={handleCreate}
            onRename={handleRename}
            onDelete={handleDelete}
            generating={generating}
            onGenerate={handleGenerate}
          />
        )}
      </div>

      {/* Document area — two-column grid */}
      <div className="flex-1 grid grid-cols-2 min-h-0">
        {/* Left: interactive preview */}
        <div
          className="overflow-y-auto bg-white h-full"
          style={
            {
              '--section-hover': TAB_COLORS[activeTabIndex % TAB_COLORS.length].hoverBg,
              '--section-accent': TAB_COLORS[activeTabIndex % TAB_COLORS.length].accent
            } as React.CSSProperties
          }
        >
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
              headlineText={activeArchetype?.headlineText ?? ''}
              experiences={experiences}
              visibleBulletVariantIds={visibleBulletVariantIds}
              educations={educations}
              visibleEducationIds={visibleEducationIds}
              onEditPersonalInfo={() => setPersonalInfoModalOpen(true)}
              onHeadlineChange={handleHeadlineChange}
              onEditCompany={setEditingCompany}
              onAddExperience={() => setExperienceDialogOpen(true)}
              onToggleEducation={toggleEducation}
              onEditEducation={edu => {
                setEditingEducation(edu);
                setEducationDialogOpen(true);
              }}
              onAddEducation={() => {
                setEditingEducation(undefined);
                setEducationDialogOpen(true);
              }}
            />
          )}
        </div>

        {/* Right: PDF preview */}
        <div className="border-l border-border overflow-hidden h-full">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Loading preview...
              </div>
            }
          >
            <PdfPreviewPanel pdfData={pdfData} isCompiling={isCompiling} error={pdfError} />
          </Suspense>
        </div>
      </div>

      {/* Modals */}
      {profile && (
        <PersonalInfoModal
          open={personalInfoModalOpen}
          onClose={() => setPersonalInfoModalOpen(false)}
          profile={profile}
        />
      )}

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

      <ExperienceFormDialog
        open={experienceDialogOpen}
        onOpenChange={setExperienceDialogOpen}
        nextOrdinal={nextExperienceOrdinal}
      />

      <EducationFormDialog
        open={educationDialogOpen}
        onOpenChange={setEducationDialogOpen}
        education={editingEducation}
        nextOrdinal={nextEducationOrdinal}
      />
    </div>
  );
}
