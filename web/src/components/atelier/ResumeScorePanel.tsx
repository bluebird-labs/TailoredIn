import { Badge } from '@/components/ui/badge';
import type { ResumeScore } from '@/hooks/use-job-descriptions';

const coverageConfig = {
  strong: { label: 'Strong', variant: 'default' as const },
  partial: { label: 'Partial', variant: 'secondary' as const },
  absent: { label: 'Absent', variant: 'destructive' as const }
};

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

export function ResumeScorePanel({ score }: { score: ResumeScore }) {
  const strongCount = score.requirements.filter(r => r.coverage === 'strong').length;
  const partialCount = score.requirements.filter(r => r.coverage === 'partial').length;
  const absentCount = score.requirements.filter(r => r.coverage === 'absent').length;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] text-muted-foreground">Resume Score</p>
          <p className={`text-[28px] font-medium leading-tight ${scoreColor(score.overall)}`}>{score.overall}</p>
        </div>
        <div className="flex gap-3 text-[12px] text-muted-foreground">
          <span className="text-emerald-600">{strongCount} strong</span>
          <span className="text-amber-600">{partialCount} partial</span>
          <span className="text-red-600">{absentCount} absent</span>
        </div>
      </div>

      <p className="text-[13px] leading-relaxed text-muted-foreground">{score.summary}</p>

      <div className="space-y-2">
        <p className="text-[12px] text-muted-foreground">Requirements Coverage</p>
        <div className="space-y-1.5">
          {score.requirements.map((req, i) => {
            const config = coverageConfig[req.coverage];
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: static ordered list
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
      </div>
    </div>
  );
}
