import { createFileRoute } from '@tanstack/react-router';
import { HeadlineList } from '@/components/resume/headlines/HeadlineList';

export const Route = createFileRoute('/headlines/')({
  component: HeadlinesPage
});

function HeadlinesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Headlines</h1>
        <p className="text-muted-foreground text-sm">Manage your headline variants.</p>
      </div>
      <HeadlineList />
    </div>
  );
}
