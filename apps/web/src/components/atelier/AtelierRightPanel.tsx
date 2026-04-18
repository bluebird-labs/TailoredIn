import { Loader2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { type ResumeScore, useJobDescription } from '@/hooks/use-job-descriptions';
import { useScoreResume } from '@/hooks/use-resume-score';
import { AtelierPdfPreview } from './AtelierPdfPreview.js';
import { ResumeScorePanel } from './ResumeScorePanel.js';

export type AtelierTab = 'pdf' | 'score';

export function AtelierRightPanel({
  selectedJobId,
  activeTab,
  onTabChange
}: {
  selectedJobId: string | null;
  activeTab: AtelierTab;
  onTabChange: (tab: AtelierTab) => void;
}) {
  const { data: jd } = useJobDescription(selectedJobId ?? '', { enabled: !!selectedJobId });

  const resumeOutput = jd?.resumeOutput ?? null;
  const resumeContentId = resumeOutput?.resumeContentId ?? '';
  const score: ResumeScore | null = resumeOutput?.score ?? null;
  const hasScore = score !== null;

  const scoreResume = useScoreResume(resumeContentId, selectedJobId ?? '');

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col border-l">
      <div className="flex items-center gap-0 border-b px-5">
        <TabButton label="PDF Preview" active={activeTab === 'pdf'} onClick={() => onTabChange('pdf')} />
        <TabButton
          label="Scoring Results"
          active={activeTab === 'score'}
          onClick={() => onTabChange('score')}
          muted={!hasScore && !scoreResume.isPending}
        />
      </div>

      {activeTab === 'pdf' && <AtelierPdfPreview selectedJobId={selectedJobId} />}

      {activeTab === 'score' && (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          {score ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-medium text-foreground">Scoring Results</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    scoreResume.mutate(undefined, {
                      onSuccess: () => toast.success('Resume re-scored'),
                      onError: err => toast.error(err instanceof Error ? err.message : 'Scoring failed')
                    })
                  }
                  disabled={scoreResume.isPending}
                >
                  {scoreResume.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Scoring...
                    </>
                  ) : (
                    <>
                      <Target className="mr-1.5 h-3.5 w-3.5" />
                      Re-score
                    </>
                  )}
                </Button>
              </div>
              <ResumeScorePanel score={score} />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <p className="text-[13px] text-muted-foreground">
                {resumeOutput
                  ? 'Score this resume to see how well it matches the job description.'
                  : 'Generate a resume first to enable scoring.'}
              </p>
              {resumeOutput && (
                <Button
                  size="sm"
                  onClick={() =>
                    scoreResume.mutate(undefined, {
                      onSuccess: () => toast.success('Resume scored'),
                      onError: err => toast.error(err instanceof Error ? err.message : 'Scoring failed')
                    })
                  }
                  disabled={scoreResume.isPending}
                >
                  {scoreResume.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Scoring...
                    </>
                  ) : (
                    <>
                      <Target className="mr-1.5 h-3.5 w-3.5" />
                      Score Resume
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
  muted
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-2.5 text-[13px] transition-colors ${
        active
          ? 'border-foreground text-foreground'
          : muted
            ? 'border-transparent text-muted-foreground/40 hover:text-muted-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
