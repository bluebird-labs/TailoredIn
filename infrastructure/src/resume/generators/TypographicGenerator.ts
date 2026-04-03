import FS from 'node:fs/promises';
import Path from 'node:path';
import type { ResumeContentDto } from '@tailoredin/application';
import type { TemplateGenerator } from '../TemplateGenerator.js';
import { escapeTypst } from './typst-escape.js';

export class TypographicGenerator implements TemplateGenerator {
  public async generate(content: ResumeContentDto, workDir: string): Promise<void> {
    await FS.writeFile(Path.join(workDir, 'cv.typ'), buildTyp(content), 'utf8');
  }
}

function buildTyp(content: ResumeContentDto): string {
  const { personal, experience, skills, education } = content;

  const contactEntries = [
    `      #contact-entry[Location][${escapeTypst(personal.location)}]`,
    `      #contact-entry[Email][#link("mailto:${personal.email}")[${escapeTypst(personal.email)}]]`,
    personal.linkedin
      ? `      #contact-entry[LinkedIn][#link("https://linkedin.com/in/${personal.linkedin}")[linkedin.com/in/${personal.linkedin}]]`
      : '',
    personal.github
      ? `      #contact-entry[GitHub][#link("https://github.com/${personal.github}")[github.com/${personal.github}]]`
      : ''
  ]
    .filter(Boolean)
    .join('\n');

  const competencyLines = skills.map(s => `      - *${escapeTypst(s.type)}:* ${escapeTypst(s.info)}`).join('\n');

  const educationEntries = education
    .map(
      edu => `      #education-entry(
        timeframe: "${edu.date}",
        title: "${escapeTypst(edu.title)}",
        institution: "${escapeTypst(edu.society)}",
        location: "${escapeTypst(edu.location)}",
      )[]`
    )
    .join('\n');

  const experienceEntries = experience
    .map(exp => {
      const body = exp.summary
        ? `${escapeTypst(exp.summary)}${exp.highlights.length > 0 ? `\n\n${exp.highlights.map(h => `    - ${escapeTypst(h)}`).join('\n')}` : ''}`
        : exp.highlights.map(h => `    - ${escapeTypst(h)}`).join('\n');

      return `  #work-entry(
    timeframe: "${exp.date}",
    title: "${escapeTypst(exp.title)}",
    organization: "${escapeTypst(exp.society)}",
    location: "${escapeTypst(exp.location)}",
  )[
    ${body}
  ]`;
    })
    .join('\n\n');

  return `#import "@preview/typographic-resume:0.1.0": *

#show: resume.with(
  first-name: "${escapeTypst(personal.first_name)}",
  last-name: "${escapeTypst(personal.last_name)}",
  profession: "${escapeTypst(personal.header_quote)}",
  bio: [
    ${escapeTypst(personal.header_quote)}
  ],
  aside: [
    #section("Contact")[
${contactEntries}
    ]

    #section("Strategic Competencies")[
${competencyLines}
    ]

    #section("Education")[
${educationEntries}
    ]
  ],
)

#section("Experience")[

${experienceEntries}

]
`;
}
