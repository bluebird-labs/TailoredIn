import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { EducationSection } from '@/components/archetypes/education-section';
import { MetadataSection } from '@/components/archetypes/metadata-section';
import { PositionsSection } from '@/components/archetypes/positions-section';
import { SkillsSection } from '@/components/archetypes/skills-section';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ARCHETYPE_KEY_LABELS, useArchetypes } from '@/hooks/use-archetypes';
import { useCompanies } from '@/hooks/use-companies';
import { useEducation } from '@/hooks/use-education';
import { useHeadlines } from '@/hooks/use-headlines';
import { useSkillCategories } from '@/hooks/use-skills';
import { useCurrentUser } from '@/hooks/use-user';

export const Route = createFileRoute('/archetypes/$archetypeId')({
  component: ArchetypeDetailPage
});

function ArchetypeDetailPage() {
  const { archetypeId } = Route.useParams();
  const { data: userResponse } = useCurrentUser();
  const userId = userResponse?.data?.id;

  const { data: archetypesResponse, isLoading: archetypesLoading } = useArchetypes();
  const { data: headlinesResponse } = useHeadlines();
  const { data: companiesResponse } = useCompanies();
  const { data: skillsResponse } = useSkillCategories();
  const { data: educationResponse } = useEducation(userId);

  const archetypes = (archetypesResponse?.data ?? []) as Array<{
    id: string;
    archetypeKey: string;
    archetypeLabel: string;
    archetypeDescription: string | null;
    headlineId: string;
    socialNetworks: string[];
    positions: Array<{
      id: string;
      resumePositionId: string;
      jobTitle: string | null;
      displayCompanyName: string;
      locationLabel: string;
      startDate: string | null;
      endDate: string | null;
      roleSummary: string | null;
      ordinal: number;
      bullets: { bulletId: string; ordinal: number }[];
    }>;
    educationSelections: { educationId: string; ordinal: number }[];
    skillCategorySelections: { categoryId: string; ordinal: number }[];
    skillItemSelections: { itemId: string; ordinal: number }[];
  }>;

  const archetype = archetypes.find(a => a.id === archetypeId);
  const headlines = (headlinesResponse?.data ?? []) as { id: string; label: string }[];
  const companies = (companiesResponse?.data ?? []) as Array<{
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
  }>;
  const categories = (skillsResponse?.data ?? []) as Array<{
    id: string;
    categoryName: string;
    ordinal: number;
    items: { id: string; skillName: string; ordinal: number }[];
  }>;
  const education = (educationResponse?.data ?? []) as Array<{
    id: string;
    degreeTitle: string;
    institutionName: string;
    graduationYear: string;
    locationLabel: string;
    ordinal: number;
  }>;

  if (archetypesLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!archetype) {
    return (
      <div className="space-y-4">
        <Link
          to="/archetypes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to archetypes
        </Link>
        <p className="text-muted-foreground">Archetype not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        to="/archetypes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to archetypes
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{archetype.archetypeLabel}</h1>
        <Badge variant="secondary">{ARCHETYPE_KEY_LABELS[archetype.archetypeKey] ?? archetype.archetypeKey}</Badge>
      </div>

      <MetadataSection
        archetypeId={archetype.id}
        archetypeLabel={archetype.archetypeLabel}
        archetypeDescription={archetype.archetypeDescription}
        headlineId={archetype.headlineId}
        socialNetworks={archetype.socialNetworks}
        headlines={headlines}
      />

      <PositionsSection archetypeId={archetype.id} positions={archetype.positions} companies={companies} />

      <SkillsSection
        archetypeId={archetype.id}
        categorySelections={archetype.skillCategorySelections}
        itemSelections={archetype.skillItemSelections}
        allCategories={categories}
      />

      <EducationSection
        archetypeId={archetype.id}
        educationSelections={archetype.educationSelections}
        allEducation={education}
      />
    </div>
  );
}
