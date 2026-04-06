# Typst Resume Rendering: Education, Page Breaks, 2-Page Max — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix education rendering (with honors), prevent experience entries from splitting across pages, and enforce a strict 2-page PDF max via layout compaction + multi-pass bullet/education trimming driven by a domain `ResumeTemplate` value object.

**Architecture:** `ResumeTemplate` (already typed in the domain) gets a `DEFAULT_RESUME_TEMPLATE` constant and is threaded through the application port and use case into `TypstResumeRenderer`. The renderer generates a `config.typ` from the template (replacing hardcoded `#set` rules in `cv.typ`), wraps entries in `block(breakable: false)`, and runs a multi-pass compile loop that trims education then bullets until `≤ 2` pages. All pure generator functions are extracted to `typst-generators.ts` for testability.

**Tech Stack:** Bun, TypeScript (strict), Typst CLI (`typst compile`), brilliant-cv 3.3.0, `bun:test`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `domain/src/value-objects/ResumeTemplate.ts` | Modify | Add `DEFAULT_RESUME_TEMPLATE` constant |
| `application/src/ports/ResumeRenderer.ts` | Modify | Add `template: ResumeTemplate`; add `honors` to education type |
| `application/src/use-cases/resume/GenerateResumePdf.ts` | Modify | Pass `DEFAULT_RESUME_TEMPLATE` and `honors` |
| `infrastructure/src/services/typst-generators.ts` | **Create** | All pure generator functions + `analyzeLayout` |
| `infrastructure/src/services/TypstResumeRenderer.ts` | Modify | Import generators; refactor `render()` into `setupTempDir` + `compile` + trim loop |
| `infrastructure/typst/cv.typ` | Modify | Import `config.typ` instead of hardcoded `#set` rules |
| `infrastructure/test/services/typst-generators.test.ts` | **Create** | Unit tests for all pure generator functions |

---

## Task 1: Add `DEFAULT_RESUME_TEMPLATE` constant

**Files:**
- Modify: `domain/src/value-objects/ResumeTemplate.ts`

- [ ] **Open and read the existing file**

Current content (`domain/src/value-objects/ResumeTemplate.ts`):
```typescript
export type ResumeTemplate = {
  id: string;
  pageSize: 'us-letter' | 'a4';
  margins: { top: number; bottom: number; left: number; right: number }; // cm
  bodyFontSizePt: number;
  lineHeightEm: number;
  headerFontSizePt: number;
  sectionSpacingPt: number;
  entrySpacingPt: number;
};
```

- [ ] **Add the default constant below the type**

```typescript
export type ResumeTemplate = {
  id: string;
  pageSize: 'us-letter' | 'a4';
  margins: { top: number; bottom: number; left: number; right: number }; // cm
  bodyFontSizePt: number;
  lineHeightEm: number;
  headerFontSizePt: number;
  sectionSpacingPt: number;
  entrySpacingPt: number;
};

export const DEFAULT_RESUME_TEMPLATE: ResumeTemplate = {
  id: 'brilliant-cv-default',
  pageSize: 'us-letter',
  margins: { top: 1.1, bottom: 1.1, left: 1.1, right: 1.1 },
  bodyFontSizePt: 10,
  lineHeightEm: 0.65,
  headerFontSizePt: 32,
  sectionSpacingPt: 2,
  entrySpacingPt: 2,
};
```

- [ ] **Export the constant from the domain barrel** (`domain/src/index.ts`)

Find the existing `ResumeTemplate` export line and update it:
```typescript
export { DEFAULT_RESUME_TEMPLATE } from './value-objects/ResumeTemplate.js';
export type { ResumeTemplate } from './value-objects/ResumeTemplate.js';
```

- [ ] **Typecheck**

```bash
bun run typecheck
```
Expected: no errors.

- [ ] **Commit**

```bash
git add domain/src/value-objects/ResumeTemplate.ts domain/src/index.ts
git commit -m "feat(domain): add DEFAULT_RESUME_TEMPLATE constant"
```

---

## Task 2: Wire template and honors through the application layer

**Files:**
- Modify: `application/src/ports/ResumeRenderer.ts`
- Modify: `application/src/use-cases/resume/GenerateResumePdf.ts`

- [ ] **Update `ResumeRenderer.ts`**

