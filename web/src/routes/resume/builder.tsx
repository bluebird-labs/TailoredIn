import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Download, FileText, Loader2, Wand2 } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { ExperienceEditModal } from '@/components/resume/builder/ExperienceEditModal';
import { ExperienceFormDialog } from '@/components/resume/builder/ExperienceFormDialog';
import { HeadlineEditModal } from '@/components/resume/builder/HeadlineEditModal';
import { PersonalInfoModal } from '@/components/resume/builder/PersonalInfoModal';
import { ResumePreview } from '@/components/resume/builder/ResumePreview';
import { EducationFormDialog } from '@/components/resume/education/education-form-dialog';
import type { Experience } from '@/components/resume/experience/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { Education } from '@/hooks/use-education';
import { useEducations } from '@/hooks/use-education';
import { useExperiences } from '@/hooks/use-experiences';
import { usePdfPreview } from '@/hooks/use-pdf-preview';
import { useProfile } from '@/hooks/use-profile';
import { useGenerateResumeProfilePdf, useResumeProfile, useUpdateResumeProfile } from '@/hooks/use-resume-profile';
import {
  useCreateTailoredResume,
  useGenerateTailoredResumePdf,
  useTailoredResume,
  useUpdateTailoredResume
} from '@/hooks/use-tailored-resume';

const PdfPreviewPanel = lazy(() =>
  import('@/components/resume/builder/PdfPreviewPanel').then(m => ({ default: m.PdfPreviewPanel }))
);

const builderSearchSchema = z.object({
  resumeId: z.string().uuid().optional().catch(undefined)
});

export const Route = createFileRoute('/resume/builder')({
  validateSearch: builderSearchSchema.parse,
  component: BuilderPage
});

// ── Types ─────────────────────────────────────────────────────────────────────

type LlmProposals = {
  headlineOptions: string[];
  rankedExperiences: Array<{ experienceId: string; rankedBulletIds: string[] }>;
  rankedSkillIds: string[];
  assessment: string;
};

// ── JD Input Modal ─────────────────────────────────────────────────────────────

type JdInputModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (jdContent: string) => void;
  isPending: boolean;
};

