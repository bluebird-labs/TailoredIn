import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CompanyFormModal } from '@/components/companies/CompanyFormModal.js';
import { formatEnumLabel } from '@/components/companies/company-options.js';
import { JobDescriptionCard } from '@/components/job-descriptions/JobDescriptionCard.js';
import { JobDescriptionFormModal } from '@/components/job-descriptions/JobDescriptionFormModal.js';
import { Breadcrumb } from '@/components/shared/Breadcrumb.js';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.js';
import { DetailPageHeader, MetaBadge, MetaDot, MetaText } from '@/components/shared/DetailPageHeader.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { InfoCard, InfoRow } from '@/components/shared/InfoCard.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCompany, useDeleteCompany } from '@/hooks/use-companies';
import { useJobDescriptions } from '@/hooks/use-job-descriptions';

export const Route = createFileRoute('/companies/$companyId')({
  component: CompanyDetailPage
});

function CompanyDetailPage() {
  const { companyId } = Route.useParams();
  const { data: company, isLoading } = useCompany(companyId);
  const { data: jobDescriptions = [], isLoading: isLoadingJobs } = useJobDescriptions(companyId);
  const deleteCompany = useDeleteCompany();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [addJobOpen, setAddJobOpen] = useState(false);

  if (isLoading) return <LoadingSkeleton variant="detail" />;
  if (!company) return <EmptyState message="Company not found." />;

  const initial = company.name.charAt(0).toUpperCase();
  const industryLabel = formatEnumLabel('industry', company.industry);
  const stageLabel = formatEnumLabel('stage', company.stage);
  const statusLabel = formatEnumLabel('status', company.status);
  const businessTypeLabel = formatEnumLabel('businessType', company.businessType);

  return (
    <div className="space-y-5">
      <Breadcrumb parentLabel="Companies" parentTo="/companies" current={company.name} />

      <DetailPageHeader
        logo={
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-accent text-[22px] font-medium text-accent-foreground">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="h-full w-full rounded-xl object-cover" />
            ) : (
              initial
            )}
          </div>
        }
        title={company.name}
        meta={
          <>
            {businessTypeLabel && <MetaBadge>{businessTypeLabel}</MetaBadge>}
            {stageLabel && (
              <>
                <MetaDot />
                <MetaText>{stageLabel}</MetaText>
              </>
            )}
            {industryLabel && (
              <>
                <MetaDot />
                <MetaText>{industryLabel}</MetaText>
              </>
            )}
          </>
        }
        actions={
          <>
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Website
                </Button>
              </a>
            )}
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <ConfirmDialog
              title="Delete company?"
              description="This company and all its job descriptions and applications will be permanently removed. Experiences linked to this company will be unlinked but preserved."
              onConfirm={() =>
                deleteCompany.mutate(company.id, {
                  onSuccess: () => navigate({ to: '/companies' })
                })
              }
              trigger={
                <Button size="sm" variant="ghost" className="text-destructive">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              }
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-5">
        <InfoCard label="About">
          {company.description ? (
            <p className="text-[14px] leading-relaxed tracking-[0.01em]">{company.description}</p>
          ) : (
            <p className="text-[14px] italic text-muted-foreground">No description</p>
          )}
        </InfoCard>

        <InfoCard label="Details">
          <InfoRow label="Website" value={company.website} href={company.website ?? undefined} />
          <InfoRow label="LinkedIn" value={company.linkedinLink} href={company.linkedinLink ?? undefined} />
          <InfoRow label="Industry" value={industryLabel} />
          <InfoRow label="Stage" value={stageLabel} />
          <InfoRow label="Status" value={statusLabel} />
          <InfoRow label="Business Type" value={businessTypeLabel} />
        </InfoCard>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-medium">Jobs</h2>
            {jobDescriptions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {jobDescriptions.length}
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setAddJobOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add job
          </Button>
        </div>

        {isLoadingJobs ? (
          <LoadingSkeleton variant="list" count={2} />
        ) : jobDescriptions.length === 0 ? (
          <EmptyState message="No jobs yet." actionLabel="Add job" onAction={() => setAddJobOpen(true)} />
        ) : (
          jobDescriptions.map(jd => <JobDescriptionCard key={jd.id} jobDescription={jd} />)
        )}
      </div>

      {editOpen && (
        <CompanyFormModal
          open
          company={company}
          onOpenChange={next => {
            if (!next) setEditOpen(false);
          }}
        />
      )}

      {addJobOpen && (
        <JobDescriptionFormModal
          open
          companyId={companyId}
          onOpenChange={next => {
            if (!next) setAddJobOpen(false);
          }}
        />
      )}
    </div>
  );
}
