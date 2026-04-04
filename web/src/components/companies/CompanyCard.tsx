import { ExternalLink, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Company } from '@/hooks/use-companies';
import { formatEnumLabel } from './company-options.js';

interface CompanyCardProps {
  readonly company: Company;
  readonly onClick: () => void;
}

export function CompanyCard({ company, onClick }: CompanyCardProps) {
  const industryLabel = formatEnumLabel('industry', company.industry);
  const stageLabel = formatEnumLabel('stage', company.stage);
  const businessTypeLabel = formatEnumLabel('businessType', company.businessType);

  return (
    <button
      type="button"
      className="group w-full text-left border rounded-[14px] p-4 cursor-pointer transition-colors hover:bg-muted/30"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{company.name}</p>
          {company.website && (
            <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
              <Globe className="h-3 w-3 shrink-0" />
              {company.website}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {industryLabel && <Badge variant="secondary">{industryLabel}</Badge>}
            {stageLabel && <Badge variant="secondary">{stageLabel}</Badge>}
            {businessTypeLabel && <Badge variant="outline">{businessTypeLabel}</Badge>}
          </div>
        </div>
        {company.linkedinLink && (
          <a
            href={company.linkedinLink}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </button>
  );
}
