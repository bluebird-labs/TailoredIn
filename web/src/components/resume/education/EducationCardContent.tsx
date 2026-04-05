import type { Education } from '@/hooks/use-educations';

interface EducationCardContentProps {
  readonly education: Education;
}

function EducationCardContent({ education }: EducationCardContentProps) {
  return (
    <div data-slot="education-card-content">
      <p className="font-medium text-[15px] tracking-[-0.01em]">{education.degreeTitle}</p>
      <p className="text-sm text-muted-foreground mt-0.5">
        {education.institutionName} &middot; {education.graduationYear}
        {education.location && <span> &middot; {education.location}</span>}
      </p>
      {education.honors && <p className="text-sm text-muted-foreground/80 italic mt-1">{education.honors}</p>}
    </div>
  );
}

export type { EducationCardContentProps };
export { EducationCardContent };
