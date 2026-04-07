import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Eye, EyeOff, Loader2, RotateCw, Settings, Sparkles } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useEducations } from '@/hooks/use-educations';
import { useRemoveExperienceOverride, useSetExperienceOverride } from '@/hooks/use-experience-overrides';
import { useGenerationSettings } from '@/hooks/use-generation-settings';
import { type ResumeOutputExperience, useJobDescription } from '@/hooks/use-job-descriptions';
import { useGenerateResumeContent, useUpdateResumeDisplaySettings } from '@/hooks/use-resume';
import { queryKeys } from '@/lib/query-keys';
import { BulletRangePill } from './BulletRangePill.js';
import { JobSelector } from './JobSelector.js';

function formatMonthYear(value: string): string {
  if (!value) return '';
  const [year, month] = value.split('-');
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function RegeneratePopover({
  isRegenerating,
  onRegenerate,
  triggerTitle
}: {
  isRegenerating: boolean;
  onRegenerate: (prompt: string) => void;
  triggerTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');

  function handleSubmit() {
    onRegenerate(prompt.trim());
    setOpen(false);
    setPrompt('');
  }

  return (
    <Popover
      open={open}
      onOpenChange={nextOpen => {
        setOpen(nextOpen);
        if (!nextOpen) setPrompt('');
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
      <PopoverContent className="w-64 border shadow-none" align="end">
        <Textarea
          placeholder="Optional instructions..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          className="min-h-[56px] resize-none text-[13px]"
        />
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
  isRegenerating
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
  onSelectJob
}: {
  selectedJobId: string | null;
  onSelectJob: (id: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const { data: jd } = useJobDescription(selectedJobId ?? '', { enabled: !!selectedJobId });
  const { data: settings } = useGenerationSettings();
  const { data: educations } = useEducations();
  const generate = useGenerateResumeContent(selectedJobId ?? '');
  const updateDisplaySettings = useUpdateResumeDisplaySettings(selectedJobId ?? '');
  const setOverride = useSetExperienceOverride();
  const removeOverride = useRemoveExperienceOverride();

  const resumeOutput = jd?.resumeOutput ?? null;
  const defaultBulletMin = settings?.bulletMin ?? 2;
  const defaultBulletMax = settings?.bulletMax ?? 5;

  const overrideMap = useMemo(() => {
    const map = new Map<string, { min: number; max: number }>();
    for (const o of settings?.experienceOverrides ?? []) {
      map.set(o.experienceId, { min: o.bulletMin, max: o.bulletMax });
    }
    return map;
  }, [settings?.experienceOverrides]);

  function handleGenerate() {
    generate.mutate(
      { additionalPrompt: additionalPrompt.trim() || undefined },
      {
        onSuccess: () => {
          setAdditionalPrompt('');
          toast.success('Resume content generated');
        },
        onError: err => toast.error(err instanceof Error ? err.message : 'Generation failed')
      }
    );
  }

  function handleRegenerateHeadline(prompt: string) {
    setRegeneratingId('headline');
    generate.mutate(
      { additionalPrompt: prompt || undefined, scope: { type: 'headline' } },
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
      { additionalPrompt: prompt || undefined, scope: { type: 'experience', experienceId } },
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

  const handleBulletRangeSave = useCallback(
    (experienceId: string, min: number, max: number) => {
      setOverride.mutate(
        { experienceId, bullet_min: min, bullet_max: max },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.generationSettings.all });
            toast.success('Bullet range updated');
          },
          onError: err => toast.error(err instanceof Error ? err.message : 'Failed to update bullet range')
        }
      );
    },
    [setOverride, queryClient]
  );

  const handleBulletRangeReset = useCallback(
    (experienceId: string) => {
      removeOverride.mutate(experienceId, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.generationSettings.all });
          toast.success('Bullet range reset to default');
        },
        onError: err => toast.error(err instanceof Error ? err.message : 'Failed to reset bullet range')
      });
    },
    [removeOverride, queryClient]
  );

  return (
    <div
      className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto p-6"
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
          <div className="flex justify-end">
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
                />
              </div>
              <p className="text-[15px] text-foreground">{resumeOutput.headline}</p>
            </div>
          )}

          <div className="space-y-3">
            {resumeOutput.experiences.map(exp => (
              <ExperienceCard
                key={exp.experienceId}
                exp={exp}
                defaultBulletMin={defaultBulletMin}
                defaultBulletMax={defaultBulletMax}
                bulletOverride={overrideMap.get(exp.experienceId) ?? null}
                onToggleBullet={handleToggleBullet}
                onBulletRangeSave={handleBulletRangeSave}
                onBulletRangeReset={handleBulletRangeReset}
                onRegenerate={prompt => handleRegenerateExperience(exp.experienceId, prompt)}
                isRegenerating={regeneratingId === exp.experienceId}
              />
            ))}
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
