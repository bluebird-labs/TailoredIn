import { createFileRoute, Link } from '@tanstack/react-router';
import { Eye, EyeOff, Loader2, Minus, Pencil, Plus, RefreshCw, RotateCw, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { formatEnumLabel as formatCompanyEnumLabel } from '@/components/companies/company-options.js';
import { JobDescriptionFormModal } from '@/components/job-descriptions/JobDescriptionFormModal.js';
import { formatEnumLabel } from '@/components/job-descriptions/job-description-options.js';
import { ResumePdfPreview } from '@/components/job-descriptions/resume-pdf-preview.js';
import { DetailPageHeader, MetaBadge, MetaDot, MetaText } from '@/components/shared/DetailPageHeader.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { InfoCard, InfoRow } from '@/components/shared/InfoCard.js';
import { LinkedEntityCard } from '@/components/shared/LinkedEntityCard.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCompany } from '@/hooks/use-companies';
import { useEducations } from '@/hooks/use-educations';
import { type JobDescription, type ResumeOutputExperience, useJobDescription } from '@/hooks/use-job-descriptions';
import { useGenerateResumeContent, useUpdateResumeDisplaySettings } from '@/hooks/use-resume';

export const Route = createFileRoute('/job-descriptions/$jobDescriptionId')({
  component: JobDescriptionDetailPage,
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: (search.tab as string) || undefined
  })
});

