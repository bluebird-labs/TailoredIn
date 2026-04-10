import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CompanyFormModal } from '@/components/companies/CompanyFormModal.js';
import { formatEnumLabel } from '@/components/companies/company-options.js';
import { Breadcrumb } from '@/components/shared/Breadcrumb.js';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.js';
import { DetailPageHeader, MetaBadge, MetaDot, MetaText } from '@/components/shared/DetailPageHeader.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { InfoCard, InfoRow } from '@/components/shared/InfoCard.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { useCompany, useDeleteCompany } from '@/hooks/use-companies';

export const Route = createFileRoute('/companies/$companyId')({
  component: CompanyDetailPage
});

function CompanyDetailPage() {
  const { companyId } = Route.useParams();
  const { data: company, isLoading } = useCompany(companyId);
  const deleteCompany = useDeleteCompany();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

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

      <Link
        to="/jobs"
        search={{ company: companyId }}
        className="flex items-center gap-2 text-[13px] text-primary hover:underline"
      >
        View jobs at this company
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>

      {editOpen && (
        <CompanyFormModal
          open
          company={company}
          onOpenChange={next => {
            if (!next) setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}
