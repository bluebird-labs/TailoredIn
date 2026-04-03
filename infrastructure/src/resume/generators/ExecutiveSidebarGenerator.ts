import FS from 'node:fs/promises';
import Path from 'node:path';
import type { ResumeContentDto } from '@tailoredin/application';
import type { TemplateGenerator } from '../TemplateGenerator.js';
import { escapeTypst } from './typst-escape.js';

export class ExecutiveSidebarGenerator implements TemplateGenerator {
  public async generate(content: ResumeContentDto, workDir: string): Promise<void> {
    await FS.writeFile(Path.join(workDir, 'cv.typ'), buildTyp(content), 'utf8');
  }
}

function sidebarSection(title: string): string {
  return `    #text(size: 8pt, tracking: 0.15em, fill: rgb("#666666"), smallcaps[${title.toUpperCase()}])
    #v(1pt)
    #line(length: 100%, stroke: 0.3pt + rgb("#cccccc"))
    #v(3pt)`;
}

function mainSection(title: string): string {
  return `#text(size: 9pt, tracking: 0.2em, fill: rgb("#444444"), smallcaps[${title.toUpperCase()}])
  #v(1pt)
  #line(length: 100%, stroke: 0.4pt + rgb("#999999"))
  #v(4pt)`;
}

function buildTyp(content: ResumeContentDto): string {
  const { personal, experience, skills, education } = content;

  // Sidebar: contact entries
  const contactLines = [
    personal.email ? `    #text(size: 8.5pt)[${escapeTypst(personal.email)}]` : '',
    personal.linkedin
      ? `    #text(size: 8.5pt)[#link("https://linkedin.com/in/${personal.linkedin}")[linkedin.com/in/${personal.linkedin}]]`
      : '',
    personal.github
      ? `    #text(size: 8.5pt)[#link("https://github.com/${personal.github}")[github.com/${personal.github}]]`
      : '',
    personal.location ? `    #text(size: 8.5pt)[${escapeTypst(personal.location)}]` : ''
  ]
    .filter(Boolean)
    .join('\n    #v(2pt)\n');

  // Sidebar: competencies
  const competencyLines = skills
    .map(
      s => `    #text(size: 8.5pt, weight: "bold")[${escapeTypst(s.type)}]
    #v(1pt)
    #text(size: 8pt, fill: rgb("#555555"))[${escapeTypst(s.info)}]`
    )
    .join('\n    #v(4pt)\n');

  // Sidebar: education
  const educationLines = education
    .map(
      edu => `    #text(size: 8.5pt, weight: "bold")[${escapeTypst(edu.title)}]
    #v(1pt)
    #text(size: 8pt, fill: rgb("#555555"))[${escapeTypst(edu.society)}]
    #v(0pt)
    #text(size: 8pt, fill: rgb("#777777"))[${edu.date}]`
    )
    .join('\n    #v(4pt)\n');

  // Main column: group consecutive experiences by company
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
        const body = exp.summary
          ? `  #text(size: 9.5pt)[${escapeTypst(exp.summary)}]${exp.highlights.length > 0 ? `\n  #v(2pt)\n${exp.highlights.map(h => `  - ${escapeTypst(h)}`).join('\n')}` : ''}`
          : exp.highlights.map(h => `  - ${escapeTypst(h)}`).join('\n');

        return `  #block(breakable: false)[
    #grid(
      columns: (1fr, auto),
      text(size: 10.5pt, weight: "bold")[${escapeTypst(exp.society)}],
      text(size: 9.5pt)[${exp.date}],
    )
    #text(size: 9.5pt, style: "italic")[${escapeTypst(exp.title)}]
    #v(2pt)
${body}
  ]`;
      }

      // Multiple positions
      const firstPos = group.positions[0];
      const lastPos = group.positions[group.positions.length - 1];
      const startDate = lastPos.date.split(' – ')[0] || lastPos.date;
      const endDate = firstPos.date.split(' – ')[1] || firstPos.date;

      const posBlocks = group.positions
        .map(pos => {
          const body = pos.summary
            ? `    #text(size: 9.5pt)[${escapeTypst(pos.summary)}]${pos.highlights.length > 0 ? `\n    #v(2pt)\n${pos.highlights.map(h => `    - ${escapeTypst(h)}`).join('\n')}` : ''}`
            : pos.highlights.map(h => `    - ${escapeTypst(h)}`).join('\n');

          return `    #grid(
      columns: (1fr, auto),
      text(size: 9.5pt, style: "italic")[${escapeTypst(pos.title)}],
      text(size: 9pt)[${pos.date}],
    )
    #v(2pt)
${body}`;
        })
        .join('\n    #v(5pt)\n');

      return `  #block(breakable: false)[
    #grid(
      columns: (1fr, auto),
      text(size: 10.5pt, weight: "bold")[${escapeTypst(group.society)}],
      text(size: 9.5pt)[${startDate} – ${endDate}],
    )
    #v(2pt)
${posBlocks}
  ]`;
    })
    .join('\n  #v(6pt)\n');

  return `// Executive Two-Column Sidebar Resume Template
// Sidebar for identity + competencies, main column for experience

#set page(
  paper: "us-letter",
  margin: 0pt,
)

#set text(
  font: "Source Sans 3",
  size: 10pt,
  fill: rgb("#333333"),
)

#set par(leading: 0.65em)
#set list(indent: 6pt, body-indent: 4pt, marker: text(fill: rgb("#666666"))[--])

#grid(
  columns: (28%, 72%),
  // === SIDEBAR ===
  block(
    width: 100%,
    height: 100%,
    inset: (x: 14pt, top: 20pt, bottom: 14pt),
    fill: rgb("#f7f7f7"),
  )[
    // Name
    #text(font: "Source Serif 4", size: 18pt, tracking: 0.08em, weight: "bold")[${escapeTypst(personal.first_name)}]
    #v(0pt)
    #text(font: "Source Serif 4", size: 18pt, tracking: 0.08em, weight: "bold")[${escapeTypst(personal.last_name)}]
    #v(4pt)
    #text(size: 8.5pt, tracking: 0.05em, fill: rgb("#555555"))[${escapeTypst(personal.header_quote)}]

    #v(12pt)
    ${sidebarSection('Contact')}
${contactLines}

    #v(10pt)
    ${sidebarSection('Competencies')}
${competencyLines}

    #v(10pt)
    ${sidebarSection('Education')}
${educationLines}
  ],

  // === MAIN COLUMN ===
  block(
    width: 100%,
    inset: (left: 16pt, right: 16pt, top: 20pt, bottom: 14pt),
  )[
  ${mainSection('Experience')}
${experienceBlocks}
  ],
)
`;
}
