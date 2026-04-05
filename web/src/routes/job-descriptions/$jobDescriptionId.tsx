import { createFileRoute, Link } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
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
import { useCompany } from '@/hooks/use-companies';
import { type JobDescription, useJobDescription } from '@/hooks/use-job-descriptions';

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
