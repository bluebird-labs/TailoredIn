import FS from 'node:fs/promises';
import Path from 'node:path';
import type { ResumeContentDto } from '@tailoredin/application';
import type { TemplateGenerator } from '../TemplateGenerator.js';
import { escapeTypst } from './typst-escape.js';

export class ExecutiveSingleGenerator implements TemplateGenerator {
  public async generate(content: ResumeContentDto, workDir: string): Promise<void> {
    await FS.writeFile(Path.join(workDir, 'cv.typ'), buildTyp(content), 'utf8');
  }
}

function sectionHeader(title: string): string {
  return `#v(8pt)
#block(width: 100%)[
  #text(size: 9pt, tracking: 0.2em, fill: rgb("#444444"), smallcaps[${title.toUpperCase()}])
  #v(1pt)
  #line(length: 100%, stroke: 0.4pt + rgb("#999999"))
]
#v(4pt)`;
}

function buildTyp(content: ResumeContentDto): string {
  const { personal, experience, skills, education } = content;

  const contactParts = [
    escapeTypst(personal.location),
    escapeTypst(personal.email),
    personal.linkedin ? `linkedin.com/in/${personal.linkedin}` : '',
    personal.github ? `github.com/${personal.github}` : ''
  ]
    .filter(Boolean)
    .join('  #sym.dot.c  ');

  // Group consecutive experiences by company
  const groups: { society: string; positions: typeof experience }[] = [];
  for (const exp of experience) {
    const last = groups[groups.length - 1];
    if (last && last.society === exp.society) {
      last.positions.push(exp);
    } else {
      groups.push({ society: exp.society, positions: [exp] });
    }
  }

  const experienceBlocks = groups
    .map(group => {
      if (group.positions.length === 1) {
        const exp = group.positions[0];
        const bullets = exp.highlights.map(h => `  - ${escapeTypst(h)}`).join('\n');
        return `#block(breakable: false)[
  #grid(
    columns: (1fr, auto),
    text(size: 11pt, weight: "bold")[${escapeTypst(exp.society)}],
    text(size: 10pt)[${exp.date}],
  )
  #text(size: 10pt, style: "italic")[${escapeTypst(exp.title)}]
  #v(2pt)
${bullets}
]`;
      }

      // Multiple positions at same company
      const firstPos = group.positions[0];
      const lastPos = group.positions[group.positions.length - 1];
      const startDate = lastPos.date.split(' – ')[0] || lastPos.date;
      const endDate = firstPos.date.split(' – ')[1] || firstPos.date;

      const posBlocks = group.positions
        .map(pos => {
          const bullets = pos.highlights.map(h => `    - ${escapeTypst(h)}`).join('\n');
          return `  #grid(
    columns: (1fr, auto),
    text(size: 10pt, style: "italic")[${escapeTypst(pos.title)}],
    text(size: 9.5pt)[${pos.date}],
  )
  #v(2pt)
${bullets}`;
        })
        .join('\n  #v(6pt)\n');

      return `#block(breakable: false)[
  #grid(
    columns: (1fr, auto),
    text(size: 11pt, weight: "bold")[${escapeTypst(group.society)}],
    text(size: 10pt)[${startDate} – ${endDate}],
  )
  #v(2pt)
${posBlocks}
]`;
    })
    .join('\n#v(6pt)\n');

  const competencyGrid =
    skills.length > 0
      ? `${sectionHeader('Strategic Competencies')}
#grid(
  columns: (1fr, 1fr),
  row-gutter: 6pt,
  column-gutter: 16pt,
${skills.map(s => `  [*${escapeTypst(s.type)}* --- ${escapeTypst(s.info)}],`).join('\n')}
)`
      : '';

  const educationBlock =
    education.length > 0
      ? `${sectionHeader('Education')}
${education
  .map(
    edu => `#grid(
  columns: (1fr, auto),
  [*${escapeTypst(edu.title)}* --- ${escapeTypst(edu.society)}, ${escapeTypst(edu.location)}],
  [${edu.date}],
)`
  )
  .join('\n')}`
      : '';

  return `// Executive Single-Column Resume Template
// Butterick-inspired typography: small-caps section headers, fine rules, serif accents

#set page(
  paper: "us-letter",
  margin: 1.2cm,
)

#set text(
  font: "Source Sans 3",
  size: 10pt,
  fill: rgb("#333333"),
)

#set par(leading: 0.65em)
#set list(indent: 8pt, body-indent: 4pt)

// Header
#align(center)[
  #text(font: "Source Serif 4", size: 24pt, tracking: 0.15em, smallcaps[${escapeTypst(personal.first_name)} ${escapeTypst(personal.last_name)}])
  #v(4pt)
  #text(size: 9pt, tracking: 0.05em)[${contactParts}]
]

${sectionHeader('Executive Summary')}
#text(size: 10pt)[${escapeTypst(personal.header_quote)}]

${sectionHeader('Experience')}
${experienceBlocks}

${competencyGrid}

${educationBlock}
`;
}
