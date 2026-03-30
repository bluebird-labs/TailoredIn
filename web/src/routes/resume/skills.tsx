import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/resume/skills')({
  component: SkillsPage
});

function SkillsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Skills</h1>
      <p className="text-muted-foreground mt-2">Skill categories and items.</p>
    </div>
  );
}
