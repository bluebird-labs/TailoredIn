import { Link } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import type { Company } from '@/hooks/use-companies';
import { formatEnumLabel } from './company-options.js';

interface CompanyCardProps {
  readonly company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const industryLabel = formatEnumLabel('industry', company.industry);
  const stageLabel = formatEnumLabel('stage', company.stage);
  const statusLabel = formatEnumLabel('status', company.status);
  const businessTypeLabel = formatEnumLabel('businessType', company.businessType);

  return (
    <Link
      to="/companies/$companyId"
      params={{ companyId: company.id }}
      className="group block w-full text-left border rounded-[14px] p-4 transition-colors hover:bg-accent/40"
    >
      <div className="flex items-start gap-3 min-w-0">
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={`${company.name} logo`}
            className="h-10 w-10 shrink-0 rounded-lg border object-contain bg-white p-0.5"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted text-sm font-medium text-muted-foreground">
            {company.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{company.name}</p>
          {company.description && <p className="text-sm text-muted-foreground line-clamp-2">{company.description}</p>}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {industryLabel && <Badge variant="secondary">{industryLabel}</Badge>}
            {stageLabel && <Badge variant="secondary">{stageLabel}</Badge>}
            {statusLabel && <Badge variant="outline">{statusLabel}</Badge>}
            {businessTypeLabel && <Badge variant="outline">{businessTypeLabel}</Badge>}
          </div>
        </div>
      </div>
    </Link>
  );
}
