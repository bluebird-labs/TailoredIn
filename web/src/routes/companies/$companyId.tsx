import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, ExternalLink, Pencil } from 'lucide-react';
import { useState } from 'react';
import { ClassificationBadge } from '@/components/companies/classification-badge';
import { ClassificationEditDialog } from '@/components/companies/classification-edit-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useJobCompany } from '@/hooks/use-job-company';

export const Route = createFileRoute('/companies/$companyId')({
  component: CompanyDetailPage
});

function CompanyDetailPage() {
  const { companyId } = Route.useParams();
  const { data, isLoading } = useJobCompany(companyId);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Company not found.</p>
        <Link to={'/jobs' as string} className="text-primary hover:underline mt-2 inline-block">
          Back to jobs
        </Link>
      </div>
    );
  }

  const company = data;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        to={'/jobs' as string}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{company.name}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Website
            </a>
          )}
          {company.linkedinLink && (
            <a
              href={company.linkedinLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              LinkedIn
            </a>
          )}
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Classification</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <ClassificationBadge label="Business Type" value={company.businessType} />
            <ClassificationBadge label="Industry" value={company.industry} />
            <ClassificationBadge label="Stage" value={company.stage} />
          </div>
        </CardContent>
      </Card>

      <ClassificationEditDialog
        companyId={companyId}
        open={editOpen}
        onOpenChange={setEditOpen}
        currentBusinessType={company.businessType}
        currentIndustry={company.industry}
        currentStage={company.stage}
      />
    </div>
  );
}
