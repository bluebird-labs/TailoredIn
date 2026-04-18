import { Badge } from '@/components/ui/badge';
import type { FitScore } from '@/hooks/use-job-descriptions';

type FitRequirementScore = FitScore['requirements'][number];

const coverageConfig = {
  strong: { label: 'Strong', variant: 'default' as const },
  partial: { label: 'Partial', variant: 'secondary' as const },
  not_evidenced: { label: 'Not Evidenced', variant: 'outline' as const },
  absent: { label: 'Absent', variant: 'destructive' as const }
};

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBgColor(score: number): string {
  if (score >= 70) return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800';
  if (score >= 40) return 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800';
  return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800';
}

const groupBgColor = {
  absent: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
  not_evidenced: 'bg-slate-50 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800',
  partial: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
  strong: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
};

function CoverageGroup({
  label,
  count,
  requirements,
  bgClass
}: {
  label: string;
  count: number;
  requirements: FitRequirementScore[];
  bgClass: string;
}) {
  if (requirements.length === 0) return null;

  return (
    <details className={`rounded-lg border ${bgClass} [&[open]>summary]:mb-1.5`}>
      <summary className="cursor-pointer px-3 py-2 text-[12px] text-foreground">
        {label} ({count})
      </summary>
      <div className="space-y-1.5 px-3 pb-3">
        {requirements.map((req, i) => {
          const config = coverageConfig[req.coverage];
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: static ordered list within group
            <div key={i} className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Badge variant={config.variant} className="shrink-0 text-[10px]">
                  {config.label}
                </Badge>
                <span className="text-[13px] text-foreground">{req.requirement}</span>
              </div>
              <p className="pl-[52px] text-[12px] text-muted-foreground">{req.reasoning}</p>
            </div>
          );
        })}
      </div>
    </details>
  );
}

export function FitScorePanel({ score }: { score: FitScore }) {
  const strong = score.requirements.filter(r => r.coverage === 'strong');
  const partial = score.requirements.filter(r => r.coverage === 'partial');
  const notEvidenced = score.requirements.filter(r => r.coverage === 'not_evidenced');
  const absent = score.requirements.filter(r => r.coverage === 'absent');

  return (
    <div className="space-y-4 rounded-[14px] border bg-card p-4">
      <div className={`flex items-start justify-between gap-4 rounded-lg border p-3 ${scoreBgColor(score.overall)}`}>
        <div>
          <p className="text-[12px] text-muted-foreground">Fit Score</p>
          <p className={`text-[28px] font-medium leading-tight ${scoreColor(score.overall)}`}>{score.overall}</p>
        </div>
        <p className="flex-1 pt-1 text-[13px] leading-relaxed text-foreground">{score.summary}</p>
      </div>

      <div className="space-y-3">
        <CoverageGroup label="Missing" count={absent.length} requirements={absent} bgClass={groupBgColor.absent} />
        <CoverageGroup
          label="Not Evidenced"
          count={notEvidenced.length}
          requirements={notEvidenced}
          bgClass={groupBgColor.not_evidenced}
        />
        <CoverageGroup label="Partial" count={partial.length} requirements={partial} bgClass={groupBgColor.partial} />
        <CoverageGroup label="Covered" count={strong.length} requirements={strong} bgClass={groupBgColor.strong} />
      </div>
    </div>
  );
}
