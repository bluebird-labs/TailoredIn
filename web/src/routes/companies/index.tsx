import { createFileRoute } from '@tanstack/react-router';
import { CompanyList } from '@/components/companies/CompanyList';

export const Route = createFileRoute('/companies/')({
  component: CompaniesPage
});

function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">Companies</h1>
        <p className="text-muted-foreground text-sm">View and manage your company directory.</p>
      </div>
      <CompanyList />
    </div>
  );
}
