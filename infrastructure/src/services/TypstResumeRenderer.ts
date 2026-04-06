import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { injectable } from '@needle-di/core';
import type {
  ResumeRenderEducation,
  ResumeRenderExperience,
  ResumeRenderer,
  ResumeRenderInput
} from '@tailoredin/application';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TYPST_DIR = join(import.meta.dir, '../../typst');

function formatDate(iso: string): string {
  // "2025-03-01" or "2025-03" → "Mar 2025"
  const [year, month] = iso.split('-');
  const monthIndex = parseInt(month ?? '1', 10) - 1;
  return `${MONTHS[monthIndex] ?? 'Jan'} ${year}`;
}

function formatDateRange(startDate: string, endDate: string | null): string {
  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : 'Present';
  return `${start} – ${end}`;
}

function escapeTypst(text: string): string {
  // Escape Typst markup characters inside content blocks
  return text
    .replaceAll('\\', '\\\\')
    .replaceAll('#', '\\#')
    .replaceAll('[', '\\[')
    .replaceAll(']', '\\]')
    .replaceAll('_', '\\_')
    .replaceAll('*', '\\*')
    .replaceAll('@', '\\@')
    .replaceAll('<', '\\<')
    .replaceAll('>', '\\>');
}

function escapeTomValue(text: string): string {
  return text.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function generateMetadataToml(input: ResumeRenderInput): string {
  const { personal, headlineSummary } = input;
  const firstName = escapeTomValue(personal.firstName);
  const lastName = escapeTomValue(personal.lastName);
  const email = escapeTomValue(personal.email);
  const phone = escapeTomValue(personal.phone ?? '');
  const location = escapeTomValue(personal.location ?? '');
  const linkedin = escapeTomValue(personal.linkedin ?? '');
  const github = escapeTomValue(personal.github ?? '');
  const quote = escapeTomValue(headlineSummary ?? '');

  return `language = "en"

[layout]
  awesome_color = "#1A1A1A"
  before_section_skip = "4pt"
  before_entry_skip = "3pt"
  before_entry_description_skip = "2pt"
  paper_size = "us-letter"
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
  injected_keywords_list = []

[personal]
  first_name = "${firstName}"
  last_name = "${lastName}"
  [personal.info]
    linkedin = "${linkedin}"
    email = "${email}"
    phone = "${phone}"
    location = "${location}"
${github ? `    github = "${github}"\n` : ''}
[lang.en]
  header_quote = "${quote}"
  cv_footer = "Résumé"
  letter_footer = "Cover letter"
`;
}

function generateProfessionalTyp(experiences: ResumeRenderExperience[]): string {
  if (experiences.length === 0) {
    return '#import "../helpers.typ": cv-section, cv-entry\n';
  }

  const entries = experiences
    .filter(exp => exp.bullets.length > 0)
    .map(exp => {
      const title = escapeTypst(exp.title);
      const society = escapeTypst(exp.companyName);
      const date = escapeTypst(formatDateRange(exp.startDate, exp.endDate));
      const location = escapeTypst(exp.location);
      const summary = exp.summary ? `  _${escapeTypst(exp.summary)}_\n  #v(2pt)\n  ` : '  ';
      const bulletLines = exp.bullets.map(b => `      [${escapeTypst(b)}],`).join('\n');

      return `#cv-entry(
  title: [${title}],
  society: [${society}],
  date: [${date}],
  location: [${location}],
  description: [
${summary}#list(
${bulletLines}
    )
  ],
)`;
    });

  return `#import "../helpers.typ": cv-section, cv-entry

#cv-section("Experience")

${entries.join('\n\n')}
`;
}

function generateEducationTyp(educations: ResumeRenderEducation[]): string {
  if (educations.length === 0) {
    return '#import "../helpers.typ": cv-section, cv-entry\n';
  }

  const entries = educations.map(edu => {
    const title = escapeTypst(edu.degreeTitle);
    const society = escapeTypst(edu.institutionName);
    const date = String(edu.graduationYear);
    const location = escapeTypst(edu.location ?? '');

    return `#cv-entry(
  title: [${title}],
  society: [${society}],
  date: [${date}],
  location: [${location}],
  description: [],
)`;
  });

  return `#import "../helpers.typ": cv-section, cv-entry

#cv-section("Education")

${entries.join('\n\n')}
`;
}

@injectable()
export class TypstResumeRenderer implements ResumeRenderer {
  public async render(input: ResumeRenderInput): Promise<Uint8Array> {
    const tmpDir = await mkdtemp('/tmp/tailoredin-resume-');

    try {
      // Create modules directory
      await mkdir(join(tmpDir, 'modules_en'));

      // Copy static files
      await Bun.write(join(tmpDir, 'cv.typ'), Bun.file(join(TYPST_DIR, 'cv.typ')));
      await Bun.write(join(tmpDir, 'helpers.typ'), Bun.file(join(TYPST_DIR, 'helpers.typ')));
      await Bun.write(join(tmpDir, 'modules_en', 'skills.typ'), Bun.file(join(TYPST_DIR, 'modules_en', 'skills.typ')));

      // Copy fonts directory (typst --font-path needs the actual font files)
      const fontsDir = join(TYPST_DIR, 'fonts');
      await mkdir(join(tmpDir, 'fonts'));
      const fontsGlob = new Bun.Glob('*.{otf,ttf,woff,woff2}');
      for await (const fontFile of fontsGlob.scan(fontsDir)) {
        await Bun.write(join(tmpDir, 'fonts', fontFile), Bun.file(join(fontsDir, fontFile)));
      }

      // Write dynamic files
      await writeFile(join(tmpDir, 'metadata.toml'), generateMetadataToml(input));
      await writeFile(join(tmpDir, 'modules_en', 'professional.typ'), generateProfessionalTyp(input.experiences));
      await writeFile(join(tmpDir, 'modules_en', 'education.typ'), generateEducationTyp(input.educations));

      // Compile with typst
      const proc = Bun.spawn(['typst', 'compile', '--font-path', './fonts', 'cv.typ', 'output.pdf'], {
        cwd: tmpDir,
        stderr: 'pipe'
      });

      const exitCode = await proc.exited;

      if (exitCode !== 0) {
        const stderr = await new Response(proc.stderr).text();
        throw new Error(`Typst compilation failed (exit ${exitCode}): ${stderr}`);
      }

      const pdfBuffer = await Bun.file(join(tmpDir, 'output.pdf')).arrayBuffer();
      return new Uint8Array(pdfBuffer);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }
}
