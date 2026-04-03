import FS from 'node:fs/promises';
import Path from 'node:path';
import type { ResumeContentDto } from '@tailoredin/application';
import type { TemplateGenerator } from '../TemplateGenerator.js';
import { escapeTypst } from './typst-escape.js';

export class FinelyCraftedGenerator implements TemplateGenerator {
  public async generate(content: ResumeContentDto, workDir: string): Promise<void> {
    await FS.writeFile(Path.join(workDir, 'cv.typ'), buildTyp(content), 'utf8');
  }
}

type CompanyGroup = {
  society: string;
  positions: Array<{
    title: string;
    date: string;
    location: string;
    summary: string;
    highlights: string[];
  }>;
};

function groupByCompany(experience: ResumeContentDto['experience']): CompanyGroup[] {
  const groups: CompanyGroup[] = [];
  for (const exp of experience) {
    const last = groups[groups.length - 1];
    if (last && last.society === exp.society) {
      last.positions.push(exp);
    } else {
      groups.push({ society: exp.society, positions: [exp] });
    }
  }
  return groups;
}

function buildTyp(content: ResumeContentDto): string {
  const { personal, experience, skills, education } = content;

  const groups = groupByCompany(experience);

  const experienceBlocks = groups
    .map(group => {
      const firstPos = group.positions[0];
      const lastPos = group.positions[group.positions.length - 1];
      const startDate = lastPos.date.split(' – ')[0] || lastPos.date;
      const endDate = firstPos.date.split(' – ')[1] || firstPos.date;

      const positionBlocks = group.positions
        .map(pos => {
          const bullets = pos.highlights.map(h => `    - ${escapeTypst(h)}`).join('\n');
          const body = pos.summary ? `    ${escapeTypst(pos.summary)}${bullets ? `\n\n${bullets}` : ''}` : bullets;

          return `  #job-heading("${escapeTypst(pos.title)}", start: "${pos.date.split(' – ')[0] || pos.date}", end: "${pos.date.split(' – ')[1] || 'Present'}")[
${body}
  ]`;
        })
        .join('\n\n');

      return `#company-heading("${escapeTypst(group.society)}", start: "${startDate}", end: "${endDate}")[
${positionBlocks}
]`;
    })
    .join('\n\n');

  const educationBlocks = education
    .map(
      edu => `#school-heading("${escapeTypst(edu.society)}", start: "${edu.date}", end: "")[
  #degree-heading("${escapeTypst(edu.title)}")[
    ${escapeTypst(edu.location)}
  ]
]`
    )
    .join('\n\n');

  const competencyGrid =
    skills.length > 0
      ? `= Core Competencies

#grid(
  columns: (1fr, 1fr),
  gutter: 8pt,
${skills.map(s => `  [*${escapeTypst(s.type)}* \\ ${escapeTypst(s.info)}],`).join('\n')}
)`
      : '';

  return `#import "@preview/finely-crafted-cv:0.2.0": *

#show: resume.with(
  name: "${escapeTypst(personal.first_name)} ${escapeTypst(personal.last_name)}",
  tagline: "${escapeTypst(personal.header_quote)}",
  email: "${personal.email}",
  linkedin-username: "${personal.linkedin}",
)

= Experience

${experienceBlocks}

= Education

${educationBlocks}

${competencyGrid}
`;
}