function JdInputModal({ open, onClose, onSubmit, isPending }: JdInputModalProps) {
  const [jdContent, setJdContent] = useState('');

  useEffect(() => {
    if (open) setJdContent('');
  }, [open]);

  const handleSubmit = () => {
    const trimmed = jdContent.trim();
    if (!trimmed) {
      toast.error('Please paste a job description');
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tailor from Job Description</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="jd-content">Job Description</Label>
          <textarea
            id="jd-content"
            value={jdContent}
            onChange={e => setJdContent(e.target.value)}
            rows={14}
            placeholder="Paste the full job description here (Markdown or plain text)..."
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending || !jdContent.trim()}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Tailored Resume'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── LLM Proposals Panel ────────────────────────────────────────────────────────

type LlmProposalsPanelProps = {
  proposals: LlmProposals;
  selectedHeadline: string;
  onSelectHeadline: (text: string) => void;
};

function LlmProposalsPanel({ proposals, selectedHeadline, onSelectHeadline }: LlmProposalsPanelProps) {
  return (
    <div className="border-b border-border bg-amber-50/50 px-6 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-semibold text-amber-800">AI Proposals</span>
      </div>

      {/* Headline options */}
      {proposals.headlineOptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Headline Options</p>
          <div className="flex flex-col gap-1.5">
            {proposals.headlineOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => onSelectHeadline(option)}
                className={`text-left text-sm px-3 py-2 rounded-md border transition-colors cursor-pointer ${
                  selectedHeadline === option
                    ? 'border-amber-400 bg-amber-100 text-amber-900 font-medium'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Assessment */}
      {proposals.assessment && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assessment</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{proposals.assessment}</p>
        </div>
      )}
    </div>
  );
}

// ── Builder toolbar ────────────────────────────────────────────────────────────

type BuilderToolbarProps = {
  mode: 'generic' | 'tailored';
  onTailorFromJd: () => void;
  onSave: () => void;
  isSaving: boolean;
  onGeneratePdf: () => void;
  isGeneratingPdf: boolean;
};

function BuilderToolbar({
  mode,
  onTailorFromJd,
  onSave,
  isSaving,
  onGeneratePdf,
  isGeneratingPdf
}: BuilderToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${mode === 'tailored' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}
        >
          {mode === 'tailored' ? 'Tailored' : 'Generic'}
        </span>
      </div>

      <div className="flex-1" />

      {mode === 'generic' && (
        <button
          type="button"
          onClick={onTailorFromJd}
          className="px-4 py-1.5 rounded-md text-[13px] font-medium cursor-pointer flex items-center gap-2 border border-border text-foreground hover:bg-muted transition-colors"
        >
          <Wand2 className="w-4 h-4" />
          Tailor from Job Description
        </button>
      )}

      <button
        type="button"
        disabled={isSaving}
        onClick={onSave}
        className="px-4 py-1.5 rounded-md text-[13px] font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-border text-foreground hover:bg-muted transition-colors"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            Save
          </>
        )}
      </button>

      <button
        type="button"
        disabled={isGeneratingPdf}
        onClick={onGeneratePdf}
        className="px-4 py-1.5 rounded-md text-[13px] font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
      >
        {isGeneratingPdf ? (
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
  );
}

// ── Generic Mode ──────────────────────────────────────────────────────────────

function GenericModeBuilder() {
  const navigate = useNavigate({ from: '/resume/builder' });
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: experiencesRaw, isLoading: experiencesLoading } = useExperiences();
  const { data: educationsRaw, isLoading: educationsLoading } = useEducations();
  const { data: resumeProfile, isLoading: resumeProfileLoading } = useResumeProfile();
  const updateResumeProfile = useUpdateResumeProfile();
  const generatePdf = useGenerateResumeProfilePdf();
  const createTailoredResume = useCreateTailoredResume();

  const experiences = useMemo(
    () => ((experiencesRaw ?? []) as Experience[]).sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [experiencesRaw]
  );
  const educations = (educationsRaw ?? []) as Education[];

  const isLoading = profileLoading || experiencesLoading || educationsLoading || resumeProfileLoading;

  // ── Local content-selection state (driven from saved resumeProfile) ──────────
  const [headlineText, setHeadlineText] = useState('');
  const [visibleBulletIds, setVisibleBulletIds] = useState<Map<string, Set<string>>>(new Map());
  const [visibleEducationIds, setVisibleEducationIds] = useState<Set<string>>(new Set());
  const [skillCategoryIds, setSkillCategoryIds] = useState<string[]>([]);
  const [skillItemIds, setSkillItemIds] = useState<string[]>([]);

  // Sync from loaded resumeProfile
  useEffect(() => {
    if (!resumeProfile) return;
    setHeadlineText(resumeProfile.headlineText ?? '');
    const bulletMap = new Map<string, Set<string>>();
    for (const es of resumeProfile.contentSelection.experienceSelections) {
      bulletMap.set(es.experienceId, new Set(es.bulletIds));
    }
    setVisibleBulletIds(bulletMap);
    setVisibleEducationIds(new Set(resumeProfile.contentSelection.educationIds));
    setSkillCategoryIds(resumeProfile.contentSelection.skillCategoryIds);
    setSkillItemIds(resumeProfile.contentSelection.skillItemIds);
  }, [resumeProfile]);

  // ── Modal state ───────────────────────────────────────────────────────────────
  const [personalInfoModalOpen, setPersonalInfoModalOpen] = useState(false);
  const [headlineModalOpen, setHeadlineModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [experienceDialogOpen, setExperienceDialogOpen] = useState(false);
  const [educationDialogOpen, setEducationDialogOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | undefined>();
  const [jdModalOpen, setJdModalOpen] = useState(false);

  const nextExperienceOrdinal = experiences.length > 0 ? Math.max(...experiences.map(e => e.ordinal)) + 1 : 0;
  const nextEducationOrdinal = educations.length > 0 ? Math.max(...educations.map(e => e.ordinal)) + 1 : 0;

  // ── PDF preview ──────────────────────────────────────────────────────────────
  const pdfSelection = useMemo(() => {
    if (!resumeProfile) return null;
    return {
      headlineText,
      experienceSelections: [...visibleBulletIds.entries()].map(([experienceId, bulletIds]) => ({
        experienceId,
        bulletIds: [...bulletIds]
      })),
      educationIds: [...visibleEducationIds],
      skillCategoryIds,
      skillItemIds
    };
  }, [headlineText, visibleBulletIds, visibleEducationIds, skillCategoryIds, skillItemIds, resumeProfile]);

  const { pdfData, isCompiling, error: pdfError } = usePdfPreview(pdfSelection);

  // ── Callbacks ─────────────────────────────────────────────────────────────────
  const handleBulletVisibilityChange = useCallback((expId: string, bulletIds: Set<string>) => {
    setVisibleBulletIds(prev => {
      const next = new Map(prev);
      if (bulletIds.size > 0) {
        next.set(expId, new Set(bulletIds));
      } else {
        next.delete(expId);
      }
      return next;
    });
  }, []);

  const toggleEducation = useCallback((id: string) => {
    setVisibleEducationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleHeadlineChange = useCallback((text: string) => {
    setHeadlineText(text);
  }, []);

  const handleSave = useCallback(() => {
    const experienceSelections = [...visibleBulletIds.entries()]
      .filter(([, bulletIds]) => bulletIds.size > 0)
      .map(([expId, bulletIds]) => ({
        experience_id: expId,
        bullet_ids: [...bulletIds]
      }));
    updateResumeProfile.mutate(
      {
        content_selection: {
          experience_selections: experienceSelections,
          project_ids: [],
          education_ids: [...visibleEducationIds],
          skill_category_ids: skillCategoryIds,
          skill_item_ids: skillItemIds
        },
        headline_text: headlineText
      },
      {
        onSuccess: () => toast.success('Resume profile saved'),
        onError: () => toast.error('Failed to save resume profile')
      }
    );
  }, [visibleBulletIds, visibleEducationIds, skillCategoryIds, skillItemIds, headlineText, updateResumeProfile]);

  const handleGeneratePdf = useCallback(() => {
    generatePdf.mutate(undefined, {
      onSuccess: result => {
        if (result?.pdfPath) {
          toast.success('PDF generated successfully');
        }
      },
      onError: () => toast.error('Failed to generate PDF')
    });
  }, [generatePdf]);

  const handleCreateTailored = useCallback(
    (jdContent: string) => {
      createTailoredResume.mutate(
        { jd_content: jdContent },
        {
          onSuccess: result => {
            setJdModalOpen(false);
            if (result?.id) {
              navigate({ search: { resumeId: result.id } });
            }
          },
          onError: () => toast.error('Failed to create tailored resume')
        }
      );
    },
    [createTailoredResume, navigate]
  );

  const editingExperiences = useMemo(() => {
    if (!editingCompany) return [];
    return experiences.filter(e => e.companyName === editingCompany);
  }, [editingCompany, experiences]);

  return (
    <div className="flex flex-col h-full">
      <BuilderToolbar
        mode="generic"
        onTailorFromJd={() => setJdModalOpen(true)}
        onSave={handleSave}
        isSaving={updateResumeProfile.isPending}
        onGeneratePdf={handleGeneratePdf}
        isGeneratingPdf={generatePdf.isPending}
      />

      {/* Document area */}
      <div className="flex-1 grid grid-cols-2 min-h-0">
        {/* Left: interactive preview */}
        <div
          className="overflow-y-auto bg-white h-full"
          style={{ '--section-accent': '#3b82f6', '--section-hover': 'rgba(59,130,246,0.06)' } as React.CSSProperties}
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
              headlineText={headlineText}
              experiences={experiences}
              visibleBulletIds={visibleBulletIds}
              educations={educations}
              visibleEducationIds={visibleEducationIds}
              onEditPersonalInfo={() => setPersonalInfoModalOpen(true)}
              onEditHeadline={() => setHeadlineModalOpen(true)}
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

      <HeadlineEditModal
        open={headlineModalOpen}
        onClose={() => setHeadlineModalOpen(false)}
        headlineText={headlineText}
        onSave={handleHeadlineChange}
      />

      {editingCompany && (
        <ExperienceEditModal
          open={!!editingCompany}
          onClose={() => setEditingCompany(null)}
          company={editingCompany}
          experiences={editingExperiences}
          visibleBulletIds={visibleBulletIds}
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

      <JdInputModal
        open={jdModalOpen}
        onClose={() => setJdModalOpen(false)}
        onSubmit={handleCreateTailored}
        isPending={createTailoredResume.isPending}
      />
    </div>
  );
}

// ── Tailored Mode ─────────────────────────────────────────────────────────────

type TailoredModeBuilderProps = {
  resumeId: string;
};

function TailoredModeBuilder({ resumeId }: TailoredModeBuilderProps) {
  const navigate = useNavigate({ from: '/resume/builder' });
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: experiencesRaw, isLoading: experiencesLoading } = useExperiences();
  const { data: educationsRaw, isLoading: educationsLoading } = useEducations();
  const { data: tailoredResume, isLoading: tailoredLoading } = useTailoredResume(resumeId);
  const updateTailored = useUpdateTailoredResume(resumeId);
  const generatePdf = useGenerateTailoredResumePdf(resumeId);

  const experiences = useMemo(
    () => ((experiencesRaw ?? []) as Experience[]).sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [experiencesRaw]
  );
  const educations = (educationsRaw ?? []) as Education[];

  const isLoading = profileLoading || experiencesLoading || educationsLoading || tailoredLoading;

  // ── Local state (initialized from tailoredResume, proposals pre-applied) ─────
  const [headlineText, setHeadlineText] = useState('');
  const [visibleBulletIds, setVisibleBulletIds] = useState<Map<string, Set<string>>>(new Map());
  const [visibleEducationIds, setVisibleEducationIds] = useState<Set<string>>(new Set());
  const [skillCategoryIds, setSkillCategoryIds] = useState<string[]>([]);
  const [skillItemIds, setSkillItemIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // On first load, initialize from resume data (content_selection already reflects proposals)
  useEffect(() => {
    if (!tailoredResume || initialized) return;
    setInitialized(true);

    const cs = tailoredResume.contentSelection;
    const bulletMap = new Map<string, Set<string>>();
    for (const es of cs.experienceSelections) {
      bulletMap.set(es.experienceId, new Set(es.bulletIds));
    }
    setVisibleBulletIds(bulletMap);
    setVisibleEducationIds(new Set(cs.educationIds));
    setSkillCategoryIds(cs.skillCategoryIds);
    setSkillItemIds(cs.skillItemIds);
    setHeadlineText(tailoredResume.headlineText ?? '');
  }, [tailoredResume, initialized]);

  // ── Modal state ───────────────────────────────────────────────────────────────
  const [personalInfoModalOpen, setPersonalInfoModalOpen] = useState(false);
  const [headlineModalOpen, setHeadlineModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [experienceDialogOpen, setExperienceDialogOpen] = useState(false);
  const [educationDialogOpen, setEducationDialogOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | undefined>();
  const [showAssessment, setShowAssessment] = useState(false);

  const nextExperienceOrdinal = experiences.length > 0 ? Math.max(...experiences.map(e => e.ordinal)) + 1 : 0;
  const nextEducationOrdinal = educations.length > 0 ? Math.max(...educations.map(e => e.ordinal)) + 1 : 0;

  // ── PDF preview ──────────────────────────────────────────────────────────────
  const pdfSelection = useMemo(() => {
    if (!tailoredResume || !initialized) return null;
    return {
      headlineText,
      experienceSelections: [...visibleBulletIds.entries()].map(([experienceId, bulletIds]) => ({
        experienceId,
        bulletIds: [...bulletIds]
      })),
      educationIds: [...visibleEducationIds],
      skillCategoryIds,
      skillItemIds
    };
  }, [
    headlineText,
    visibleBulletIds,
    visibleEducationIds,
    skillCategoryIds,
    skillItemIds,
    tailoredResume,
    initialized
  ]);

  const { pdfData, isCompiling, error: pdfError } = usePdfPreview(pdfSelection);

  // ── Callbacks ─────────────────────────────────────────────────────────────────
  const handleBulletVisibilityChange = useCallback((expId: string, bulletIds: Set<string>) => {
    setVisibleBulletIds(prev => {
      const next = new Map(prev);
      if (bulletIds.size > 0) {
        next.set(expId, new Set(bulletIds));
      } else {
        next.delete(expId);
      }
      return next;
    });
  }, []);

  const toggleEducation = useCallback((id: string) => {
    setVisibleEducationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleHeadlineChange = useCallback((text: string) => {
    setHeadlineText(text);
  }, []);

  const handleSelectProposedHeadline = useCallback((text: string) => {
    setHeadlineText(text);
  }, []);

  const handleSave = useCallback(() => {
    const experienceSelections = [...visibleBulletIds.entries()]
      .filter(([, bulletIds]) => bulletIds.size > 0)
      .map(([expId, bulletIds]) => ({
        experience_id: expId,
        bullet_ids: [...bulletIds]
      }));
    updateTailored.mutate(
      {
        content_selection: {
          experience_selections: experienceSelections,
          project_ids: [],
          education_ids: [...visibleEducationIds],
          skill_category_ids: skillCategoryIds,
          skill_item_ids: skillItemIds
        },
        headline_text: headlineText
      },
      {
        onSuccess: () => toast.success('Tailored resume saved'),
        onError: () => toast.error('Failed to save tailored resume')
      }
    );
  }, [visibleBulletIds, visibleEducationIds, skillCategoryIds, skillItemIds, headlineText, updateTailored]);

  const handleGeneratePdf = useCallback(() => {
    generatePdf.mutate(undefined, {
      onSuccess: result => {
        if (result?.pdfPath) {
          toast.success('PDF generated successfully');
        }
      },
      onError: () => toast.error('Failed to generate PDF')
    });
  }, [generatePdf]);

  const editingExperiences = useMemo(() => {
    if (!editingCompany) return [];
    return experiences.filter(e => e.companyName === editingCompany);
  }, [editingCompany, experiences]);

  const proposals = tailoredResume?.llmProposals as LlmProposals | undefined;

  return (
    <div className="flex flex-col h-full">
      {/* Back to generic link */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-muted/10 text-sm">
        <button
          type="button"
          onClick={() => navigate({ search: {} })}
          className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          ← Back to Generic Resume
        </button>
        {tailoredResume && <span className="text-muted-foreground/50">·</span>}
        {tailoredResume && (
          <span className="text-muted-foreground truncate max-w-sm">
            {tailoredResume.jdContent.slice(0, 80).trim()}...
          </span>
        )}
      </div>

      <BuilderToolbar
        mode="tailored"
        onTailorFromJd={() => {}}
        onSave={handleSave}
        isSaving={updateTailored.isPending}
        onGeneratePdf={handleGeneratePdf}
        isGeneratingPdf={generatePdf.isPending}
      />

      {/* LLM Proposals Panel */}
      {proposals && (
        <>
          <LlmProposalsPanel
            proposals={proposals}
            selectedHeadline={headlineText}
            onSelectHeadline={handleSelectProposedHeadline}
          />
          {proposals.assessment && (
            <div className="px-6 py-2 border-b border-border bg-muted/10">
              <button
                type="button"
                onClick={() => setShowAssessment(v => !v)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                {showAssessment ? 'Hide' : 'Show'} full assessment
              </button>
              {showAssessment && (
                <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{proposals.assessment}</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Document area */}
      <div className="flex-1 grid grid-cols-2 min-h-0">
        {/* Left: interactive preview */}
        <div
          className="overflow-y-auto bg-white h-full"
          style={{ '--section-accent': '#f59e0b', '--section-hover': 'rgba(245,158,11,0.06)' } as React.CSSProperties}
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
              headlineText={headlineText}
              experiences={experiences}
              visibleBulletIds={visibleBulletIds}
              educations={educations}
              visibleEducationIds={visibleEducationIds}
              onEditPersonalInfo={() => setPersonalInfoModalOpen(true)}
              onEditHeadline={() => setHeadlineModalOpen(true)}
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

      <HeadlineEditModal
        open={headlineModalOpen}
        onClose={() => setHeadlineModalOpen(false)}
        headlineText={headlineText}
        onSave={handleHeadlineChange}
      />

      {editingCompany && (
        <ExperienceEditModal
          open={!!editingCompany}
          onClose={() => setEditingCompany(null)}
          company={editingCompany}
          experiences={editingExperiences}
          visibleBulletIds={visibleBulletIds}
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

// ── Root page ─────────────────────────────────────────────────────────────────

function BuilderPage() {
  const { resumeId } = Route.useSearch();

  return (
    <div className="-m-6 flex flex-col min-h-[calc(100vh-1px)]">
      {/* Sticky header */}
      <div className="sticky top-0 z-20">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h1 className="text-2xl font-bold">Resume Builder</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {resumeId ? <TailoredModeBuilder resumeId={resumeId} /> : <GenericModeBuilder />}
      </div>
    </div>
  );
}