function formatSalary(jd: JobDescription): string | null {
  if (!jd.salaryRange) return null;
  const { min, max, currency } = jd.salaryRange;
  if (!min && !max) return null;
  const fmt = (n: number) => n.toLocaleString();
  if (min && max) return `${currency} ${fmt(min)} – ${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  if (max) return `Up to ${currency} ${fmt(max)}`;
  return null;
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMonthYear(value: string): string {
  if (!value) return '';
  const [year, month] = value.split('-');
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function ExperienceCard({
  exp,
  onRegenerate,
  isRegenerating,
  onBulletCountChange
}: {
  exp: ResumeOutputExperience;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onBulletCountChange: (count: number | null) => void;
}) {
  const total = exp.bullets.length;
  const displayed = exp.displayedBulletCount ?? total;

  const startFormatted = formatMonthYear(exp.startDate);
  const endFormatted = formatMonthYear(exp.endDate);
  const dateRange = startFormatted && endFormatted ? `${startFormatted} — ${endFormatted}` : '';

  return (
    <Collapsible defaultOpen={false}>
      <div className="border rounded-lg p-4">
        <CollapsibleTrigger className="text-left">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[14px] font-medium text-foreground truncate">{exp.experienceTitle}</p>
              {dateRange && <p className="text-[12px] text-muted-foreground shrink-0">{dateRange}</p>}
            </div>
            <p className="text-[13px] text-muted-foreground">{exp.companyName}</p>
          </div>
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <div className="pt-3 space-y-3">
            <div className="flex items-center justify-end gap-1">
              <div className="flex items-center gap-0.5 border rounded-md px-1 h-7">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  onClick={() => onBulletCountChange(Math.max(0, displayed - 1))}
                  disabled={displayed <= 0}
                  title="Show fewer bullets"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <button
                  type="button"
                  className="text-[12px] text-muted-foreground tabular-nums min-w-[40px] text-center hover:text-foreground transition-colors"
                  onClick={() => onBulletCountChange(null)}
                  title="Reset to show all bullets"
                >
                  {displayed}/{total}
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  onClick={() => onBulletCountChange(Math.min(total, displayed + 1))}
                  disabled={displayed >= total}
                  title="Show more bullets"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={onRegenerate}
                disabled={isRegenerating}
                title="Regenerate this experience"
              >
                {isRegenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCw className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            {exp.summary && <p className="text-[13px] text-muted-foreground italic">{exp.summary}</p>}
            <ul className="space-y-1.5">
              {exp.bullets.map((bullet, i) => (
                <li
                  // biome-ignore lint/suspicious/noArrayIndexKey: static ordered list
                  key={i}
                  className={`flex gap-2 text-[13px] leading-relaxed${i >= displayed ? ' opacity-30' : ''}`}
                >
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </CollapsiblePanel>
      </div>
    </Collapsible>
  );
}

function ResumeTab({ jd }: { jd: JobDescription }) {
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const generate = useGenerateResumeContent(jd.id);
  const updateSettings = useUpdateResumeDisplaySettings(jd.id);
  const { data: educations } = useEducations();

  const resumeOutput = jd.resumeOutput;
  const headline = resumeOutput?.headline ?? null;
  const experiences = resumeOutput?.experiences ?? [];
  const hiddenEducationIds = resumeOutput?.hiddenEducationIds ?? [];
  const generatedAt = resumeOutput ? formatDate(resumeOutput.generatedAt) : null;

  const handleBulletCountChange = useCallback(
    (experienceId: string, count: number | null) => {
      updateSettings.mutate(
        { experienceBulletCounts: [{ experienceId, displayedBulletCount: count }] },
        { onSuccess: () => setRefreshKey(k => k + 1) }
      );
    },
    [updateSettings]
  );

  const handleToggleEducation = useCallback(
    (educationId: string) => {
      const isHidden = hiddenEducationIds.includes(educationId);
      const next = isHidden
        ? hiddenEducationIds.filter(id => id !== educationId)
        : [...hiddenEducationIds, educationId];
      updateSettings.mutate({ hiddenEducationIds: next }, { onSuccess: () => setRefreshKey(k => k + 1) });
    },
    [updateSettings, hiddenEducationIds]
  );

  function handleGenerate() {
    generate.mutate(
      { additionalPrompt: additionalPrompt.trim() || undefined },
      {
        onSuccess: () => {
          setAdditionalPrompt('');
          toast.success('Resume content generated');
        },
        onError: err => {
          toast.error(err instanceof Error ? err.message : 'Generation failed');
        }
      }
    );
  }

  function handleRegenerateHeadline() {
    setRegeneratingId('headline');
    generate.mutate(
      { additionalPrompt: additionalPrompt.trim() || undefined, scope: { type: 'headline' } },
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

  function handleRegenerateExperience(experienceId: string) {
    setRegeneratingId(experienceId);
    generate.mutate(
      { additionalPrompt: additionalPrompt.trim() || undefined, scope: { type: 'experience', experienceId } },
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

  if (!resumeOutput) {
    return (
      <div className="mt-4">
        <div className="border rounded-lg p-4 space-y-3">
          <p className="text-[12px] text-muted-foreground">No resume content generated yet.</p>
          <Textarea
            placeholder="Optional: add instructions to steer the generation…"
            value={additionalPrompt}
            onChange={e => setAdditionalPrompt(e.target.value)}
            className="text-[13px] min-h-[72px] resize-none"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleGenerate} disabled={generate.isPending}>
              {generate.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Generating…
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
    );
  }

  return (
    <div className="mt-4 grid grid-cols-[1fr_560px] gap-5">
      <div className="space-y-5">
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-muted-foreground">Generated{generatedAt ? ` on ${generatedAt}` : ''}</p>
          </div>
          <Textarea
            placeholder="Optional: add instructions to steer the regeneration…"
            value={additionalPrompt}
            onChange={e => setAdditionalPrompt(e.target.value)}
            className="text-[13px] min-h-[72px] resize-none"
          />
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generate.isPending}>
              {generate.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Regenerating…
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </div>

        {headline && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[12px] text-muted-foreground">Headline</p>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={handleRegenerateHeadline}
                disabled={generate.isPending}
                title="Regenerate headline"
              >
                {regeneratingId === 'headline' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCw className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <p className="text-[15px] text-foreground">{headline}</p>
          </div>
        )}

        <div className="space-y-3">
          {experiences.map(exp => (
            <ExperienceCard
              key={exp.experienceId}
              exp={exp}
              onRegenerate={() => handleRegenerateExperience(exp.experienceId)}
              isRegenerating={regeneratingId === exp.experienceId}
              onBulletCountChange={count => handleBulletCountChange(exp.experienceId, count)}
            />
          ))}
        </div>

        {educations && educations.length > 0 && (
          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-[12px] text-muted-foreground">Education</p>
            <div className="space-y-2">
              {educations.map(edu => {
                const isHidden = hiddenEducationIds.includes(edu.id);
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

      <ResumePdfPreview
        jobDescriptionId={jd.id}
        hasCachedPdf={jd.hasCachedPdf}
        resumePdfTheme={jd.resumePdfTheme}
        refreshKey={refreshKey}
      />
    </div>
  );
}

function JobDescriptionDetailPage() {
  const { jobDescriptionId } = Route.useParams();
  const { tab = 'overview' } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: jd, isLoading } = useJobDescription(jobDescriptionId);
  const { data: company } = useCompany(jd?.companyId ?? '');
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <LoadingSkeleton variant="detail" />;
  if (!jd) return <EmptyState message="Job description not found." />;

  const levelLabel = formatEnumLabel('level', jd.level);
  const locationTypeLabel = formatEnumLabel('locationType', jd.locationType);
  const salary = formatSalary(jd);
  const postedAt = formatDate(jd.postedAt);
  const createdAt = formatDate(jd.createdAt);

  const companyInitial = (company?.name ?? jd.companyId).charAt(0).toUpperCase();
  const industryLabel = company ? formatCompanyEnumLabel('industry', company.industry) : null;
  const stageLabel = company ? formatCompanyEnumLabel('stage', company.stage) : null;
  const companyMeta = [industryLabel, stageLabel].filter(Boolean).join(' · ') || company?.website || 'No details';

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-[13px]">
        <Link to="/companies" className="text-primary hover:underline">
          Companies
        </Link>
        <span className="text-border">/</span>
        {company ? (
          <Link
            to="/companies/$companyId"
            params={{ companyId: jd.companyId }}
            className="text-primary hover:underline"
          >
            {company.name}
          </Link>
        ) : (
          <span className="text-muted-foreground">…</span>
        )}
        <span className="text-border">/</span>
        <span className="text-muted-foreground">{jd.title}</span>
      </nav>

      <DetailPageHeader
        logo={
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-accent text-[22px] font-medium text-accent-foreground overflow-hidden">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="h-full w-full rounded-xl object-cover" />
            ) : (
              companyInitial
            )}
          </div>
        }
        title={jd.title}
        meta={
          <>
            {company ? (
              <Link
                to="/companies/$companyId"
                params={{ companyId: jd.companyId }}
                className="text-[13px] text-primary hover:underline"
              >
                {company.name}
              </Link>
            ) : null}
            {locationTypeLabel && (
              <>
                {company && <MetaDot />}
                <MetaBadge>{locationTypeLabel}</MetaBadge>
              </>
            )}
            {levelLabel && (
              <>
                <MetaDot />
                <MetaBadge>{levelLabel}</MetaBadge>
              </>
            )}
            {salary && (
              <>
                <MetaDot />
                <MetaText>{salary}</MetaText>
              </>
            )}
          </>
        }
        actions={
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={value => navigate({ search: { tab: value }, replace: true })}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="mt-4 grid grid-cols-[1fr_280px] gap-5">
            <div className="space-y-5">
              <InfoCard label="Description">
                {jd.description ? (
                  <p className="text-[14px] leading-relaxed tracking-[0.01em]">{jd.description}</p>
                ) : (
                  <p className="text-[14px] italic text-muted-foreground">No description</p>
                )}
              </InfoCard>

              <InfoCard label="Details">
                <InfoRow label="Level" value={levelLabel} />
                <InfoRow label="Location" value={jd.location} />
                <InfoRow label="Location Type" value={locationTypeLabel} />
                <InfoRow label="Salary" value={salary} />
                <InfoRow label="Posted" value={postedAt} />
                {jd.url && <InfoRow label="Job Posting" value="View posting" href={jd.url} />}
              </InfoCard>

              {jd.rawText && (
                <Collapsible defaultOpen={false}>
                  <div className="rounded-[14px] border bg-card p-5">
                    <CollapsibleTrigger>Raw Text</CollapsibleTrigger>
                    <CollapsiblePanel>
                      <pre className="pt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground font-sans">
                        {jd.rawText}
                      </pre>
                    </CollapsiblePanel>
                  </div>
                </Collapsible>
              )}
            </div>

            <div className="space-y-5">
              {company && (
                <InfoCard label="Company">
                  <LinkedEntityCard
                    to={`/companies/${jd.companyId}`}
                    logoUrl={company.logoUrl}
                    logoInitial={companyInitial}
                    name={company.name}
                    meta={companyMeta}
                  />
                </InfoCard>
              )}

              <InfoCard label="Job Info">
                <InfoRow label="Source" value={jd.source} />
                <InfoRow label="Added" value={createdAt} />
              </InfoCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="resume">
          <ResumeTab jd={jd} />
        </TabsContent>
      </Tabs>

      {editOpen && (
        <JobDescriptionFormModal
          open
          companyId={jd.companyId}
          jobDescription={jd}
          onOpenChange={next => {
            if (!next) setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}
