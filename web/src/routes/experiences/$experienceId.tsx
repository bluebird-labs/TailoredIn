import { createFileRoute, Link } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { formatEnumLabel } from '@/components/companies/company-options.js';
import { ExperienceFormModal } from '@/components/resume/experience/ExperienceFormModal.js';
import { Breadcrumb } from '@/components/shared/Breadcrumb.js';
import { DetailPageHeader, MetaDot, MetaText } from '@/components/shared/DetailPageHeader.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { InfoCard, InfoRow } from '@/components/shared/InfoCard.js';
import { LinkedEntityCard } from '@/components/shared/LinkedEntityCard.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExperience } from '@/hooks/use-experiences';

export const Route = createFileRoute('/experiences/$experienceId')({
  component: ExperienceDetailPage
});

function ExperienceDetailPage() {
  const { experienceId } = Route.useParams();
  const { data: experience, isLoading } = useExperience(experienceId);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <LoadingSkeleton variant="detail" />;
  if (!experience) return <EmptyState message="Experience not found." />;

  const initial = experience.companyName.charAt(0).toUpperCase();
  const industryLabel = experience.company ? formatEnumLabel('industry', experience.company.industry) : null;
  const stageLabel = experience.company ? formatEnumLabel('stage', experience.company.stage) : null;

  const accomplishmentCount = experience.accomplishments.length;

  return (
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
        actions={
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
        }
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
              <InfoCard label="Summary">
                {experience.summary ? (
                  <p className="text-[14px] leading-relaxed tracking-[0.01em]">{experience.summary}</p>
                ) : (
                  <p className="text-[14px] italic text-muted-foreground">No summary</p>
                )}
              </InfoCard>

              <InfoCard label="Details">
                <InfoRow label="Company" value={experience.companyName} />
                {experience.companyWebsite && (
                  <InfoRow label="Website" value={experience.companyWebsite} href={experience.companyWebsite} />
                )}
                <InfoRow label="Location" value={experience.location} />
                <InfoRow label="Start Date" value={experience.startDate} />
                <InfoRow label="End Date" value={experience.endDate} />
              </InfoCard>
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

              <InfoCard label="Quick Stats">
                <InfoRow label="Accomplishments" value={String(accomplishmentCount)} />
                <InfoRow label="Bullet Range" value={`${experience.bulletMin}–${experience.bulletMax}`} />
              </InfoCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="accomplishments">
          <div className="mt-4">
            {accomplishmentCount === 0 ? (
              <EmptyState message="No accomplishments yet." />
            ) : (
              <div className="space-y-3">
                {experience.accomplishments.map((accomplishment, index) => (
                  <div key={accomplishment.id} className="rounded-[14px] border bg-card p-5">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-[12px] text-muted-foreground">#{index + 1}</span>
                      <div className="flex-1">
                        <h3 className="text-[15px] font-medium">{accomplishment.title}</h3>
                        {accomplishment.narrative && (
                          <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                            {accomplishment.narrative}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {editOpen && (
        <ExperienceFormModal
          open
          modalMode={{ mode: 'edit', experience }}
          onOpenChange={next => {
            if (!next) setEditOpen(false);
          }}
        />
      )}
    </div>
  );
}
