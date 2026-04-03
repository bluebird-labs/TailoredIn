import { ArrowLeft, Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useGenerateTailoredResumePdf, useTailoredResume, useUpdateTailoredResume } from '@/hooks/use-tailored-resume';

type Props = {
  resumeId: string;
  onReset: () => void;
};

export function FactoryReviewStep({ resumeId, onReset }: Props) {
  const { data: resume, isLoading } = useTailoredResume(resumeId);
  const updateResume = useUpdateTailoredResume(resumeId);
  const generatePdf = useGenerateTailoredResumePdf(resumeId);
  const [selectedHeadline, setSelectedHeadline] = useState<string | null>(null);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading generated resume...</div>;
  if (!resume) return <div className="text-sm text-destructive">Resume not found.</div>;

  const headlineOptions = resume.llmProposals?.headlineOptions ?? [];
  const rankedExperiences = resume.llmProposals?.selectedExperiences ?? [];
  const assessment = resume.llmProposals?.assessment;
  const activeHeadline = selectedHeadline ?? resume.headlineText ?? headlineOptions[0] ?? '';

  async function handleDownload() {
    const contentSelection = resume?.contentSelection ?? {
      experienceSelections: [],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    };

    if (selectedHeadline && selectedHeadline !== resume?.headlineText) {
      await updateResume.mutateAsync({
        content_selection: {
          experience_selections: contentSelection.experienceSelections.map(es => ({
            experience_id: es.experienceId,
            accomplishment_ids: es.accomplishmentIds
          })),
          project_ids: contentSelection.projectIds,
          education_ids: contentSelection.educationIds,
          skill_category_ids: contentSelection.skillCategoryIds,
          skill_item_ids: contentSelection.skillItemIds
        },
        headline_text: activeHeadline
      });
    }

    generatePdf.mutate(undefined, {
      onSuccess: result => {
        if (result?.pdfPath) {
          const a = document.createElement('a');
          a.href = result.pdfPath;
          a.download = `resume-${new Date().toISOString().slice(0, 10)}.pdf`;
          a.click();
        } else {
          toast.error('PDF path not returned');
        }
      },
      onError: () => toast.error('Failed to generate PDF')
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Review Generated Resume</h2>
          <p className="text-sm text-muted-foreground">
            Select a headline, review the fit assessment, then download your PDF.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <ArrowLeft className="h-3 w-3 mr-1" />
            New Resume
          </Button>
          <Button
            onClick={handleDownload}
            disabled={generatePdf.isPending || updateResume.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {generatePdf.isPending || updateResume.isPending ? (
              'Generating PDF...'
            ) : (
              <>
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {assessment && (
        <div className="border rounded-lg p-3 bg-amber-50 dark:bg-amber-950/20">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Fit Assessment</p>
          <p className="text-sm text-muted-foreground">{assessment}</p>
        </div>
      )}

      {headlineOptions.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/30 px-3 py-2 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Choose a Headline</p>
          </div>
          <div className="p-3 space-y-2">
            {headlineOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedHeadline(option)}
                className={`w-full text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                  activeHeadline === option
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-border hover:border-muted-foreground/40 text-foreground'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {rankedExperiences.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/30 px-3 py-2 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Ranked Experiences ({rankedExperiences.length})
            </p>
          </div>
          <div className="p-3 space-y-2">
            {rankedExperiences.map((exp, i) => (
              <div key={exp.experienceId} className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground font-mono w-5 pt-0.5 shrink-0">#{i + 1}</span>
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{exp.experienceId}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {exp.selectedAccomplishmentIds.length} accomplishment
                    {exp.selectedAccomplishmentIds.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