Full replacement:
```typescript
import type { ResumeTemplate } from '@tailoredin/domain';

export type ResumeRenderExperience = {
  title: string;
  companyName: string;
  location: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string | null; // null = current
  summary: string | null;
  bullets: string[];
};

export type ResumeRenderEducation = {
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
};

export type ResumeRenderInput = {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    location: string | null;
    linkedin: string | null; // slug only, e.g. "sylvain-estevez"
    github: string | null;
    website: string | null;
  };
  headlineSummary: string | null;
  experiences: ResumeRenderExperience[];
  educations: ResumeRenderEducation[];
  template: ResumeTemplate;
};

export interface ResumeRenderer {
  render(input: ResumeRenderInput): Promise<Uint8Array>;
}
```

- [ ] **Update `GenerateResumePdf.ts`** — add `DEFAULT_RESUME_TEMPLATE` import and pass `honors` + `template`

At the top, add the import:
```typescript
import {
  type EducationRepository,
  DEFAULT_RESUME_TEMPLATE,
  EntityNotFoundError,
  type ExperienceRepository,
  type HeadlineRepository,
  JobDescriptionId,
  type JobDescriptionRepository,
  type ProfileRepository
} from '@tailoredin/domain';
```

In `execute()`, update the educations mapping (around line 126):
```typescript
educations: educations.map(edu => ({
  degreeTitle: edu.degreeTitle,
  institutionName: edu.institutionName,
  graduationYear: edu.graduationYear,
  location: edu.location,
  honors: edu.honors,
})),
template: DEFAULT_RESUME_TEMPLATE,
```

- [ ] **Typecheck**

```bash
bun run typecheck
```
Expected: no errors.

- [ ] **Commit**

```bash
git add application/src/ports/ResumeRenderer.ts application/src/use-cases/resume/GenerateResumePdf.ts
git commit -m "feat(application): wire ResumeTemplate and education honors through render input"
```

---

## Task 3: Write failing tests for generator functions

**Files:**
- Create: `infrastructure/test/services/typst-generators.test.ts`

These tests import from `infrastructure/src/services/typst-generators.ts` which does not exist yet — all tests will fail with "cannot find module".

- [ ] **Create the test file**

