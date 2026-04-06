import type { ResumeRenderInput } from '@tailoredin/application';

export function escapeYamlString(text: string): string {
  return text.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function isoDateToImprecvDate(iso: string): string {
  // "2022-01-15" or "2022-01" → "2022-01-15" or "2022-01-01"
  const parts = iso.split('-');
  if (parts.length === 2) return `${parts[0]}-${parts[1]}-01`;
  return iso;
}

export function generateImprecvYaml(input: ResumeRenderInput): string {
  const { personal, experiences, educations } = input;

  const profiles: string[] = [];
  if (personal.linkedin) {
    profiles.push(
      `    - network: "LinkedIn"\n      username: "${escapeYamlString(personal.linkedin)}"\n      url: "https://linkedin.com/in/${escapeYamlString(personal.linkedin)}"`
    );
  }
  if (personal.github) {
    profiles.push(
      `    - network: "GitHub"\n      username: "${escapeYamlString(personal.github)}"\n      url: "https://github.com/${escapeYamlString(personal.github)}"`
    );
  }
  if (personal.website) {
    profiles.push(
      `    - network: "Website"\n      username: "${escapeYamlString(personal.website)}"\n      url: "${escapeYamlString(personal.website)}"`
    );
  }

  const workEntries = experiences
    .filter(exp => exp.bullets.length > 0)
    .map(exp => {
      const startDate = isoDateToImprecvDate(exp.startDate);
      const endDate = exp.endDate ? `"${isoDateToImprecvDate(exp.endDate)}"` : '"present"';
      const highlights = exp.bullets.map(b => `          - "${escapeYamlString(b)}"`).join('\n');
      return `  - organization: "${escapeYamlString(exp.companyName)}"
    url: ""
    location: "${escapeYamlString(exp.location)}"
    positions:
      - position: "${escapeYamlString(exp.title)}"
        startDate: "${startDate}"
        endDate: ${endDate}
        highlights:
${highlights}`;
    });

  const educationEntries = educations.map(edu => {
    return `  - institution: "${escapeYamlString(edu.institutionName)}"
    url: ""
    area: "${escapeYamlString(edu.degreeTitle)}"
    studyType: ""
    location: "${escapeYamlString(edu.location ?? '')}"
    startDate: ""
    endDate: "${edu.graduationYear}-06-01"
    honors: []
    courses: []
    highlights: []`;
  });

  return `personal:
  name:
    first: "${escapeYamlString(personal.firstName)}"
    last: "${escapeYamlString(personal.lastName)}"
  email: "${escapeYamlString(personal.email)}"
  phone: "${escapeYamlString(personal.phone ?? '')}"
  url: "${escapeYamlString(personal.website ?? '')}"
  summary: "${escapeYamlString(input.headlineSummary)}"
  location:
    city: "${escapeYamlString(personal.location ?? '')}"
  profiles:
${profiles.join('\n')}

work:
${workEntries.join('\n')}

education:
${educationEntries.join('\n')}

affiliations: []
awards: []
certificates: []
publications: []
projects: []
skills: []
languages: []
interests: []
references: []
`;
}

export function generateImprecvTemplateTyp(): string {
  return `#import "@preview/imprecv:1.0.1": *

#let uservars = (
  bodysize: 10pt,
  headingfont: "Libertinus Serif",
  bodyfont: "Libertinus Serif",
  monospacefont: "Libertinus Mono",
  showAddress: false,
  showNumber: true,
  showTitle: true,
)

#show: cv.with(metadata: yaml("cv.yaml"), uservars: uservars)
`;
}
