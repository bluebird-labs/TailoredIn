import FS from 'node:fs/promises';
import Path from 'node:path';
import type { BrilliantCVContent } from '../brilliant-cv/types.js';

const RESUME_LAYOUT = {
  beforeSectionSkip: '4pt',
  beforeEntrySkip: '3pt',
  beforeEntryDescriptionSkip: '2pt',
  bodyFontSize: '10.5pt',
  headerFontSize: '30pt',
  lineSpacing: '0.75em',
  pageMargin: '1.5cm',
  sectionOrder: ['professional', 'skills', 'education'] as const,
  maxBulletsPerEntry: 5,
  showEntrySummary: true
};

/** Escape characters that have special meaning in Typst content brackets [...]. */
const escapeTypst = (str: string): string => str.replace(/</g, '\\<').replace(/>/g, '\\>');

/** Escape characters that are special in TOML basic strings. */
const escapeToml = (str: string): string => str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export class TypstFileGenerator {
  public static async generate(content: BrilliantCVContent, workDir: string): Promise<void> {
    await FS.mkdir(Path.join(workDir, 'modules_en'), { recursive: true });

    await Promise.all([
      FS.writeFile(Path.join(workDir, 'metadata.toml'), TypstFileGenerator.buildMetadataToml(content), 'utf8'),
      FS.writeFile(Path.join(workDir, 'cv.typ'), TypstFileGenerator.buildCvTyp(), 'utf8'),
      FS.writeFile(
        Path.join(workDir, 'modules_en', 'professional.typ'),
        TypstFileGenerator.buildProfessionalTyp(content),
        'utf8'
      ),
      FS.writeFile(Path.join(workDir, 'modules_en', 'skills.typ'), TypstFileGenerator.buildSkillsTyp(content), 'utf8'),
      FS.writeFile(
        Path.join(workDir, 'modules_en', 'education.typ'),
        TypstFileGenerator.buildEducationTyp(content),
        'utf8'
      )
    ]);
  }

  private static buildMetadataToml(content: BrilliantCVContent): string {
    const { personal, keywords } = content;
    const keywordsList = keywords.map(k => `"${escapeToml(k)}"`).join(', ');

    return `language = "en"

[layout]
  awesome_color = "#333333"
  before_section_skip = "${RESUME_LAYOUT.beforeSectionSkip}"
  before_entry_skip = "${RESUME_LAYOUT.beforeEntrySkip}"
  before_entry_description_skip = "${RESUME_LAYOUT.beforeEntryDescriptionSkip}"
  paper_size = "us-letter"
  [layout.fonts]
    regular_fonts = ["Source Sans 3"]
    header_font = "Roboto"
  [layout.header]
    header_align = "left"
    display_profile_photo = false
  [layout.entry]
    display_entry_society_first = true
    display_logo = false
  [layout.footer]
    display_page_counter = false
    display_footer = false

[inject]
  injected_keywords_list = [${keywordsList}]

[personal]
  first_name = "${escapeToml(personal.first_name)}"
  last_name = "${escapeToml(personal.last_name)}"
  [personal.info]
    github = "${personal.github}"
    email = "${personal.email}"
    linkedin = "${personal.linkedin}"
    phone = "${personal.phone}"
    location = "${personal.location}"

[lang.en]
  header_quote = "${escapeToml(personal.header_quote)}"
  cv_footer = "R\u00e9sum\u00e9"
  letter_footer = "Cover letter"
`;
  }

  private static buildCvTyp(): string {
    const includes = RESUME_LAYOUT.sectionOrder.map(section => `#include "modules_en/${section}.typ"`).join('\n');

    return `#import "@preview/brilliant-cv:3.3.0": cv
#let metadata = toml("./metadata.toml")
#set text(size: ${RESUME_LAYOUT.bodyFontSize})
#set par(leading: ${RESUME_LAYOUT.lineSpacing})
#set page(margin: ${RESUME_LAYOUT.pageMargin})
#show: cv.with(metadata)

${includes}
`;
  }

  private static buildProfessionalTyp(content: BrilliantCVContent): string {
    const lines: string[] = [
      `#import "@preview/brilliant-cv:3.3.0": cv-section, cv-entry`,
      ``,
      `#cv-section("Professional Experience")`,
      ``
    ];

    for (const exp of content.experience) {
      const highlights = exp.highlights.slice(0, RESUME_LAYOUT.maxBulletsPerEntry);

      lines.push(`#cv-entry(`);
      lines.push(`  title: [${escapeTypst(exp.title)}],`);
      lines.push(`  society: [${exp.society}],`); // NOT escaped — may contain #smallcaps[...]
      lines.push(`  date: [${exp.date}],`);
      lines.push(`  location: [${escapeTypst(exp.location)}],`);
      lines.push(`  description: [`);
      if (RESUME_LAYOUT.showEntrySummary && exp.summary) {
        lines.push(`    _${escapeTypst(exp.summary)}_`);
        if (highlights.length > 0) lines.push(`    #v(2pt)`);
      }
      if (highlights.length > 0) {
        lines.push(`    #list(`);
        for (const h of highlights) {
          lines.push(`      [${escapeTypst(h)}],`);
        }
        lines.push(`    )`);
      }
      lines.push(`  ],`);
      lines.push(`)`);
      lines.push(``);
    }

    return lines.join('\n');
  }

  private static buildSkillsTyp(content: BrilliantCVContent): string {
    const lines: string[] = [
      `#import "@preview/brilliant-cv:3.3.0": cv-section, cv-skill, h-bar`,
      ``,
      `#cv-section("Skills")`,
      ``
    ];

    for (const skill of content.skills) {
      lines.push(`#cv-skill(`);
      lines.push(`  type: [${escapeTypst(skill.type)}],`);
      lines.push(`  info: [${escapeTypst(skill.info)}],`);
      lines.push(`)`);
    }

    return lines.join('\n');
  }

  private static buildEducationTyp(content: BrilliantCVContent): string {
    const lines: string[] = [
      `#import "@preview/brilliant-cv:3.3.0": cv-section`,
      ``,
      `#cv-section("Education")`,
      ``
    ];

    for (const edu of content.education) {
      lines.push(`[*${escapeTypst(edu.title)}* --- ${escapeTypst(edu.society)}, ${escapeTypst(edu.location)} #h(1fr) ${edu.date}]`);
      lines.push(``);
    }

    return lines.join('\n');
  }
}