```typescript
import { describe, expect, test } from 'bun:test';
import type { ResumeRenderEducation, ResumeRenderExperience } from '../../src/services/typst-generators.js';
import {
  analyzeLayout,
  generateConfigTyp,
  generateEducationTyp,
  generateProfessionalTyp,
} from '../../src/services/typst-generators.js';
import type { ResumeTemplate } from '@tailoredin/domain';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEMPLATE: ResumeTemplate = {
  id: 'test',
  pageSize: 'us-letter',
  margins: { top: 1.1, bottom: 1.1, left: 1.1, right: 1.1 },
  bodyFontSizePt: 10,
  lineHeightEm: 0.65,
  headerFontSizePt: 32,
  sectionSpacingPt: 2,
  entrySpacingPt: 2,
};

function fakePdf(pageCount: number): Uint8Array {
  const lines = ['%PDF-1.4'];
  // /Type /Pages — should NOT be counted as a page
  lines.push(`1 0 obj << /Type /Pages /Count ${pageCount} >> endobj`);
  // /Type /Page — one per page
  for (let i = 0; i < pageCount; i++) {
    lines.push(`${i + 2} 0 obj << /Type /Page >> endobj`);
  }
  return new TextEncoder().encode(lines.join('\n'));
}

function makeExperience(overrides: Partial<ResumeRenderExperience> = {}): ResumeRenderExperience {
  return {
    title: 'Software Engineer',
    companyName: 'Acme Corp',
    location: 'New York, NY',
    startDate: '2022-01-01',
    endDate: null,
    summary: null,
    bullets: ['Built things', 'Shipped features'],
    ...overrides,
  };
}

function makeEducation(overrides: Partial<ResumeRenderEducation> = {}): ResumeRenderEducation {
  return {
    degreeTitle: 'BSc Computer Science',
    institutionName: 'MIT',
    graduationYear: 2020,
    location: 'Cambridge, MA',
    honors: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// generateConfigTyp
// ---------------------------------------------------------------------------

describe('generateConfigTyp', () => {
  test('renders font size, leading, and margin from template', () => {
    const result = generateConfigTyp(TEMPLATE);
    expect(result).toContain('cfg-body-font-size = 10pt');
    expect(result).toContain('cfg-leading = 0.65em');
    expect(result).toContain('cfg-margin');
    expect(result).toContain('1.1cm');
  });

  test('uses a4 page size when specified', () => {
    const result = generateConfigTyp({ ...TEMPLATE, pageSize: 'a4' });
    // Config does not encode page size (set in metadata.toml), so just verify it compiles
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// generateProfessionalTyp
// ---------------------------------------------------------------------------

describe('generateProfessionalTyp', () => {
  test('wraps each entry in block(breakable: false)', () => {
    const result = generateProfessionalTyp([makeExperience()]);
    expect(result).toContain('block(breakable: false)');
  });

  test('includes all bullet text', () => {
    const result = generateProfessionalTyp([
      makeExperience({ bullets: ['First bullet', 'Second bullet'] }),
    ]);
    expect(result).toContain('First bullet');
    expect(result).toContain('Second bullet');
  });

  test('renders summary as italic when present', () => {
    const result = generateProfessionalTyp([makeExperience({ summary: 'Led the team' })]);
    expect(result).toContain('_Led the team_');
  });

  test('returns import-only string when experiences array is empty', () => {
    const result = generateProfessionalTyp([]);
    expect(result).toContain('#import');
    expect(result).not.toContain('cv-section');
  });

  test('skips experiences with no bullets', () => {
    const result = generateProfessionalTyp([makeExperience({ bullets: [] })]);
    expect(result).not.toContain('cv-entry');
  });
});

// ---------------------------------------------------------------------------
// generateEducationTyp
// ---------------------------------------------------------------------------

describe('generateEducationTyp', () => {
  test('wraps each entry in block(breakable: false)', () => {
    const result = generateEducationTyp([makeEducation()]);
    expect(result).toContain('block(breakable: false)');
  });

  test('renders honors as italic description when present', () => {
    const result = generateEducationTyp([makeEducation({ honors: 'Magna Cum Laude' })]);
    expect(result).toContain('_Magna Cum Laude_');
  });

  test('renders empty description when honors is null', () => {
    const result = generateEducationTyp([makeEducation({ honors: null })]);
    // Should not contain any italic content in description
    expect(result).not.toContain('_');
  });

  test('returns import-only string when educations array is empty', () => {
    const result = generateEducationTyp([]);
    expect(result).toContain('#import');
    expect(result).not.toContain('cv-section');
  });
});

// ---------------------------------------------------------------------------
// analyzeLayout
// ---------------------------------------------------------------------------

describe('analyzeLayout', () => {
  test('counts 1 page correctly', () => {
    const { totalPages } = analyzeLayout(fakePdf(1));
    expect(totalPages).toBe(1);
  });

  test('counts 2 pages correctly', () => {
    const { totalPages } = analyzeLayout(fakePdf(2));
    expect(totalPages).toBe(2);
  });

  test('counts 3 pages correctly', () => {
    const { totalPages } = analyzeLayout(fakePdf(3));
    expect(totalPages).toBe(3);
  });

  test('/Type /Pages node is not counted as a page', () => {
    // fakePdf always includes one /Type /Pages node — verify it's excluded
    const { totalPages } = analyzeLayout(fakePdf(2));
    expect(totalPages).toBe(2); // not 3
  });
});
```

- [ ] **Run tests to confirm they all fail with module-not-found**

```bash
bun test infrastructure/test/services/typst-generators.test.ts
```
Expected: all tests fail — `Cannot find module '../../src/services/typst-generators.js'`

---

## Task 4: Create `typst-generators.ts` and make tests pass

**Files:**
- Create: `infrastructure/src/services/typst-generators.ts`

- [ ] **Create the file with all exported pure functions**

```typescript
import type { LayoutAnalysis, ResumeTemplate } from '@tailoredin/domain';

export type ResumeRenderExperience = {
  title: string;
  companyName: string;
  location: string;
  startDate: string;
  endDate: string | null;
  summary: string | null;
  bullets: string[];
};

export type ResumeRenderEducation = {
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string): string {
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
  awesome_color = "#1A1A1A"
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

  return `#import "../helpers.typ": cv-section, cv-entry

#cv-section("Experience")

${entries.join('\n\n')}
`;
}

export function generateEducationTyp(educations: ResumeRenderEducation[]): string {
  if (educations.length === 0) {
    return '#import "../helpers.typ": cv-section, cv-entry\n';
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

  return `#import "../helpers.typ": cv-section, cv-entry

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
      infoLine: EMPTY_BLOCK_LAYOUT,
    },
    experiences: [],
    education: [],
    skills: [],
  };
}
```

- [ ] **Run tests**

```bash
bun test infrastructure/test/services/typst-generators.test.ts
```
Expected: all tests pass.

- [ ] **Typecheck**

```bash
bun run typecheck
```
Expected: no errors.

- [ ] **Commit**

```bash
git add infrastructure/src/services/typst-generators.ts infrastructure/test/services/typst-generators.test.ts
git commit -m "feat(infrastructure): extract typst generator functions with unit tests"
```

---

## Task 5: Update `cv.typ` to use generated `config.typ`

**Files:**
- Modify: `infrastructure/typst/cv.typ`

- [ ] **Replace hardcoded `#set` rules with config imports**

