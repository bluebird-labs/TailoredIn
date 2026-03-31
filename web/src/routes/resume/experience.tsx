import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CompanyCard } from '@/components/resume/experience/company-card';
import { CompanyFormDialog } from '@/components/resume/experience/company-form-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanies } from '@/hooks/use-companies';

export const Route = createFileRoute('/resume/experience')({
  component: ExperiencePage
});

type Company = {
  id: string;
  companyName: string;
  companyMention: string | null;
  websiteUrl: string | null;
  businessDomain: string;
  locations: { label: string; ordinal: number }[];
  positions: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    summary: string | null;
    ordinal: number;
    bullets: { id: string; content: string; ordinal: number }[];
  }[];
};

function ExperiencePage() {
  const { data, isLoading } = useCompanies();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();

  function handleAdd() {
    setEditingCompany(undefined);
    setDialogOpen(true);
  }

  function handleEdit(company: Company) {
    setEditingCompany(company);
    setDialogOpen(true);
  }

  const companies = (data?.data ?? []) as Company[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Work Experience</h1>
          <p className="text-muted-foreground mt-1">Companies, positions, and bullet points.</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="size-4" data-icon="inline-start" />
          Add Company
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && companies.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-muted-foreground">No companies yet.</p>
          <p className="text-sm text-muted-foreground">Add your first company to get started.</p>
        </div>
      )}

      {!isLoading && companies.length > 0 && (
        <div className="flex flex-col gap-4">
          {companies.map(company => (
            <CompanyCard key={company.id} company={company} onEdit={() => handleEdit(company)} />
          ))}
        </div>
      )}

      <CompanyFormDialog open={dialogOpen} onOpenChange={setDialogOpen} company={editingCompany} />
    </div>
  );
}
