import { Link } from '@tanstack/react-router';
import { ArrowLeft, ExternalLink, Pencil } from 'lucide-react';
import { useState } from 'react';
import { JobDescriptionList } from '@/components/job-descriptions/JobDescriptionList.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Company, useCompanies } from '@/hooks/use-companies';
import { CompanyFormModal } from './CompanyFormModal.js';
import { formatEnumLabel } from './company-options.js';

interface CompanyDetailProps {
  readonly companyId: string;
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function CompanyDetail({ companyId }: CompanyDetailProps) {
  const { data: companies = [], isLoading } = useCompanies();
  const [editOpen, setEditOpen] = useState(false);

  const company = companies.find(c => c.id === companyId);

  if (isLoading) return <LoadingSkeleton variant="detail" />;

  if (!company) {
    return (
      <div className="space-y-4">
        <Link
          to="/companies"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to companies
        </Link>
        <p className="text-sm text-muted-foreground">Company not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/companies"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to companies
      </Link>

      <CompanyHeader company={company} onEdit={() => setEditOpen(true)} />

      <div className="border-t pt-6">
        <h2 className="text-lg font-medium mb-4">Job Descriptions</h2>
        <JobDescriptionList companyId={companyId} />
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
    </div>
  );
}

function CompanyHeader({ company, onEdit }: { company: Company; onEdit: () => void }) {
  const industryLabel = formatEnumLabel('industry', company.industry);
  const stageLabel = formatEnumLabel('stage', company.stage);
  const businessTypeLabel = formatEnumLabel('businessType', company.businessType);

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={`${company.name} logo`}
            className="h-12 w-12 shrink-0 rounded-lg border object-contain bg-white p-0.5"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted text-base font-medium text-muted-foreground">
            {company.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="page-heading">{company.name}</h1>
          {company.description && <p className="text-sm text-muted-foreground mt-0.5">{company.description}</p>}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {industryLabel && <Badge variant="secondary">{industryLabel}</Badge>}
            {stageLabel && <Badge variant="secondary">{stageLabel}</Badge>}
            {businessTypeLabel && <Badge variant="outline">{businessTypeLabel}</Badge>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        {company.linkedinLink && (
          <a
            href={company.linkedinLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <LinkedInIcon className="h-4 w-4" />
          </a>
        )}
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
      </div>
    </div>
  );
}
