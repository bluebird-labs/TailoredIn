import FS from 'node:fs/promises';
import Path from 'node:path';
import type { ResumeTemplate } from '@tailoredin/domain';
import type { BrilliantCVContent } from '../brilliant-cv/types.js';

const RESUME_ACCENT_COLOR = '#3E6B8A';
const SHOW_ENTRY_SUMMARY = true;

/** Escape characters that have special meaning in Typst content brackets [...]. */
const escapeTypst = (str: string): string => str.replace(/</g, '\\<').replace(/>/g, '\\>');

/** Escape characters that are special in TOML basic strings. */
const escapeToml = (str: string): string => str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export class TypstFileGenerator {
  public static async generate(content: BrilliantCVContent, workDir: string, template: ResumeTemplate): Promise<void> {
    await FS.mkdir(Path.join(workDir, 'modules_en'), { recursive: true });

    await Promise.all([
      FS.writeFile(
        Path.join(workDir, 'metadata.toml'),
        TypstFileGenerator.buildMetadataToml(content, template),
        'utf8'
      ),
      FS.writeFile(Path.join(workDir, 'cv.typ'), TypstFileGenerator.buildCvTyp(template), 'utf8'),
      FS.writeFile(Path.join(workDir, 'helpers.typ'), TypstFileGenerator.buildHelpersTyp(template), 'utf8'),
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

  /**
   * Like generate(), but injects #mark() position markers around every content block.
   * Used by TypstTemplateLayoutAnalyzer to measure block positions via `typst query`.
   *
   * @param content - The resume content (same as render mode)
   * @param workDir - A TEMP directory — NOT the shared TYPST_DIR — to avoid render conflicts
   * @param template - Layout constants for the target template
   */
  public static async generateForAnalysis(
    content: BrilliantCVContent,
    workDir: string,
    template: ResumeTemplate,
  ): Promise<void> {
    await FS.mkdir(Path.join(workDir, 'modules_en'), { recursive: true });

    await Promise.all([
      FS.writeFile(Path.join(workDir, 'metadata.toml'), TypstFileGenerator.buildMetadataToml(content, template), 'utf8'),
      FS.writeFile(Path.join(workDir, 'cv.typ'), TypstFileGenerator.buildAnalysisCvTyp(template), 'utf8'),
      FS.writeFile(Path.join(workDir, 'helpers.typ'), TypstFileGenerator.buildAnalysisHelpersTyp(template), 'utf8'),
      FS.writeFile(
        Path.join(workDir, 'modules_en', 'professional.typ'),
        TypstFileGenerator.buildAnalysisProfessionalTyp(content),
        'utf8'
      ),
      FS.writeFile(
        Path.join(workDir, 'modules_en', 'skills.typ'),
        TypstFileGenerator.buildAnalysisSkillsTyp(content),
        'utf8'
      ),
      FS.writeFile(
        Path.join(workDir, 'modules_en', 'education.typ'),
        TypstFileGenerator.buildAnalysisEducationTyp(content),
        'utf8'
      ),
    ]);
  }

  private static buildMetadataToml(content: BrilliantCVContent, template: ResumeTemplate): string {
    const { personal, keywords } = content;
    const keywordsList = keywords.map(k => `"${escapeToml(k)}"`).join(', ');

    return `language = "en"

[layout]
  awesome_color = "#1A1A1A"
  before_section_skip = "${template.sectionSpacingPt}pt"
  before_entry_skip = "${template.entrySpacingPt}pt"
  before_entry_description_skip = "2pt"
  paper_size = "${template.pageSize}"
  [layout.fonts]
    regular_fonts = ["IBM Plex Sans"]
    header_font = "IBM Plex Sans"
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
    linkedin = "${personal.linkedin}"
    email = "${personal.email}"
    phone = "${personal.phone}"
    location = "${personal.location}"

[lang.en]
  header_quote = "${escapeToml(personal.header_quote)}"
  cv_footer = "R\u00e9sum\u00e9"
  letter_footer = "Cover letter"
`;
  }

  private static buildCvTyp(template: ResumeTemplate): string {
    const sections = ['professional', 'skills', 'education'];
    const includes = sections.map(s => `#include "modules_en/${s}.typ"`).join('\n');

    return `#import "@preview/brilliant-cv:3.3.0": cv
#let metadata = toml("./metadata.toml")
#set text(size: ${template.bodyFontSizePt}pt)
#set par(leading: ${template.lineHeightEm}em)
#set page(margin: ${template.margins.top}cm)
// Override personal info icons to use text labels instead of Font Awesome
#let custom-icons = (
  github: box(width: 10pt, align(center, text(size: 8pt, "GH"))),
  email: box(width: 10pt, align(center, text(size: 8pt, "✉"))),
  linkedin: box(width: 10pt, align(center, text(size: 8pt, "in"))),
  phone: box(width: 10pt, align(center, text(size: 8pt, "☎"))),
  location: box(width: 10pt, align(center, text(size: 8pt, "⌂"))),
)
#show: cv.with(metadata, custom-icons: custom-icons)

${includes}
`;
  }

  private static buildHelpersTyp(template: ResumeTemplate): string {
    return `\
#import "@preview/brilliant-cv:3.3.0": cv-entry, cv-skill, h-bar

#let _accent = rgb("${RESUME_ACCENT_COLOR}")
#let _section-skip = ${template.sectionSpacingPt}pt

// Custom cv-section: re-implements brilliant-cv's section header with an accent-colored divider line.
// The package's built-in cv-section uses a hardcoded black stroke that does not follow awesome_color.
#let cv-section(title) = {
  v(_section-skip)
  block(
    sticky: true,
    [#text(size: 16pt, weight: "bold", title)
    #h(2pt)
    #box(width: 1fr, line(stroke: 0.9pt + _accent, length: 100%))]
  )
}
`;
  }

  private static buildProfessionalTyp(content: BrilliantCVContent): string {
    const lines: string[] = [`#import "../helpers.typ": cv-section, cv-entry`, ``, `#cv-section("Experience")`, ``];

    // Group consecutive experiences by company (society)
    const groups: { society: string; positions: typeof content.experience }[] = [];
    for (const exp of content.experience) {
      const last = groups[groups.length - 1];
      if (last && last.society === exp.society) {
        last.positions.push(exp);
      } else {
        groups.push({ society: exp.society, positions: [exp] });
      }
    }

    for (const group of groups) {
      if (group.positions.length === 1) {
        // Single position — render as before
        const exp = group.positions[0];
        const highlights = exp.highlights;

        lines.push(`#cv-entry(`);
        lines.push(`  title: [${escapeTypst(exp.title)}],`);
        lines.push(`  society: [${exp.society}],`);
        lines.push(`  date: [${exp.date}],`);
        lines.push(`  location: [${escapeTypst(exp.location)}],`);
        lines.push(`  description: [`);
        if (SHOW_ENTRY_SUMMARY && exp.summary) {
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
      } else {
        // Multiple positions at same company — group under one header
        const first = group.positions[0];
        const last = group.positions[group.positions.length - 1];
        const dateRange = `${last.date.split(' – ')[0]} – ${first.date.split(' – ')[1]}`;

        lines.push(`#cv-entry(`);
        lines.push(`  title: [],`);
        lines.push(`  society: [${group.society}],`);
        lines.push(`  date: [${dateRange}],`);
        lines.push(`  location: [],`);
        lines.push(`  description: [`);

        for (let i = 0; i < group.positions.length; i++) {
          const pos = group.positions[i];
          const highlights = pos.highlights;

          if (i > 0) lines.push(`    #v(4pt)`);
          lines.push(`    *${escapeTypst(pos.title)}* #h(1fr) _${pos.date}_`);

          if (SHOW_ENTRY_SUMMARY && pos.summary) {
            lines.push(`    #v(1pt)`);
            lines.push(`    _${escapeTypst(pos.summary)}_`);
          }
          if (highlights.length > 0) {
            lines.push(`    #v(2pt)`);
            lines.push(`    #list(`);
            for (const h of highlights) {
              lines.push(`      [${escapeTypst(h)}],`);
            }
            lines.push(`    )`);
          }
        }

        lines.push(`  ],`);
        lines.push(`)`);
        lines.push(``);
      }
    }

    return lines.join('\n');
  }

  private static buildSkillsTyp(content: BrilliantCVContent): string {
    const relevant = content.skills.filter(s => s.type !== 'interests');
    if (relevant.length === 0) return '';

    const keywords = relevant.map(s => s.info).join(' #h-bar() ');

    return [
      `#import "../helpers.typ": cv-section, h-bar`,
      ``,
      `#cv-section("Areas of Expertise")`,
      ``,
      `#par[${escapeTypst(keywords)}]`
    ].join('\n');
  }

  private static buildEducationTyp(content: BrilliantCVContent): string {
    if (content.education.length === 0) return '';

    const lines: string[] = [`#import "../helpers.typ": cv-section`, ``, `#cv-section("Education")`, ``];

    for (const edu of content.education) {
      lines.push(
        `*${escapeTypst(edu.title)}* --- ${escapeTypst(edu.society)}, ${escapeTypst(edu.location)} #h(1fr) ${edu.date}`
      );
      lines.push(``);
    }

    return lines.join('\n');
  }

  private static buildAnalysisHelpersTyp(template: ResumeTemplate): string {
    return `\
#import "@preview/brilliant-cv:3.3.0": cv-entry, cv-skill, h-bar

#let _accent = rgb("${RESUME_ACCENT_COLOR}")
#let _section-skip = ${template.sectionSpacingPt}pt

#let cv-section(title) = {
  v(_section-skip)
  block(
    sticky: true,
    [#text(size: 16pt, weight: "bold", title)
    #h(2pt)
    #box(width: 1fr, line(stroke: 0.9pt + _accent, length: 100%))]
  )
}

// === Analysis mode: position tracking ===
#let layout-positions = state("layout-positions", (:))

#let mark(id) = context {
  let pos = here().position()
  layout-positions.update(prev => {
    let next = prev
    next.insert(id, (page: here().page(), y: pos.y.pt()))
    next
  })
}
`;
  }

  private static buildAnalysisCvTyp(template: ResumeTemplate): string {
    const sections = ['professional', 'skills', 'education'];
    const includes = sections.map(s => `#include "modules_en/${s}.typ"`).join('\n');

    return `#import "@preview/brilliant-cv:3.3.0": cv
#let metadata = toml("./metadata.toml")
#set text(size: ${template.bodyFontSizePt}pt)
#set par(leading: ${template.lineHeightEm}em)
#set page(margin: ${template.margins.top}cm)
#let custom-icons = (
  github: box(width: 10pt, align(center, text(size: 8pt, "GH"))),
  email: box(width: 10pt, align(center, text(size: 8pt, "✉"))),
  linkedin: box(width: 10pt, align(center, text(size: 8pt, "in"))),
  phone: box(width: 10pt, align(center, text(size: 8pt, "☎"))),
  location: box(width: 10pt, align(center, text(size: 8pt, "⌂"))),
)
#show: cv.with(metadata, custom-icons: custom-icons)

${includes}

// Capture all accumulated positions as a single queryable metadata element
#context metadata(layout-positions.final()) <all-layout-positions>
`;
  }

  private static buildAnalysisProfessionalTyp(content: BrilliantCVContent): string {
    const lines: string[] = [
      `#import "../helpers.typ": cv-section, cv-entry, mark`,
      ``,
      `#cv-section("Experience")`,
      ``,
    ];

    const groups: { society: string; positions: typeof content.experience }[] = [];
    for (const exp of content.experience) {
      const last = groups[groups.length - 1];
      if (last && last.society === exp.society) {
        last.positions.push(exp);
      } else {
        groups.push({ society: exp.society, positions: [exp] });
      }
    }

    for (let gi = 0; gi < groups.length; gi++) {
      const group = groups[gi];

      lines.push(`#mark("exp-${gi}-company-start")`);

      if (group.positions.length === 1) {
        const exp = group.positions[0];

        lines.push(`#cv-entry(`);
        lines.push(`  title: [${escapeTypst(exp.title)}],`);
        lines.push(`  society: [${exp.society}],`);
        lines.push(`  date: [${exp.date}],`);
        lines.push(`  location: [${escapeTypst(exp.location)}],`);
        lines.push(`  description: [`);
        lines.push(`    #mark("exp-${gi}-role-0-title-start")`);
        if (SHOW_ENTRY_SUMMARY && exp.summary) {
          lines.push(`    _${escapeTypst(exp.summary)}_`);
        }
        lines.push(`    #mark("exp-${gi}-role-0-title-end")`);
        if (exp.highlights.length > 0) {
          lines.push(`    #v(2pt)`);
          for (let bi = 0; bi < exp.highlights.length; bi++) {
            lines.push(`    #mark("exp-${gi}-role-0-bullet-${bi}-start")`);
            lines.push(`    - ${escapeTypst(exp.highlights[bi])}`);
            lines.push(`    #mark("exp-${gi}-role-0-bullet-${bi}-end")`);
          }
        }
        lines.push(`  ],`);
        lines.push(`)`);
      } else {
        const first = group.positions[0];
        const last = group.positions[group.positions.length - 1];
        const dateRange = `${last.date.split(' – ')[0]} – ${first.date.split(' – ')[1]}`;

        lines.push(`#cv-entry(`);
        lines.push(`  title: [],`);
        lines.push(`  society: [${group.society}],`);
        lines.push(`  date: [${dateRange}],`);
        lines.push(`  location: [],`);
        lines.push(`  description: [`);

        for (let ri = 0; ri < group.positions.length; ri++) {
          const pos = group.positions[ri];
          if (ri > 0) lines.push(`    #v(4pt)`);
          lines.push(`    #mark("exp-${gi}-role-${ri}-title-start")`);
          lines.push(`    *${escapeTypst(pos.title)}* #h(1fr) _${pos.date}_`);
          if (SHOW_ENTRY_SUMMARY && pos.summary) {
            lines.push(`    #v(1pt)`);
            lines.push(`    _${escapeTypst(pos.summary)}_`);
          }
          lines.push(`    #mark("exp-${gi}-role-${ri}-title-end")`);
          if (pos.highlights.length > 0) {
            lines.push(`    #v(2pt)`);
            for (let bi = 0; bi < pos.highlights.length; bi++) {
              lines.push(`    #mark("exp-${gi}-role-${ri}-bullet-${bi}-start")`);
              lines.push(`    - ${escapeTypst(pos.highlights[bi])}`);
              lines.push(`    #mark("exp-${gi}-role-${ri}-bullet-${bi}-end")`);
            }
          }
        }

        lines.push(`  ],`);
        lines.push(`)`);
      }

      lines.push(`#mark("exp-${gi}-company-end")`);
      lines.push(``);
    }

    return lines.join('\n');
  }

  private static buildAnalysisSkillsTyp(content: BrilliantCVContent): string {
    const relevant = content.skills.filter(s => s.type !== 'interests');
    if (relevant.length === 0) return '';

    const lines: string[] = [
      `#import "../helpers.typ": cv-section, h-bar, mark`,
      ``,
      `#cv-section("Areas of Expertise")`,
      ``,
    ];

    for (let si = 0; si < relevant.length; si++) {
      lines.push(`#mark("skill-${si}-start")`);
      lines.push(`#par[${escapeTypst(relevant[si].info)}]`);
      lines.push(`#mark("skill-${si}-end")`);
    }

    return lines.join('\n');
  }

  private static buildAnalysisEducationTyp(content: BrilliantCVContent): string {
    if (content.education.length === 0) return '';

    const lines: string[] = [
      `#import "../helpers.typ": cv-section, mark`,
      ``,
      `#cv-section("Education")`,
      ``,
    ];

    for (let ei = 0; ei < content.education.length; ei++) {
      const edu = content.education[ei];
      lines.push(`#mark("edu-${ei}-start")`);
      lines.push(
        `*${escapeTypst(edu.title)}* --- ${escapeTypst(edu.society)}, ${escapeTypst(edu.location)} #h(1fr) ${edu.date}`
      );
      lines.push(`#mark("edu-${ei}-end")`);
      lines.push(``);
    }

    return lines.join('\n');
  }
}