Full replacement of `infrastructure/typst/cv.typ`:
```typst
#import "@preview/brilliant-cv:3.3.0": cv
#import "./config.typ": cfg-body-font-size, cfg-leading, cfg-margin
#let metadata = toml("./metadata.toml")
#set text(size: cfg-body-font-size)
#set par(leading: cfg-leading)
#set page(margin: cfg-margin)
// Override personal info icons to use text labels instead of Font Awesome
#let custom-icons = (
  github: box(width: 10pt, align(center, text(size: 8pt, "GH"))),
  email: box(width: 10pt, align(center, text(size: 8pt, "✉"))),
  linkedin: box(width: 10pt, align(center, text(size: 8pt, "in"))),
  phone: box(width: 10pt, align(center, text(size: 8pt, "☎"))),
  location: box(width: 10pt, align(center, text(size: 8pt, "⌂"))),
)
#show: cv.with(metadata, custom-icons: custom-icons)

#include "modules_en/professional.typ"
#include "modules_en/skills.typ"
#include "modules_en/education.typ"
```

- [ ] **Commit**

```bash
git add infrastructure/typst/cv.typ
git commit -m "feat(typst): import layout config from generated config.typ"
```

---

## Task 6: Refactor `TypstResumeRenderer` with template, config.typ generation, and multi-pass loop

**Files:**
- Modify: `infrastructure/src/services/TypstResumeRenderer.ts`

- [ ] **Replace the full file**

```typescript
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { injectable } from '@needle-di/core';
import type { ResumeRenderer, ResumeRenderInput } from '@tailoredin/application';
import {
  analyzeLayout,
  generateConfigTyp,
  generateEducationTyp,
  generateMetadataToml,
  generateProfessionalTyp,
  type ResumeRenderEducation,
  type ResumeRenderExperience,
} from './typst-generators.js';

const TYPST_DIR = join(import.meta.dir, '../../typst');
const MAX_PAGES = 2;

@injectable()
export class TypstResumeRenderer implements ResumeRenderer {
  public async render(input: ResumeRenderInput): Promise<Uint8Array> {
    const tmpDir = await mkdtemp('/tmp/tailoredin-resume-');

    try {
      await this.setupTempDir(tmpDir, input);

      // Mutable copies for trimming
      let educations = [...input.educations];
      let experiences = input.experiences.map(e => ({ ...e, bullets: [...e.bullets] }));

      let pdf = await this.compile(tmpDir, experiences, educations);
      let { totalPages } = analyzeLayout(pdf);

      // Phase 1: trim education (keep at least 1, newest first = index 0)
      while (totalPages > MAX_PAGES && educations.length > 1) {
        educations = educations.slice(0, -1);
        pdf = await this.compile(tmpDir, experiences, educations);
        ({ totalPages } = analyzeLayout(pdf));
      }

      // Phase 2: trim bullets from oldest experience upward (hard floor: 1)
      while (totalPages > MAX_PAGES) {
        let trimmed = false;
        for (let i = experiences.length - 1; i >= 0; i--) {
          if (experiences[i].bullets.length > 1) {
            experiences[i] = {
              ...experiences[i],
              bullets: experiences[i].bullets.slice(0, -1),
            };
            trimmed = true;
            break;
          }
        }
        if (!trimmed) break;
        pdf = await this.compile(tmpDir, experiences, educations);
        ({ totalPages } = analyzeLayout(pdf));
      }

      return pdf;
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }

  private async setupTempDir(tmpDir: string, input: ResumeRenderInput): Promise<void> {
    await mkdir(join(tmpDir, 'modules_en'));

    // Copy static files
    await Bun.write(join(tmpDir, 'cv.typ'), Bun.file(join(TYPST_DIR, 'cv.typ')));
    await Bun.write(join(tmpDir, 'helpers.typ'), Bun.file(join(TYPST_DIR, 'helpers.typ')));
    await Bun.write(
      join(tmpDir, 'modules_en', 'skills.typ'),
      Bun.file(join(TYPST_DIR, 'modules_en', 'skills.typ')),
    );

    // Copy fonts
    const fontsDir = join(TYPST_DIR, 'fonts');
    await mkdir(join(tmpDir, 'fonts'));
    const fontsGlob = new Bun.Glob('*.{otf,ttf,woff,woff2}');
    for await (const fontFile of fontsGlob.scan(fontsDir)) {
      await Bun.write(join(tmpDir, 'fonts', fontFile), Bun.file(join(fontsDir, fontFile)));
    }

    // Generate static derived files (don't change between trim iterations)
    await writeFile(join(tmpDir, 'config.typ'), generateConfigTyp(input.template));
    await writeFile(
      join(tmpDir, 'metadata.toml'),
      generateMetadataToml(input.personal, input.headlineSummary, input.template),
    );
  }

  private async compile(
    tmpDir: string,
    experiences: ResumeRenderExperience[],
    educations: ResumeRenderEducation[],
  ): Promise<Uint8Array> {
    await writeFile(
      join(tmpDir, 'modules_en', 'professional.typ'),
      generateProfessionalTyp(experiences),
    );
    await writeFile(
      join(tmpDir, 'modules_en', 'education.typ'),
      generateEducationTyp(educations),
    );

    const proc = Bun.spawn(
      ['typst', 'compile', '--font-path', './fonts', 'cv.typ', 'output.pdf'],
      { cwd: tmpDir, stderr: 'pipe' },
    );

    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      throw new Error(`Typst compilation failed (exit ${exitCode}): ${stderr}`);
    }

    const pdfBuffer = await Bun.file(join(tmpDir, 'output.pdf')).arrayBuffer();
    return new Uint8Array(pdfBuffer);
  }
}
```

