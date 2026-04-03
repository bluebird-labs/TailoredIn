import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExperienceTab } from '@/components/wardrobe/ExperienceTab';
import { HeadlineTab } from '@/components/wardrobe/HeadlineTab';
import { SkillsTab } from '@/components/wardrobe/SkillsTab';
import { FactoryInputStep } from '@/components/factory/FactoryInputStep';
import { FactoryReviewStep } from '@/components/factory/FactoryReviewStep';

const searchSchema = z.object({
  tab: z.enum(['wardrobe', 'factory']).optional().catch('wardrobe')
});

export const Route = createFileRoute('/resume/')({
  validateSearch: searchSchema.parse,
  component: ResumePage
});

function ResumePage() {
  const { tab } = Route.useSearch();
  const [factoryResumeId, setFactoryResumeId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resume</h1>
        <p className="text-muted-foreground text-sm">
          Build your wardrobe, then generate tailored resumes.
        </p>
      </div>

      <Tabs defaultValue={tab ?? 'wardrobe'}>
        <TabsList>
          <TabsTrigger value="wardrobe">Wardrobe</TabsTrigger>
          <TabsTrigger value="factory">Factory</TabsTrigger>
        </TabsList>

        <TabsContent value="wardrobe" className="space-y-4 pt-4">
          <Tabs defaultValue="experience">
            <TabsList>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="headlines">Headlines</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
            </TabsList>
            <TabsContent value="experience" className="pt-4">
              <ExperienceTab />
            </TabsContent>
            <TabsContent value="headlines" className="pt-4">
              <HeadlineTab />
            </TabsContent>
            <TabsContent value="skills" className="pt-4">
              <SkillsTab />
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
      </Tabs>
    </div>
  );
}
