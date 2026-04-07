import { Eye, EyeOff, Loader2, RotateCw, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { BulletRangePill } from './BulletRangePill.js';
import { JobSelector } from './JobSelector.js';
import { MOCK_RESUME_OUTPUT, MOCK_SETTINGS, type MockExperience, type MockResumeOutput } from './mock-data.js';

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
  onToggleBullet,
  onBulletRangeSave
}: {
  exp: MockExperience;
  defaultBulletMin: number;
  defaultBulletMax: number;
  onToggleBullet: (experienceId: string, bulletIndex: number) => void;
  onBulletRangeSave: (experienceId: string, min: number, max: number) => void;
}) {
  const [regenerating, setRegenerating] = useState(false);
  const startFormatted = formatMonthYear(exp.startDate);
  const endFormatted = formatMonthYear(exp.endDate);
  const dateRange = startFormatted && endFormatted ? `${startFormatted} — ${endFormatted}` : '';
  const hiddenSet = new Set(exp.hiddenBulletIndices);
  const isOverridden = exp.bulletOverride !== null;
  const bulletMin = exp.bulletOverride?.min ?? defaultBulletMin;
  const bulletMax = exp.bulletOverride?.max ?? defaultBulletMax;

  function handleRegenerate(_prompt: string) {
    setRegenerating(true);
    setTimeout(() => {
      setRegenerating(false);
      toast.success(`Regenerated ${exp.experienceTitle}`);
    }, 500);
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="truncate text-[14px] font-medium text-foreground">{exp.experienceTitle}</p>
            <BulletRangePill
              min={bulletMin}
              max={bulletMax}
              isOverridden={isOverridden}
              onSave={(min, max) => onBulletRangeSave(exp.experienceId, min, max)}
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[13px] text-muted-foreground">{exp.companyName}</p>
            {dateRange && <p className="text-[12px] text-muted-foreground">{dateRange}</p>}
          </div>
        </div>
        <RegeneratePopover
          isRegenerating={regenerating}
          onRegenerate={handleRegenerate}
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

export function GenerationWorkspace() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumeOutput, setResumeOutput] = useState<MockResumeOutput | null>(null);
  const [headlineRegenerating, setHeadlineRegenerating] = useState(false);

  function handleGenerate() {
    setIsGenerating(true);
    setTimeout(() => {
      setResumeOutput({ ...MOCK_RESUME_OUTPUT });
      setIsGenerating(false);
      setAdditionalPrompt('');
      toast.success('Resume content generated');
    }, 500);
  }

  function handleRegenerateHeadline(_prompt: string) {
    setHeadlineRegenerating(true);
    setTimeout(() => {
      setHeadlineRegenerating(false);
      toast.success('Headline regenerated');
    }, 500);
  }

  const handleToggleBullet = useCallback(
    (experienceId: string, bulletIndex: number) => {
      if (!resumeOutput) return;
      setResumeOutput(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          experiences: prev.experiences.map(exp => {
            if (exp.experienceId !== experienceId) return exp;
            const current = exp.hiddenBulletIndices;
            const next = current.includes(bulletIndex)
              ? current.filter(i => i !== bulletIndex)
              : [...current, bulletIndex];
            return { ...exp, hiddenBulletIndices: next };
          })
        };
      });
    },
    [resumeOutput]
  );

  const handleBulletRangeSave = useCallback((experienceId: string, min: number, max: number) => {
    setResumeOutput(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        experiences: prev.experiences.map(exp => {
          if (exp.experienceId !== experienceId) return exp;
          return { ...exp, bulletOverride: { min, max } };
        })
      };
    });
    toast.success('Bullet range updated');
  }, []);

  const handleToggleEducation = useCallback((educationId: string) => {
    setResumeOutput(prev => {
      if (!prev) return prev;
      const isHidden = prev.hiddenEducationIds.includes(educationId);
      return {
        ...prev,
        hiddenEducationIds: isHidden
          ? prev.hiddenEducationIds.filter(id => id !== educationId)
          : [...prev.hiddenEducationIds, educationId]
      };
    });
  }, []);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto p-6">
      <div className="space-y-4">
        <JobSelector value={selectedJobId} onChange={setSelectedJobId} />

        <div className="space-y-3">
          <Textarea
            placeholder="Optional: add instructions to steer the generation..."
            value={additionalPrompt}
            onChange={e => setAdditionalPrompt(e.target.value)}
            className="min-h-[72px] resize-none text-[13px]"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleGenerate} disabled={!selectedJobId || isGenerating}>
              {isGenerating ? (
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
                  isRegenerating={headlineRegenerating}
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
                defaultBulletMin={MOCK_SETTINGS.bulletMin}
                defaultBulletMax={MOCK_SETTINGS.bulletMax}
                onToggleBullet={handleToggleBullet}
                onBulletRangeSave={handleBulletRangeSave}
              />
            ))}
          </div>

          {resumeOutput.educations.length > 0 && (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-[12px] text-muted-foreground">Education</p>
              <div className="space-y-2">
                {resumeOutput.educations.map(edu => {
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
