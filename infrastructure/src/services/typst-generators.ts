import type { ResumeRenderEducation, ResumeRenderExperience } from '@tailoredin/application';
import type { LayoutAnalysis, ResumeTemplate } from '@tailoredin/domain';

export type { ResumeRenderEducation, ResumeRenderExperience } from '@tailoredin/application';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso: string): string {
  const [year, month] = iso.split('-');
  const monthIndex = parseInt(month ?? '1', 10) - 1;
  return `${MONTHS[monthIndex] ?? 'Jan'} ${year}`;
}

function formatDateRange(startDate: string, endDate: string | null): string {
  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : 'Present';
  return `${start} – ${end}`;
}

export function escapeTypst(text: string): string {
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

export function escapeTomValue(text: string): string {
  return text.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

export function generateConfigTyp(template: ResumeTemplate): string {
  const { top, bottom, left, right } = template.margins;
  return `#let cfg-body-font-size = ${template.bodyFontSizePt}pt
#let cfg-leading = ${template.lineHeightEm}em
#let cfg-margin = (top: ${top}cm, bottom: ${bottom}cm, left: ${left}cm, right: ${right}cm)
#let cfg-header-font-size = ${template.headerFontSizePt}pt
`;
}

export function generateMetadataToml(
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    location: string | null;
    linkedin: string | null;
    github: string | null;
    website: string | null;
  },
  headlineSummary: string | null,
  template: ResumeTemplate
): string {
  const firstName = escapeTomValue(personal.firstName);
  const lastName = escapeTomValue(personal.lastName);
  const email = escapeTomValue(personal.email);
  const phone = escapeTomValue(personal.phone ?? '');
  const location = escapeTomValue(personal.location ?? '');
  const linkedin = escapeTomValue(personal.linkedin ?? '');
  const github = escapeTomValue(personal.github ?? '');
  const quote = escapeTomValue(headlineSummary ?? '');
  const descriptionSkip = Math.max(1, Math.floor(template.entrySpacingPt / 2));

  return `language = "en"

[layout]
  awesome_color = "#3E6B8A"
  before_section_skip = "${template.sectionSpacingPt}pt"
  before_entry_skip = "${template.entrySpacingPt}pt"
  before_entry_description_skip = "${descriptionSkip}pt"
  paper_size = "${template.pageSize}"
  [layout.fonts]
    regular_fonts = ["IBM Plex Sans"]
    header_font = "IBM Plex Sans"
  [layout.header]
    header_align = "left"
    display_profile_photo = false
    info_font_size = "8pt"
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

export function generateProfessionalTyp(experiences: ResumeRenderExperience[]): string {
  const entries = experiences
    .filter(exp => exp.bullets.length > 0)
    .map(exp => {
      const title = escapeTypst(exp.title);
      const society = escapeTypst(exp.companyName);
      const date = escapeTypst(formatDateRange(exp.startDate, exp.endDate));
      const location = escapeTypst(exp.location);
      const summary = exp.summary ? `  _${escapeTypst(exp.summary)}_\n  #v(2pt)\n  ` : '  ';
      const bulletLines = exp.bullets.map(b => `      [${escapeTypst(b)}],`).join('\n');

      return `#block(breakable: false)[
#cv-entry(
  title: [${title}],
  society: [${society}],
  date: [${date}],
  location: [${location}],
  description: [
${summary}#list(
${bulletLines}
    )
  ],
)
]`;
    });

  if (entries.length === 0) {
    return '#import "../helpers.typ": *\n';
  }

  return `#import "../helpers.typ": *

#cv-section("Experience")

${entries.join('\n\n')}
`;
}

export function generateEducationTyp(educations: ResumeRenderEducation[]): string {
  if (educations.length === 0) {
    return '#import "../helpers.typ": *\n';
  }

  const entries = educations.map(edu => {
    const title = escapeTypst(edu.degreeTitle);
    const society = escapeTypst(edu.institutionName);
    const date = String(edu.graduationYear);
    const location = escapeTypst(edu.location ?? '');
    const description = edu.honors ? `[_${escapeTypst(edu.honors)}_]` : '[]';

    return `#block(breakable: false)[
#cv-entry(
  title: [${title}],
  society: [${society}],
  date: [${date}],
  location: [${location}],
  description: ${description},
)
]`;
  });

  return `#import "../helpers.typ": *

#cv-section("Education")

${entries.join('\n\n')}
`;
}

const EMPTY_BLOCK_LAYOUT = { lineCount: 0, pageNumbers: [] };

export function analyzeLayout(pdf: Uint8Array): LayoutAnalysis {
  // Decode as latin1 to handle binary PDF content safely
  const text = new TextDecoder('latin1').decode(pdf);
  // Match /Type /Page but NOT /Type /Pages
  const totalPages = (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  return {
    totalPages,
    header: {
      name: EMPTY_BLOCK_LAYOUT,
      headline: EMPTY_BLOCK_LAYOUT,
      infoLine: EMPTY_BLOCK_LAYOUT
    },
    experiences: [],
    education: [],
    skills: []
  };
}
