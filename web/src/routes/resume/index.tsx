import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';
import { FactoryInputStep } from '@/components/factory/FactoryInputStep';
import { FactoryReviewStep } from '@/components/factory/FactoryReviewStep';
import { SkillCategoriesPanel } from '@/components/resume/skills/skill-categories-panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExperienceTab } from '@/components/wardrobe/ExperienceTab';
import { HeadlineTab } from '@/components/wardrobe/HeadlineTab';

const searchSchema = z.object({
  tab: z.enum(['wardrobe', 'factory', 'skills']).optional().catch('wardrobe')
});

export const Route = createFileRoute('/resume/')({
  validateSearch: searchSchema.parse,
  component: ResumePage
});

function ResumePage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [factoryResumeId, setFactoryResumeId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resume</h1>
        <p className="text-muted-foreground text-sm">Build your wardrobe, then generate tailored resumes.</p>
      </div>

      <Tabs value={tab ?? 'wardrobe'} onValueChange={v => navigate({ search: { tab: v } })}>
        <TabsList>
          <TabsTrigger value="wardrobe">Wardrobe</TabsTrigger>
          <TabsTrigger value="factory">Factory</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="wardrobe" className="space-y-4 pt-4">
          <Tabs defaultValue="experience">
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
        </TabsContent>

        <TabsContent value="factory" className="pt-4">
          {factoryResumeId ? (
            <FactoryReviewStep resumeId={factoryResumeId} onReset={() => setFactoryResumeId(null)} />
          ) : (
            <FactoryInputStep onGenerated={setFactoryResumeId} />
          )}
        </TabsContent>

        <TabsContent value="skills" className="pt-4">
          <SkillCategoriesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
