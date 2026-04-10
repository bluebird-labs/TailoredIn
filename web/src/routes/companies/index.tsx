import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CompanyList } from '@/components/companies/CompanyList';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/companies/')({
  component: CompaniesPage
});

function CompaniesPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-heading">Companies</h1>
          <p className="text-muted-foreground text-sm">View and manage your company directory.</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add company
        </Button>
      </div>
      <CompanyList createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </div>
  );
}