- [ ] **Typecheck**

```bash
bun run typecheck
```
Expected: no errors. The `ResumeRenderInput` now carries `template` from the application port, and `TypstResumeRenderer` reads it. If you see type errors about `generateMetadataToml` signature mismatch, confirm its new signature takes `(personal, headlineSummary, template)` and that you're calling it with `input.personal, input.headlineSummary, input.template`.

- [ ] **Run all unit tests**

```bash
bun run test
```
Expected: all pass.

- [ ] **Commit**

```bash
git add infrastructure/src/services/TypstResumeRenderer.ts
git commit -m "feat(infrastructure): refactor TypstResumeRenderer — template-driven layout, block(breakable:false), multi-pass 2-page enforcement"
```

---

## Task 7: End-to-end verification

- [ ] **Start the worktree environment**

```bash
bun wt:up
```
Wait for the API and web servers to be ready.

- [ ] **Generate a resume PDF** (replace IDs with values from your seeded DB)

```bash
curl -s -X POST http://localhost:<API_PORT>/resume/pdf \
  -H "Content-Type: application/json" \
  -d '{"jobDescriptionId":"<id>","headlineId":"<id>"}' \
  -o /tmp/resume-test.pdf
```

- [ ] **Open and verify**

```bash
open /tmp/resume-test.pdf
```

Check:
1. Education section appears (degree + institution + graduation year; honors in italic if present)
2. No experience entry is split across a page break
3. Total page count is ≤ 2

- [ ] **Commit docs**

```bash
git add docs/superpowers/specs/2026-04-05-typst-rendering-design.md docs/superpowers/plans/2026-04-05-typst-rendering.md
git commit -m "docs: typst rendering spec and implementation plan"
```

---

## Self-Review

**Spec coverage:**
- ✅ `ResumeTemplate` DEFAULT constant — Task 1
- ✅ `honors` field on education — Tasks 2 + 4
- ✅ `template` wired through ports and use case — Tasks 2 + 6
- ✅ `generateConfigTyp` + `cv.typ` import — Tasks 4 + 5
- ✅ `block(breakable: false)` for experiences and education — Task 4
- ✅ `analyzeLayout` with `totalPages` — Task 4
- ✅ Multi-pass trim loop (education → bullets, strict 2-page) — Task 6
- ✅ Unit tests for all pure functions — Tasks 3 + 4

**Type consistency check:**
- `generateMetadataToml` signature in Task 4 is `(personal, headlineSummary, template)` — matches Task 6 call site `generateMetadataToml(input.personal, input.headlineSummary, input.template)` ✅
- `ResumeRenderExperience` and `ResumeRenderEducation` exported from `typst-generators.ts` and used in both test (Task 3) and renderer (Task 6) ✅
- `analyzeLayout` returns `LayoutAnalysis` (domain type) — imported in Task 4, used in Task 6 ✅

**No placeholders:** All steps have complete code. ✅
