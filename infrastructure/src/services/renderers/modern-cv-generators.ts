// infrastructure/src/services/renderers/modern-cv-generators.ts
import type { ResumeRenderInput } from '@tailoredin/application';
import { escapeTypst, formatDate } from '../typst-generators.js';

function formatDateRange(startDate: string, endDate: string | null): string {
  return `${formatDate(startDate)} - ${endDate ? formatDate(endDate) : 'Present'}`;
}

function escapeAuthorField(text: string): string {
  return text.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

export function generateModernCvTyp(input: ResumeRenderInput): string {
  const { personal, experiences, educations, headlineSummary } = input;

  const positions = headlineSummary ? `("${escapeAuthorField(headlineSummary)}")` : '()';

  const experienceEntries = experiences
    .filter(exp => exp.bullets.length > 0)
    .map(exp => {
      const date = escapeAuthorField(formatDateRange(exp.startDate, exp.endDate));
      const bullets = exp.bullets.map(b => `  - ${escapeTypst(b)}`).join('\n');
      return `#resume-entry(
  title: "${escapeAuthorField(exp.title)}",
  location: "${escapeAuthorField(exp.location)}",
  date: "${date}",
  description: "${escapeAuthorField(exp.companyName)}",
)

#resume-item[
${bullets}
]`;
    });

  const educationEntries = educations.map(edu => {
    return `#resume-entry(
  title: "${escapeAuthorField(edu.degreeTitle)}",
  location: "${escapeAuthorField(edu.location ?? '')}",
  date: "${edu.graduationYear}",
  description: "${escapeAuthorField(edu.institutionName)}",
)`;
  });

  return `#import "@preview/modern-cv:0.9.0": *

#show: resume.with(
  author: (
    firstname: "${escapeAuthorField(personal.firstName)}",
    lastname: "${escapeAuthorField(personal.lastName)}",
    email: "${escapeAuthorField(personal.email)}",
    phone: "${escapeAuthorField(personal.phone ?? '')}",
    github: "${escapeAuthorField(personal.github ?? '')}",
    linkedin: "${escapeAuthorField(personal.linkedin ?? '')}",
    address: "${escapeAuthorField(personal.location ?? '')}",
    positions: ${positions},
  ),
  profile-picture: none,
  date: none,
  language: "en",
  paper-size: "us-letter",
  colored-headers: true,
  show-footer: false,
)

= Experience

${experienceEntries.join('\n\n')}

= Education

${educationEntries.join('\n\n')}
`;
}
