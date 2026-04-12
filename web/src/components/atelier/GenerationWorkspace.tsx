import { Link } from '@tanstack/react-router';
import { Eye, EyeOff, Loader2, RotateCw, Settings, Sparkles, Target } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useEducations } from '@/hooks/use-educations';
import { useExperiences } from '@/hooks/use-experiences';
import { type ResumeOutputExperience, useJobDescription } from '@/hooks/use-job-descriptions';
import { useGenerateResumeContent, useUpdateResumeDisplaySettings } from '@/hooks/use-resume';
import { useScoreResume } from '@/hooks/use-resume-score';
import { BulletRangePill } from './BulletRangePill.js';
import { JobSelector } from './JobSelector.js';

function formatMonthYear(value: string): string {
  if (!value) return '';
  const [year, month] = value.split('-');
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatCurrentContent(summary: string | undefined, bullets: string[]): string {
  const parts: string[] = [];
  if (summary) parts.push(`Summary: ${summary}`);
  for (const [i, b] of bullets.entries()) parts.push(`${i + 1}. ${b}`);
  return parts.join('\n');
}

function formatFullOutput(output: { headline?: string; experiences: readonly ResumeOutputExperience[] }): string {
  const parts: string[] = [];
  if (output.headline) parts.push(`Headline: ${output.headline}`);
  for (const exp of output.experiences) {
    parts.push(`\n${exp.experienceTitle} — ${exp.companyName}`);
    parts.push(formatCurrentContent(exp.summary, exp.bullets));
  }
  return parts.join('\n');
}

function RegeneratePopover({
  isRegenerating,
  onRegenerate,
  triggerTitle,
  currentContent,
  initialPrompt
}: {
  isRegenerating: boolean;
  onRegenerate: (prompt: string) => void;
  triggerTitle: string;
  currentContent?: string;
  initialPrompt?: string;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(initialPrompt ?? '');
  const [includeCurrentVersion, setIncludeCurrentVersion] = useState(false);

  function handleSubmit() {
    let finalPrompt = prompt.trim();
    if (includeCurrentVersion && currentContent) {
      finalPrompt = `Current version:\n${currentContent}${finalPrompt ? `\n\nInstructions: ${finalPrompt}` : ''}`;
    }
    onRegenerate(finalPrompt);
    setOpen(false);
    setPrompt('');
    setIncludeCurrentVersion(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={nextOpen => {
        setOpen(nextOpen);
        if (nextOpen) {
          setPrompt(initialPrompt ?? '');
        }
        if (!nextOpen) {
          setIncludeCurrentVersion(false);
        }
      }}
    >
      <PopoverTrigger
        render={<button type="button" />}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        disabled={isRegenerating}
        title={triggerTitle}
      >
        {isRegenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
      </PopoverTrigger>
      <PopoverContent className="w-72 border shadow-none" align="end">
        <Textarea
          placeholder="Optional instructions..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          className="min-h-[56px] resize-none text-[13px]"
        />
        {currentContent && (
          <label className="flex cursor-pointer items-center gap-2 py-1 text-[12px] text-muted-foreground">
            <input
              type="checkbox"
              checked={includeCurrentVersion}
              onChange={e => setIncludeCurrentVersion(e.target.checked)}
              className="rounded"
            />
            Include current version as reference
          </label>
        )}
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={handleSubmit}>
            <RotateCw className="mr-1.5 h-3.5 w-3.5" />
            Regenerate
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ExperienceCard({
  exp,
  defaultBulletMin,
  defaultBulletMax,
  bulletOverride,
  onToggleBullet,
  onBulletRangeSave,
  onBulletRangeReset,
  onRegenerate,
  isRegenerating,
  initialPrompt
}: {
  exp: ResumeOutputExperience;
  defaultBulletMin: number;
  defaultBulletMax: number;
  bulletOverride: { min: number; max: number } | null;
  onToggleBullet: (experienceId: string, bulletIndex: number) => void;
  onBulletRangeSave: (experienceId: string, min: number, max: number) => void;
  onBulletRangeReset: (experienceId: string) => void;
  onRegenerate: (prompt: string) => void;
  isRegenerating: boolean;
  initialPrompt?: string;
}) {
  const startFormatted = formatMonthYear(exp.startDate);
  const endFormatted = formatMonthYear(exp.endDate);
  const dateRange = startFormatted && endFormatted ? `${startFormatted} — ${endFormatted}` : '';
  const hiddenSet = new Set(exp.hiddenBulletIndices);
  const isOverridden = bulletOverride !== null;
  const bulletMin = bulletOverride?.min ?? defaultBulletMin;
  const bulletMax = bulletOverride?.max ?? defaultBulletMax;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="truncate text-[14px] font-medium text-foreground">{exp.experienceTitle}</p>
            <BulletRangePill
              min={bulletMin}
              max={bulletMax}
              isOverridden={isOverridden}
              onSave={(min, max) => onBulletRangeSave(exp.experienceId, min, max)}
              onReset={isOverridden ? () => onBulletRangeReset(exp.experienceId) : undefined}
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[13px] text-muted-foreground">{exp.companyName}</p>
            {dateRange && <p className="text-[12px] text-muted-foreground">{dateRange}</p>}
          </div>
        </div>
        <RegeneratePopover
          isRegenerating={isRegenerating}
          onRegenerate={onRegenerate}
          triggerTitle="Regenerate this experience"
          currentContent={formatCurrentContent(exp.summary, exp.bullets)}
          initialPrompt={initialPrompt}
        />
      </div>
      {exp.summary && <p className="text-[13px] italic text-muted-foreground">{exp.summary}</p>}
      <ul className="space-y-1">
        {exp.bullets.map((bullet, i) => {
          const isHidden = hiddenSet.has(i);
          return (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: static ordered list
              key={i}
              className={`flex items-start gap-2 text-[13px] leading-relaxed${isHidden ? ' opacity-40' : ''}`}
            >
              <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
              <span className="flex-1">{bullet}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                onClick={() => onToggleBullet(exp.experienceId, i)}
                title={isHidden ? 'Show in resume' : 'Hide from resume'}
              >
                {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function GenerationWorkspace({
  selectedJobId,
  onSelectJob,
  onScoreComplete
}: {
  selectedJobId: string | null;
  onSelectJob: (id: string | null) => void;
  onScoreComplete: () => void;
}) {
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [includeCurrentVersion, setIncludeCurrentVersion] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [sessionOverrides, setSessionOverrides] = useState<Map<string, { min: number; max: number }>>(new Map());

  const { data: jd } = useJobDescription(selectedJobId ?? '', { enabled: !!selectedJobId });
  const { data: experiences } = useExperiences();
  const { data: educations } = useEducations();
  const generate = useGenerateResumeContent(selectedJobId ?? '');
  const updateDisplaySettings = useUpdateResumeDisplaySettings(selectedJobId ?? '');
  const scoreResume = useScoreResume(jd?.resumeOutput?.resumeContentId ?? '', selectedJobId ?? '');

  const resumeOutput = jd?.resumeOutput ?? null;

  const scopedInstructions = resumeOutput?.scopedInstructions ?? {};

  const prevJobIdRef = useRef(selectedJobId);
  // biome-ignore lint/correctness/useExhaustiveDependencies: additionalPrompt intentionally excluded — only sync on JD/job change
  useEffect(() => {
    const jobChanged = selectedJobId !== prevJobIdRef.current;
    prevJobIdRef.current = selectedJobId;
    const resumeInstructions = jd?.resumeOutput?.scopedInstructions?.resume;
    if (resumeInstructions != null && (jobChanged || additionalPrompt === '')) {
      setAdditionalPrompt(resumeInstructions);
    }
  }, [selectedJobId, jd?.resumeOutput?.scopedInstructions]);

  const experienceBulletMap = useMemo(() => {
    const map = new Map<string, { min: number; max: number }>();
    for (const exp of experiences ?? []) {
      map.set(exp.id, { min: exp.bulletMin, max: exp.bulletMax });
    }
    return map;
  }, [experiences]);

  function buildBulletOverrides(): Array<{ experienceId: string; min: number; max: number }> | undefined {
    if (sessionOverrides.size === 0) return undefined;
    return [...sessionOverrides.entries()].map(([experienceId, { min, max }]) => ({ experienceId, min, max }));
  }

  function handleGenerate() {
    const rawInstructions = additionalPrompt.trim();
    let prompt = rawInstructions;
    if (includeCurrentVersion && resumeOutput) {
      const content = formatFullOutput(resumeOutput);
      prompt = `Current version:\n${content}${prompt ? `\n\nInstructions: ${prompt}` : ''}`;
    }
    generate.mutate(
      {
        additionalPrompt: prompt || undefined,
        customInstructions: rawInstructions || undefined,
        bulletOverrides: buildBulletOverrides()
      },
      {
        onSuccess: () => {
          setAdditionalPrompt('');
          setIncludeCurrentVersion(false);
          toast.success('Resume content generated');
        },
        onError: err => toast.error(err instanceof Error ? err.message : 'Generation failed')
      }
    );
  }

  function handleRegenerateHeadline(prompt: string) {
    setRegeneratingId('headline');
    generate.mutate(
      { additionalPrompt: prompt || undefined, scope: { type: 'headline' }, bulletOverrides: buildBulletOverrides() },
      {
        onSuccess: () => {
          setRegeneratingId(null);
          toast.success('Headline regenerated');
        },
        onError: err => {
          setRegeneratingId(null);
          toast.error(err instanceof Error ? err.message : 'Headline regeneration failed');
        }
      }
    );
  }

  function handleRegenerateExperience(experienceId: string, prompt: string) {
    setRegeneratingId(experienceId);
    generate.mutate(
      {
        additionalPrompt: prompt || undefined,
        scope: { type: 'experience', experienceId },
        bulletOverrides: buildBulletOverrides()
      },
      {
        onSuccess: () => {
          setRegeneratingId(null);
          toast.success('Experience regenerated');
        },
        onError: err => {
          setRegeneratingId(null);
          toast.error(err instanceof Error ? err.message : 'Experience regeneration failed');
        }
      }
    );
  }

  const handleToggleBullet = useCallback(
    (experienceId: string, bulletIndex: number) => {
      if (!resumeOutput) return;
      const exp = resumeOutput.experiences.find(e => e.experienceId === experienceId);
      const current = exp?.hiddenBulletIndices ?? [];
      const next = current.includes(bulletIndex) ? current.filter(i => i !== bulletIndex) : [...current, bulletIndex];
      updateDisplaySettings.mutate({ experienceHiddenBullets: [{ experienceId, hiddenBulletIndices: next }] });
    },
    [resumeOutput, updateDisplaySettings]
  );

  const handleToggleEducation = useCallback(
    (educationId: string) => {
      if (!resumeOutput) return;
      const hiddenEducationIds = resumeOutput.hiddenEducationIds;
      const isHidden = hiddenEducationIds.includes(educationId);
      const next = isHidden
        ? hiddenEducationIds.filter(id => id !== educationId)
        : [...hiddenEducationIds, educationId];
      updateDisplaySettings.mutate({ hiddenEducationIds: next });
    },
    [resumeOutput, updateDisplaySettings]
  );

  const handleBulletRangeSave = useCallback((experienceId: string, min: number, max: number) => {
    setSessionOverrides(prev => {
      const next = new Map(prev);
      next.set(experienceId, { min, max });
      return next;
    });
    toast.success('Bullet range updated for this session');
  }, []);

  const handleBulletRangeReset = useCallback((experienceId: string) => {
    setSessionOverrides(prev => {
      const next = new Map(prev);
      next.delete(experienceId);
      return next;
    });
    toast.success('Bullet range reset to experience default');
  }, []);

  return (
    <div
      className="flex h-full w-[755px] shrink-0 flex-col overflow-y-auto p-6"
      style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: '13.3px', lineHeight: '1.3' }}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <JobSelector value={selectedJobId} onChange={onSelectJob} />
          </div>
          <Link
            to="/settings"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            title="Generation settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-3">
          <Textarea
            placeholder="Optional: add instructions to steer the generation..."
            value={additionalPrompt}
            onChange={e => setAdditionalPrompt(e.target.value)}
            className="min-h-[72px] resize-none text-[13px]"
          />
          {resumeOutput && (
            <label className="flex cursor-pointer items-center gap-2 py-1 text-[12px] text-muted-foreground">
              <input
                type="checkbox"
                checked={includeCurrentVersion}
                onChange={e => setIncludeCurrentVersion(e.target.checked)}
                className="rounded"
              />
              Include current version as reference
            </label>
          )}
          <div className="flex justify-end gap-2">
            {resumeOutput && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  scoreResume.mutate(undefined, {
                    onSuccess: () => {
                      toast.success('Resume scored');
                      onScoreComplete();
                    },
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
                    {resumeOutput.score ? 'Re-score' : 'Score'}
                  </>
                )}
              </Button>
            )}
            <Button size="sm" onClick={handleGenerate} disabled={!selectedJobId || generate.isPending}>
              {generate.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Generate Resume
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {resumeOutput && (
        <div className="mt-5 space-y-4">
          {resumeOutput.headline && (
            <div className="rounded-lg border p-4">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[12px] text-muted-foreground">Headline</p>
                <RegeneratePopover
                  isRegenerating={regeneratingId === 'headline'}
                  onRegenerate={handleRegenerateHeadline}
                  triggerTitle="Regenerate headline"
                  currentContent={resumeOutput.headline}
                  initialPrompt={scopedInstructions.headline}
                />
              </div>
              <p className="text-[15px] text-foreground">{resumeOutput.headline}</p>
            </div>
          )}

          <div className="space-y-3">
            {resumeOutput.experiences.map(exp => {
              const expDefaults = experienceBulletMap.get(exp.experienceId);
              return (
                <ExperienceCard
                  key={exp.experienceId}
                  exp={exp}
                  defaultBulletMin={expDefaults?.min ?? 2}
                  defaultBulletMax={expDefaults?.max ?? 5}
                  bulletOverride={sessionOverrides.get(exp.experienceId) ?? null}
                  onToggleBullet={handleToggleBullet}
                  onBulletRangeSave={handleBulletRangeSave}
                  onBulletRangeReset={handleBulletRangeReset}
                  onRegenerate={prompt => handleRegenerateExperience(exp.experienceId, prompt)}
                  isRegenerating={regeneratingId === exp.experienceId}
                  initialPrompt={scopedInstructions[`experience:${exp.experienceId}`]}
                />
              );
            })}
          </div>

          {educations && educations.length > 0 && (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-[12px] text-muted-foreground">Education</p>
              <div className="space-y-2">
                {educations.map(edu => {
                  const isHidden = resumeOutput.hiddenEducationIds.includes(edu.id);
                  return (
                    <div
                      key={edu.id}
                      className={`flex items-center justify-between gap-2 py-1${isHidden ? ' opacity-40' : ''}`}
                    >
                      <div>
                        <p className="text-[13px] text-foreground">{edu.degreeTitle}</p>
                        <p className="text-[12px] text-muted-foreground">{edu.institutionName}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0"
                        onClick={() => handleToggleEducation(edu.id)}
                        title={isHidden ? 'Show in resume' : 'Hide from resume'}
                      >
                        {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
