import { createFileRoute, Link } from '@tanstack/react-router';
import { Loader2, Pencil, RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatEnumLabel as formatCompanyEnumLabel } from '@/components/companies/company-options.js';
import { JobDescriptionFormModal } from '@/components/job-descriptions/JobDescriptionFormModal.js';
import { formatEnumLabel } from '@/components/job-descriptions/job-description-options.js';
import { DetailPageHeader, MetaBadge, MetaDot, MetaText } from '@/components/shared/DetailPageHeader.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { InfoCard, InfoRow } from '@/components/shared/InfoCard.js';
import { LinkedEntityCard } from '@/components/shared/LinkedEntityCard.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCompany } from '@/hooks/use-companies';
import { type JobDescription, type ResumeOutputExperience, useJobDescription } from '@/hooks/use-job-descriptions';
import { useGenerateResumeContent } from '@/hooks/use-resume';

export const Route = createFileRoute('/job-descriptions/$jobDescriptionId')({
  component: JobDescriptionDetailPage
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

function ExperienceCard({ exp }: { exp: ResumeOutputExperience }) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div>
        <p className="text-[14px] font-medium text-foreground">{exp.experienceTitle}</p>
        <p className="text-[13px] text-muted-foreground">{exp.companyName}</p>
      </div>
      {exp.summary && <p className="text-[13px] text-muted-foreground italic">{exp.summary}</p>}
      <ul className="space-y-1.5">
        {exp.bullets.map((bullet, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static ordered list
          <li key={i} className="flex gap-2 text-[13px] leading-relaxed">
            <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResumeTab({ jd }: { jd: JobDescription }) {
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const generate = useGenerateResumeContent(jd.id);

  const resumeOutput = jd.resumeOutput;
  const experiences = resumeOutput?.output.experiences ?? [];
  const generatedAt = resumeOutput ? formatDate(resumeOutput.generatedAt) : null;

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

  if (!resumeOutput) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-[14px] text-muted-foreground">No resume content generated yet.</p>
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
    );
  }

  return (
    <div className="mt-4 space-y-5">
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

      <div className="space-y-3">
        {experiences.map(exp => (
          <ExperienceCard key={exp.experienceId} exp={exp} />
        ))}
      </div>
    </div>
  );
}

function JobDescriptionDetailPage() {
  const { jobDescriptionId } = Route.useParams();
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

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="raw-text">Raw Text</TabsTrigger>
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

        <TabsContent value="raw-text">
          <div className="mt-4">
            <InfoCard label="Raw Text">
              {jd.rawText ? (
                <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground font-sans">
                  {jd.rawText}
                </pre>
              ) : (
                <p className="text-[14px] italic text-muted-foreground">No raw text available.</p>
              )}
            </InfoCard>
          </div>
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
