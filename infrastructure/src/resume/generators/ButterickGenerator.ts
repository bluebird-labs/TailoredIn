import FS from 'node:fs/promises';
import Path from 'node:path';
import type { ResumeContentDto } from '@tailoredin/application';
import type { TemplateGenerator } from '../TemplateGenerator.js';
import { escapeTypst } from './typst-escape.js';

export class ButterickGenerator implements TemplateGenerator {
  public async generate(content: ResumeContentDto, workDir: string): Promise<void> {
    await FS.writeFile(Path.join(workDir, 'cv.typ'), buildTyp(content), 'utf8');
  }
}

function buildTyp(content: ResumeContentDto): string {
  const { personal, experience, skills, education } = content;

  const contactParts = [
    escapeTypst(personal.location),
    personal.phone ? `#link("tel:${personal.phone}")[${escapeTypst(personal.phone)}]` : '',
    `#link("mailto:${personal.email}")[${escapeTypst(personal.email)}]`,
    personal.linkedin
      ? `#link("https://linkedin.com/in/${personal.linkedin}")[linkedin.com/in/${personal.linkedin}]`
      : ''
  ]
    .filter(Boolean)
    .join(' #sym.dot.c ');

  const experienceLines = experience
    .map(exp => {
      const bullets = exp.highlights.map(h => `- ${escapeTypst(h)}`).join('\n');
      return `#two-grid(
  left: [${escapeTypst(exp.society)}],
  right: [${exp.date}],
)
_${escapeTypst(exp.title)}_
${bullets}`;
    })
    .join('\n\n');

  const competencyLines = skills.map(s => `- *${escapeTypst(s.type)}* --- ${escapeTypst(s.info)}`).join('\n');

  const educationLines = education
    .map(
      edu => `#two-grid(
  left: [${escapeTypst(edu.society)}],
  right: [${edu.date}],
)
- ${escapeTypst(edu.title)}`
    )
    .join('\n\n');

  return `#import "@preview/butterick-resume:0.1.0": *

#show: template

#set page(margin: 1.2cm)

#introduction(
  name: [${escapeTypst(personal.first_name)} ${escapeTypst(personal.last_name)}],
  details: [
    ${contactParts}
  ],
)

= Executive Summary

${escapeTypst(personal.header_quote)}

= Experience

${experienceLines}

= Strategic Competencies

${competencyLines}

= Education

${educationLines}
`;
}
