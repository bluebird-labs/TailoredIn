import { createFileRoute, Link } from '@tanstack/react-router';
import { Download, Pencil, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { formatEnumLabel as formatCompanyEnumLabel } from '@/components/companies/company-options.js';
import { JobDescriptionFormModal } from '@/components/job-descriptions/JobDescriptionFormModal.js';
import { formatEnumLabel } from '@/components/job-descriptions/job-description-options.js';
import { Breadcrumb } from '@/components/shared/Breadcrumb.js';
import { DetailPageHeader, MetaBadge, MetaDot, MetaText } from '@/components/shared/DetailPageHeader.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { InfoCard, InfoRow } from '@/components/shared/InfoCard.js';
import { LinkedEntityCard } from '@/components/shared/LinkedEntityCard.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCompany } from '@/hooks/use-companies';
import { type JobDescription, useJobDescription } from '@/hooks/use-job-descriptions';

export const Route = createFileRoute('/jobs/$jobDescriptionId')({
  component: JobDetailPage
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function downloadRawText(rawText: string, companyName: string | null, jobTitle: string) {
  const company = slugify(companyName || 'unknown-company');
  const title = slugify(jobTitle);
  const today = new Date().toISOString().slice(0, 10);
  const filename = `${company}-${title}-${today}.md`;

  const blob = new Blob([rawText], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function JobDetailPage() {
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
      <Breadcrumb parentLabel="Jobs" parentTo="/jobs" current={jd.title} />

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
          <div className="flex items-center gap-2">
            <Link to="/atelier" search={{ job: jobDescriptionId }}>
              <Button size="sm" variant="outline">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Open in Atelier
              </Button>
            </Link>
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        }
      />

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
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger>Raw Text</CollapsibleTrigger>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    title="Download as .md"
                    onClick={() => downloadRawText(jd.rawText!, jd.companyName, jd.title)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
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
