import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { JobDescriptionList } from '@/components/job-descriptions/JobDescriptionList';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/jobs/')({
  component: JobsPage
});

function JobsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-heading">Jobs</h1>
          <p className="text-muted-foreground text-sm">Browse and manage all job descriptions across companies.</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add job description
        </Button>
      </div>
      <JobDescriptionList createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </div>
  );
}
