import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/resume/experience')({
  component: ExperiencePage
});

function ExperiencePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Work Experience</h1>
      <p className="text-muted-foreground mt-2">Companies, positions, and bullet points.</p>
    </div>
  );
}
