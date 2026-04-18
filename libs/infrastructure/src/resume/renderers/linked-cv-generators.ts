// infrastructure/src/resume/renderers/linked-cv-generators.ts
import type { ResumeRenderExperience, ResumeRenderInput } from '@tailoredin/application';
import { escapeTypst } from '../typst-generators.js';

type CompanyGroup = {
  companyName: string;
  companySlug: string;
  /** Start date of the earliest role at this company (MM-YYYY) */
  overallStart: string;
  /** End date of the most recent role (MM-YYYY or "current") */
  overallEnd: string;
  roles: ResumeRenderExperience[];
};

export function formatLinkedCvDate(iso: string): string {
  // "2022-01-15" or "2022-01" → "01-2022"
  const parts = iso.split('-');
  const year = parts[0] ?? '2000';
  const month = parts[1] ?? '01';
  return `${month.padStart(2, '0')}-${year}`;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function groupExperiencesByCompany(experiences: ResumeRenderExperience[]): CompanyGroup[] {
  const groups: CompanyGroup[] = [];
  const indexByCompany = new Map<string, number>();

  for (const exp of experiences) {
    const existing = indexByCompany.get(exp.companyName);
    if (existing !== undefined) {
      groups[existing].roles.push(exp);
      // Update overall end if this role is still ongoing
      if (exp.endDate === null) {
        groups[existing].overallEnd = 'current';
      } else if (groups[existing].overallEnd !== 'current') {
        // Update overall end if this role ends later
        const formattedEnd = formatLinkedCvDate(exp.endDate);
        if (formattedEnd > groups[existing].overallEnd) {
          groups[existing].overallEnd = formattedEnd;
        }
      }
      // Update overall start if this role started earlier
      const formattedStart = formatLinkedCvDate(exp.startDate);
      if (formattedStart < groups[existing].overallStart) {
        groups[existing].overallStart = formattedStart;
      }
    } else {
      indexByCompany.set(exp.companyName, groups.length);
      groups.push({
        companyName: exp.companyName,
        companySlug: toSlug(exp.companyName),
        overallStart: formatLinkedCvDate(exp.startDate),
        overallEnd: exp.endDate ? formatLinkedCvDate(exp.endDate) : 'current',
        roles: [exp]
      });
    }
  }

  return groups;
}

function renderRole(exp: ResumeRenderExperience): string {
  const start = formatLinkedCvDate(exp.startDate);
  const end = exp.endDate ? formatLinkedCvDate(exp.endDate) : 'current';
  const bullets = exp.bullets.map(b => `      - ${escapeTypst(b)}`).join('\n');

  return `  (
    title: [${escapeTypst(exp.title)}],
    duration: ("${start}", "${end}"),
    body: [
${bullets}
    ]
  )`;
}

export function generateLinkedCvTyp(input: ResumeRenderInput): string {
  const { personal, experiences, educations, headlineSummary } = input;
  const groups = groupExperiencesByCompany(experiences);

  const experienceBlocks = groups.map(group => {
    const roles = group.roles.map(renderRole).join(',\n');
    const firstRole = group.roles[0];
    const companyLabel = firstRole?.companyAccent
      ? `${group.companyName} · ${firstRole.companyAccent}`
      : group.companyName;
    return `#block(breakable: false)[
#components.employer-info(
  none,
  name: "${escapeTypst(companyLabel)}",
  duration: ("${group.overallStart}", "${group.overallEnd}"),
)

#frame.connected-frames(
  "${group.companySlug}",
${roles},
)
]`;
  });

  const educationEntries = educations.map(edu => {
    const endYear = `${edu.graduationYear}-06-01`;
    const slug = toSlug(edu.institutionName);
    // Heuristic: assume 4-year bachelor's degree; graduate/associate degrees may be inaccurate
    return `#components.employer-info(
  none,
  name: "${escapeTypst(edu.institutionName)}",
  duration: ("09-${edu.graduationYear - 4}", "${formatLinkedCvDate(endYear)}"),
)
#frame.connected-frames(
  "${slug}",
  (
    title: [${escapeTypst(edu.degreeTitle)}],
    duration: ("09-${edu.graduationYear - 4}", "${formatLinkedCvDate(endYear)}"),
    body: []
  ),
)`;
  });

  const tagline = headlineSummary ? escapeTypst(headlineSummary) : '';

  return `#import "@preview/linked-cv:0.1.0": *

#show: cv.with(
  name: "${escapeTypst(personal.firstName)} ${escapeTypst(personal.lastName)}",
  tagline: "${tagline}",
  email: "${escapeTypst(personal.email)}",
  phone: "${escapeTypst(personal.phone ?? '')}",
  linkedin: "${escapeTypst(personal.linkedin ? `linkedin.com/in/${personal.linkedin}` : '')}",
  github: "${escapeTypst(personal.github ? `github.com/${personal.github}` : '')}",
  accent-colour: rgb("#0077B5"),
  paper: "us-letter",
)

#components.section("Experience")

${experienceBlocks.join('\n\n')}

#components.section("Education")

${educationEntries.join('\n\n')}
`;
}
