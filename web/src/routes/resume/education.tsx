import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/resume/education')({
  component: EducationPage
});

function EducationPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Education</h1>
      <p className="text-muted-foreground mt-2">Degrees and certifications.</p>
    </div>
  );
}
