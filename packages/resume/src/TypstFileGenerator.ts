import FS from 'node:fs/promises';
import Path from 'node:path';
import { BrilliantCVContent } from '../brilliant-cv/types.js';

/** Escape characters that have special meaning in Typst content brackets [...]. */
const escapeTypst = (str: string): string => str.replace(/</g, '\\<').replace(/>/g, '\\>');

/** Escape characters that are special in TOML basic strings. */
const escapeToml = (str: string): string => str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export class TypstFileGenerator {
  static async generate(content: BrilliantCVContent, workDir: string): Promise<void> {
    await FS.mkdir(Path.join(workDir, 'modules_en'), { recursive: true });

    await Promise.all([
      FS.writeFile(Path.join(workDir, 'metadata.toml'), TypstFileGenerator.buildMetadataToml(content), 'utf8'),
      FS.writeFile(Path.join(workDir, 'cv.typ'), TypstFileGenerator.buildCvTyp(), 'utf8'),
      FS.writeFile(
        Path.join(workDir, 'modules_en', 'professional.typ'),
        TypstFileGenerator.buildProfessionalTyp(content),
        'utf8'
      ),
      FS.writeFile(
        Path.join(workDir, 'modules_en', 'skills.typ'),
        TypstFileGenerator.buildSkillsTyp(content),
        'utf8'
      ),
      FS.writeFile(
        Path.join(workDir, 'modules_en', 'education.typ'),
        TypstFileGenerator.buildEducationTyp(content),
        'utf8'
      )
    ]);
  }

  private static buildMetadataToml(content: BrilliantCVContent): string {
    const { personal, awesome_color, keywords } = content;
    const keywordsList = keywords.map(k => `"${escapeToml(k)}"`).join(', ');

    return `language = "en"

[layout]
  awesome_color = "${awesome_color}"
  before_section_skip = "1pt"
  before_entry_skip = "1pt"
  before_entry_description_skip = "1pt"
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
  cv_footer = "Résumé"
  letter_footer = "Cover letter"
`;
  }

  private static buildCvTyp(): string {
    return `#import "@preview/brilliant-cv:3.3.0": cv
#let metadata = toml("./metadata.toml")
#show: cv.with(metadata)

#include "modules_en/professional.typ"
#include "modules_en/skills.typ"
#include "modules_en/education.typ"
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
      lines.push(`#cv-entry(`);
      lines.push(`  title: [${escapeTypst(exp.title)}],`);
      lines.push(`  society: [${exp.society}],`); // NOT escaped — may contain #smallcaps[...]
      lines.push(`  date: [${exp.date}],`);
      lines.push(`  location: [${escapeTypst(exp.location)}],`);
      lines.push(`  description: list(`);
      lines.push(`    [_${escapeTypst(exp.summary)}_],`);
      for (const h of exp.highlights) {
        lines.push(`    [${escapeTypst(h)}],`);
      }
      lines.push(`  ),`);
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
      `#import "@preview/brilliant-cv:3.3.0": cv-section, cv-entry`,
      ``,
      `#cv-section("Education")`,
      ``
    ];

    for (const edu of content.education) {
      lines.push(`#cv-entry(`);
      lines.push(`  title: [${escapeTypst(edu.title)}],`);
      lines.push(`  society: [${escapeTypst(edu.society)}],`);
      lines.push(`  date: [${edu.date}],`);
      lines.push(`  location: [${escapeTypst(edu.location)}],`);
      lines.push(`  description: list(),`);
      lines.push(`)`);
      lines.push(``);
    }

    return lines.join('\n');
  }
}
