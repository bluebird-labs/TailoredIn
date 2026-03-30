import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/archetypes/$archetypeId')({
  component: ArchetypeDetailPage
});

function ArchetypeDetailPage() {
  const { archetypeId } = Route.useParams();
  return (
    <div>
      <h1 className="text-2xl font-bold">Archetype Detail</h1>
      <p className="text-muted-foreground mt-2">Configuration for archetype {archetypeId}.</p>
    </div>
  );
}
