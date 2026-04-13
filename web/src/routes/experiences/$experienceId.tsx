import { closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { formatEnumLabel } from '@/components/companies/company-options.js';
import { SortableAccomplishmentCard } from '@/components/resume/experience/AccomplishmentCard.js';
import { CreateAccomplishmentModal } from '@/components/resume/experience/CreateAccomplishmentModal.js';
import { ExperienceDetailsEditor } from '@/components/resume/experience/ExperienceDetailsEditor.js';
import { ExperienceSkillsEditor } from '@/components/resume/experience/ExperienceSkillsEditor.js';
import { ExperienceSummaryEditor } from '@/components/resume/experience/ExperienceSummaryEditor.js';
import { Breadcrumb } from '@/components/shared/Breadcrumb.js';
import { DetailPageHeader, MetaDot, MetaText } from '@/components/shared/DetailPageHeader.js';
import { EditableSectionProvider } from '@/components/shared/EditableSectionContext.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { InfoCard } from '@/components/shared/InfoCard.js';
import { LinkedEntityCard } from '@/components/shared/LinkedEntityCard.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExperience, useUpdateExperience } from '@/hooks/use-experiences';

export const Route = createFileRoute('/experiences/$experienceId')({
  component: ExperienceDetailPage
});

function ExperienceDetailPage() {
  const { experienceId } = Route.useParams();
  const { data: experience, isLoading } = useExperience(experienceId);
  const updateExperience = useUpdateExperience();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!experience) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const items = [...experience.accomplishments];
      const oldIndex = items.findIndex(a => a.id === active.id);
      const newIndex = items.findIndex(a => a.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const [moved] = items.splice(oldIndex, 1);
      items.splice(newIndex, 0, moved);

      updateExperience.mutate(
        {
          id: experience.id,
          title: experience.title,
          company_name: experience.companyName,
          company_website: experience.companyWebsite ?? undefined,
          company_accent: experience.companyAccent ?? undefined,
          location: experience.location,
          start_date: experience.startDate,
          end_date: experience.endDate,
          summary: experience.summary ?? undefined,
          ordinal: experience.ordinal,
          accomplishments: items.map((a, i) => ({
            id: a.id,
            title: a.title,
            narrative: a.narrative,
            ordinal: i
          })),
          bullet_min: experience.bulletMin,
          bullet_max: experience.bulletMax
        },
        {
          onError: () => toast.error('Failed to reorder. Please try again.')
        }
      );
    },
    [experience, updateExperience]
  );

  if (isLoading) return <LoadingSkeleton variant="detail" />;
  if (!experience) return <EmptyState message="Experience not found." />;

  const initial = experience.companyName.charAt(0).toUpperCase();
  const industryLabel = experience.company ? formatEnumLabel('industry', experience.company.industry) : null;
  const stageLabel = experience.company ? formatEnumLabel('stage', experience.company.stage) : null;
  const accomplishmentCount = experience.accomplishments.length;

  return (
    <EditableSectionProvider>
      <div className="space-y-5">
        <Breadcrumb parentLabel="Profile" parentTo="/profile" current={experience.title} />

        <DetailPageHeader
          logo={
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-accent text-[22px] font-medium text-accent-foreground">
              {experience.company?.logoUrl ? (
                <img
                  src={experience.company.logoUrl}
                  alt={experience.companyName}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                initial
              )}
            </div>
          }
          title={experience.title}
          meta={
            <>
              {experience.company ? (
                <Link
                  to="/companies/$companyId"
                  params={{ companyId: experience.company.id }}
                  className="text-[13px] text-primary hover:underline"
                >
                  {experience.companyName}
                </Link>
              ) : (
                <MetaText>{experience.companyName}</MetaText>
              )}
              {experience.location && (
                <>
                  <MetaDot />
                  <MetaText>{experience.location}</MetaText>
                </>
              )}
              <MetaDot />
              <MetaText>
                {experience.startDate} – {experience.endDate}
              </MetaText>
            </>
          }
          actions={null}
        />

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="accomplishments">
              Accomplishments
              {accomplishmentCount > 0 && (
                <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground">
                  {accomplishmentCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="mt-4 grid grid-cols-[1fr_280px] gap-5">
              <div className="space-y-5">
                <ExperienceDetailsEditor experience={experience} />
                <ExperienceSummaryEditor experience={experience} />
              </div>

              <div className="space-y-5">
                {experience.company && (
                  <InfoCard label="Company">
                    <LinkedEntityCard
                      to={`/companies/${experience.company.id}`}
                      logoUrl={experience.company.logoUrl}
                      logoInitial={experience.company.name.charAt(0).toUpperCase()}
                      name={experience.company.name}
                      meta={
                        [industryLabel, stageLabel].filter(Boolean).join(' · ') ||
                        experience.company.website ||
                        'No details'
                      }
                    />
                  </InfoCard>
                )}
                <ExperienceSkillsEditor experience={experience} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="accomplishments">
            <div className="mt-4 space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => setAddModalOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add accomplishment
              </Button>

              {accomplishmentCount === 0 ? (
                <EmptyState message="No accomplishments yet." />
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={experience.accomplishments.map(a => a.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {experience.accomplishments.map((accomplishment, index) => (
                      <SortableAccomplishmentCard
                        key={accomplishment.id}
                        experienceId={experience.id}
                        accomplishment={accomplishment}
                        index={index}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <CreateAccomplishmentModal
              open={addModalOpen}
              onOpenChange={setAddModalOpen}
              experienceId={experience.id}
              accomplishmentCount={accomplishmentCount}
            />
          </TabsContent>
        </Tabs>
      </div>
    </EditableSectionProvider>
  );
}
