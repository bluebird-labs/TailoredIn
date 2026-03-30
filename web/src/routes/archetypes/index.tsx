import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/archetypes/')({
  component: ArchetypesPage
});

function ArchetypesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Archetypes</h1>
      <p className="text-muted-foreground mt-2">Resume archetypes and their configurations.</p>
    </div>
  );
}
