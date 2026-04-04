import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExperienceTab } from '@/components/wardrobe/ExperienceTab';
import { HeadlineTab } from '@/components/wardrobe/HeadlineTab';

const searchSchema = z.object({
  tab: z.enum(['experience', 'headlines']).optional().catch('experience')
});

export const Route = createFileRoute('/resume/')({
  validateSearch: searchSchema.parse,
  component: ResumePage
});

function ResumePage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wardrobe</h1>
        <p className="text-muted-foreground text-sm">Manage your experience and headline variants.</p>
      </div>

      <Tabs value={tab ?? 'experience'} onValueChange={v => navigate({ search: { tab: v } })}>
        <TabsList>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="headlines">Headlines</TabsTrigger>
        </TabsList>
        <TabsContent value="experience" className="pt-4">
          <ExperienceTab />
        </TabsContent>
        <TabsContent value="headlines" className="pt-4">
          <HeadlineTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
