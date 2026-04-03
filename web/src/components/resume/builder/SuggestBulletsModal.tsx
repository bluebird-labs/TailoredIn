import { Loader2, Wand2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Experience } from '@/components/resume/experience/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type BulletSuggestion, useSuggestBullets } from '@/hooks/use-suggest-bullets';

type ExperienceSelection = { experience_id: string; bullet_ids: string[] };

type SuggestBulletsModalProps = {
  open: boolean;
  onClose: () => void;
  experiences: Experience[];
  onApply: (selections: ExperienceSelection[]) => void;
  onCreateVersion: (selections: ExperienceSelection[]) => void;
};

type Step = 'input' | 'loading' | 'results';

function scoreBadgeClass(score: number): string {
  if (score >= 70) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (score >= 40) return 'bg-amber-100 text-amber-800 border-amber-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

export function SuggestBulletsModal({
  open,
  onClose,
  experiences,
  onApply,
  onCreateVersion
}: SuggestBulletsModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [jobDescription, setJobDescription] = useState('');
  const [suggestions, setSuggestions] = useState<BulletSuggestion[]>([]);
  const [summary, setSummary] = useState('');
  const [selectedBulletIds, setSelectedBulletIds] = useState<Set<string>>(new Set());
  const suggestMutation = useSuggestBullets();

  const bulletMap = useMemo(() => {
    const map = new Map<string, { content: string; experienceId: string }>();
    for (const exp of experiences) {
      for (const b of exp.bullets) {
        map.set(b.id, { content: b.content, experienceId: exp.id });
      }
    }
    return map;
  }, [experiences]);

  const handleAnalyze = useCallback(async () => {
    setStep('loading');
    try {
      const result = await suggestMutation.mutateAsync({ job_description: jobDescription });
      setSuggestions(result.suggestions);
      setSummary(result.summary);
      const autoSelected = new Set(result.suggestions.filter(s => s.score >= 60).map(s => s.bulletId));
      setSelectedBulletIds(autoSelected);
      setStep('results');
    } catch {
      toast.error('Failed to analyze bullets. Please try again.');
      setStep('input');
    }
  }, [jobDescription, suggestMutation]);

  const toggleBullet = useCallback((bulletId: string) => {
    setSelectedBulletIds(prev => {
      const next = new Set(prev);
      if (next.has(bulletId)) next.delete(bulletId);
      else next.add(bulletId);
      return next;
    });
  }, []);

  const buildSelections = useCallback((): ExperienceSelection[] => {
    const byExperience = new Map<string, string[]>();
    for (const bulletId of selectedBulletIds) {
      const info = bulletMap.get(bulletId);
      if (!info) continue;
      const list = byExperience.get(info.experienceId) ?? [];
      list.push(bulletId);
      byExperience.set(info.experienceId, list);
    }
    return Array.from(byExperience.entries()).map(([experienceId, bulletIds]) => ({
      experience_id: experienceId,
      bullet_ids: bulletIds
    }));
  }, [selectedBulletIds, bulletMap]);

  const handleClose = useCallback(() => {
    setStep('input');
    setJobDescription('');
    setSuggestions([]);
    setSummary('');
    setSelectedBulletIds(new Set());
    onClose();
  }, [onClose]);

  const handleApply = useCallback(() => {
    onApply(buildSelections());
    handleClose();
  }, [onApply, buildSelections, handleClose]);

  const handleCreateVersion = useCallback(() => {
    onCreateVersion(buildSelections());
    handleClose();
  }, [onCreateVersion, buildSelections, handleClose]);

  // Group suggestions by experience
  const groupedSuggestions = useMemo(() => {
    const groups: { experience: Experience; bullets: (BulletSuggestion & { content: string })[] }[] = [];
    const expMap = new Map(experiences.map(e => [e.id, e]));
    const byExp = new Map<string, (BulletSuggestion & { content: string })[]>();

    for (const s of suggestions) {
      const info = bulletMap.get(s.bulletId);
      if (!info) continue;
      const list = byExp.get(info.experienceId) ?? [];
      list.push({ ...s, content: info.content });
      byExp.set(info.experienceId, list);
    }

    for (const [expId, bullets] of byExp) {
      const experience = expMap.get(expId);
      if (!experience) continue;
      bullets.sort((a, b) => b.score - a.score);
      groups.push({ experience, bullets });
    }

    groups.sort((a, b) => {
      const maxA = Math.max(...a.bullets.map(b => b.score));
      const maxB = Math.max(...b.bullets.map(b => b.score));
      return maxB - maxA;
    });

    return groups;
  }, [suggestions, experiences, bulletMap]);

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Tailor to Job Description
          </DialogTitle>
        </DialogHeader>

        {step === 'input' && (
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              Paste a job description below. AI will score each of your resume bullets for relevance and suggest which
              ones to include.
            </p>
            <textarea
              className="w-full min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
            />
            <Button onClick={handleAnalyze} disabled={jobDescription.length < 50} className="self-end">
              <Wand2 className="w-4 h-4 mr-2" />
              Analyze Bullets
            </Button>
            {jobDescription.length > 0 && jobDescription.length < 50 && (
              <p className="text-xs text-muted-foreground">
                Need at least 50 characters ({50 - jobDescription.length} more)
              </p>
            )}
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Analyzing your bullets against the job description...</p>
          </div>
        )}

        {step === 'results' && (
          <>
            {summary && <p className="text-sm text-muted-foreground border-l-2 border-muted pl-3 italic">{summary}</p>}
            <ScrollArea className="flex-1 overflow-y-auto max-h-[50vh] pr-2">
              <div className="flex flex-col gap-5">
                {groupedSuggestions.map(({ experience, bullets }) => (
                  <div key={experience.id}>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {experience.companyName} &mdash; {experience.title}
                    </div>
                    <div className="flex flex-col gap-2">
                      {bullets.map(bullet => (
                        <label
                          key={bullet.bulletId}
                          htmlFor={`bullet-${bullet.bulletId}`}
                          className="flex items-start gap-3 p-2.5 rounded-md border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            id={`bullet-${bullet.bulletId}`}
                            checked={selectedBulletIds.has(bullet.bulletId)}
                            onCheckedChange={() => toggleBullet(bullet.bulletId)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={scoreBadgeClass(bullet.score)}>
                                {bullet.score}
                              </Badge>
                              <span className="text-xs text-muted-foreground truncate">{bullet.reasoning}</span>
                            </div>
                            <p className="text-sm leading-snug">{bullet.content}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {groupedSuggestions.length === 0 && (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No suggestions could be generated. Try a different job description.
                  </p>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="flex gap-2 sm:gap-2">
              <div className="text-xs text-muted-foreground mr-auto self-center">
                {selectedBulletIds.size} bullet{selectedBulletIds.size !== 1 ? 's' : ''} selected
              </div>
              <Button variant="outline" onClick={handleCreateVersion} disabled={selectedBulletIds.size === 0}>
                Create New Version
              </Button>
              <Button onClick={handleApply} disabled={selectedBulletIds.size === 0}>
                Apply to Current
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
