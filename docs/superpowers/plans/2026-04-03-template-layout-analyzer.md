# Template Layout Analyzer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a read-only constraint oracle (`TemplateLayoutAnalyzer`) that takes a `ResumeTemplate` and a `ResumeContentDto` and returns a per-block layout analysis (line counts, page numbers) by running a labelled Typst compile + query.

**Architecture:** `ResumeTemplate` is a plain typed object in the domain layer; `BrilliantCvTemplate` is the concrete infrastructure instance. `TypstFileGenerator` gains an analysis mode that injects `#mark()` position markers into the generated `.typ` files. `TypstTemplateLayoutAnalyzer` orchestrates file generation, a single `typst query` invocation, and result parsing, with an in-memory LRU cache. The existing render path is unchanged.

**Tech Stack:** Bun, TypeScript (NodeNext), `typst` CLI (`compile` + `query`), `bun:test`, existing Onion Architecture (domain → application → infrastructure → api).

---

## File Map

| File | Status | Responsibility |
|------|--------|---------------|
| `domain/src/value-objects/ResumeTemplate.ts` | Create | `ResumeTemplate` type |
| `domain/src/value-objects/LayoutAnalysis.ts` | Create | `BlockLayout` + `LayoutAnalysis` types |
| `domain/src/index.ts` | Modify | Barrel-export both new types |
| `application/src/ports/TemplateLayoutAnalyzer.ts` | Create | Port interface |
| `application/src/ports/index.ts` | Modify | Barrel-export new port |
| `infrastructure/src/templates/BrilliantCvTemplate.ts` | Create | Concrete `ResumeTemplate` constant |
| `infrastructure/src/templates/TemplateRegistry.ts` | Create | `Map<id, ResumeTemplate>` |
| `infrastructure/src/resume/TypstFileGenerator.ts` | Modify | Accept `ResumeTemplate`; add `generateForAnalysis()` |
| `infrastructure/src/services/TypstResumeRenderer.ts` | Modify | Accept `template` from `RenderResumeInput` |
| `application/src/ports/ResumeRenderer.ts` | Modify | Add `template: ResumeTemplate` to `RenderResumeInput` |
| `infrastructure/src/services/LayoutAnalysisParser.ts` | Create | Pure fn: `typst query` JSON → `LayoutAnalysis` |
| `infrastructure/src/services/TypstTemplateLayoutAnalyzer.ts` | Create | Port implementation + LRU cache |
| `infrastructure/src/DI.ts` | Modify | Add `DI.Resume.LayoutAnalyzer` token |
| `infrastructure/src/index.ts` | Modify | Export `TypstTemplateLayoutAnalyzer`, `BrilliantCvTemplate`, `TemplateRegistry` |
| `api/src/container.ts` | Modify | Bind `TypstTemplateLayoutAnalyzer` |
| `infrastructure/test/resume/TypstFileGenerator.test.ts` | Modify | Pass `BrilliantCvTemplate` to updated signature |
| `infrastructure/test/services/LayoutAnalysisParser.test.ts` | Create | Unit tests for parser |
| `infrastructure/test-integration/layout-analyzer.test.ts` | Create | Integration tests (real Typst binary) |

---

## Task 1: Domain value objects — `ResumeTemplate` and `LayoutAnalysis`

**Files:**
- Create: `domain/src/value-objects/ResumeTemplate.ts`
- Create: `domain/src/value-objects/LayoutAnalysis.ts`
- Modify: `domain/src/index.ts`

- [ ] **Step 1.1: Write `ResumeTemplate`**

```typescript
// domain/src/value-objects/ResumeTemplate.ts

export type ResumeTemplate = {
  /** Unique identifier used as cache key and registry key. */
  id: string;
  pageSize: 'us-letter' | 'a4';
  margins: { top: number; bottom: number; left: number; right: number }; // cm
  bodyFontSizePt: number;
  lineHeightEm: number;
  headerFontSizePt: number;
  /** Space before each section title, in pt. */
  sectionSpacingPt: number;
  /** Space before each cv-entry block, in pt. */
  entrySpacingPt: number;
};
```

- [ ] **Step 1.2: Write `LayoutAnalysis`**

```typescript
// domain/src/value-objects/LayoutAnalysis.ts

export type BlockLayout = {
  lineCount: number;
  pageNumbers: number[];
};

export type LayoutAnalysis = {
  totalPages: number;
  /**
   * Header section. lineCount for name is approximated from font sizes since the
   * header is rendered by the brilliant-cv package and cannot be instrumented directly.
   * headline and infoLine are also approximated.
   */
  header: {
    name: BlockLayout;
    headline: BlockLayout;
    infoLine: BlockLayout;
  };
  /**
   * Indexed 1:1 with ResumeContentDto.experience[].
   * company covers the full cv-entry block for that experience group.
   * roles[].title covers the role title + summary line.
   * roles[].bullets[i] covers bullet i.
   */
  experiences: Array<{
    company: BlockLayout;
    roles: Array<{
      title: BlockLayout;
      bullets: BlockLayout[];
    }>;
  }>;
  /** Indexed 1:1 with ResumeContentDto.education[]. */
  education: BlockLayout[];
  /** Indexed 1:1 with non-"interests" entries in ResumeContentDto.skills[]. */
  skills: BlockLayout[];
};
```

- [ ] **Step 1.3: Export from domain barrel (`domain/src/index.ts`)**

Add at the end of the value-objects block in `domain/src/index.ts`:

```typescript
export type { LayoutAnalysis, BlockLayout } from './value-objects/LayoutAnalysis.js';
export type { ResumeTemplate } from './value-objects/ResumeTemplate.js';
```

- [ ] **Step 1.4: Typecheck**

```bash
bun run --cwd domain typecheck
```

Expected: no errors.

- [ ] **Step 1.5: Commit**

```bash
git add domain/src/value-objects/ResumeTemplate.ts domain/src/value-objects/LayoutAnalysis.ts domain/src/index.ts
git commit -m "feat(domain): add ResumeTemplate and LayoutAnalysis value object types"
```

---

## Task 2: Application port — `TemplateLayoutAnalyzer`

**Files:**
- Create: `application/src/ports/TemplateLayoutAnalyzer.ts`
- Modify: `application/src/ports/index.ts`

- [ ] **Step 2.1: Write the port**

```typescript
// application/src/ports/TemplateLayoutAnalyzer.ts
import type { LayoutAnalysis, ResumeTemplate } from '@tailoredin/domain';
import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export interface TemplateLayoutAnalyzer {
  /**
   * Returns a per-block layout analysis for the given template and content.
   * Results are cached in-memory by (template.id + contentHash).
   */
  analyze(template: ResumeTemplate, content: ResumeContentDto): Promise<LayoutAnalysis>;
}
```

- [ ] **Step 2.2: Export from ports barrel (`application/src/ports/index.ts`)**

Add:

```typescript
export type { TemplateLayoutAnalyzer } from './TemplateLayoutAnalyzer.js';
```

- [ ] **Step 2.3: Typecheck**

```bash
bun run --cwd application typecheck
```

Expected: no errors.

- [ ] **Step 2.4: Commit**

```bash
git add application/src/ports/TemplateLayoutAnalyzer.ts application/src/ports/index.ts
git commit -m "feat(application): add TemplateLayoutAnalyzer port"
```

---

## Task 3: `BrilliantCvTemplate` constant and `TemplateRegistry`

**Files:**
- Create: `infrastructure/src/templates/BrilliantCvTemplate.ts`
- Create: `infrastructure/src/templates/TemplateRegistry.ts`

These extract the layout constants currently hardcoded in `TypstFileGenerator.ts` (`RESUME_LAYOUT` and `RESUME_ACCENT_COLOR`) into the first concrete `ResumeTemplate`.

- [ ] **Step 3.1: Write `BrilliantCvTemplate`**

```typescript
// infrastructure/src/templates/BrilliantCvTemplate.ts
import type { ResumeTemplate } from '@tailoredin/domain';

/**
 * brilliant-cv v3.3.0 layout constants.
 * These mirror the values currently hardcoded in TypstFileGenerator's RESUME_LAYOUT.
 * TypstFileGenerator will consume this object in Task 4 instead of RESUME_LAYOUT.
 */
export const BrilliantCvTemplate: ResumeTemplate = {
  id: 'brilliant-cv',
  pageSize: 'us-letter',
  margins: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 }, // cm
  bodyFontSizePt: 10.5,
  lineHeightEm: 0.75,
  headerFontSizePt: 30,
  sectionSpacingPt: 4,
  entrySpacingPt: 3,
};
```

- [ ] **Step 3.2: Write `TemplateRegistry`**

```typescript
// infrastructure/src/templates/TemplateRegistry.ts
import type { ResumeTemplate } from '@tailoredin/domain';
import { BrilliantCvTemplate } from './BrilliantCvTemplate.js';

const registry = new Map<string, ResumeTemplate>([[BrilliantCvTemplate.id, BrilliantCvTemplate]]);

export const TemplateRegistry = {
  get(id: string): ResumeTemplate {
    const template = registry.get(id);
    if (!template) throw new Error(`Unknown template id: ${id}`);
    return template;
  },
  getAll(): ResumeTemplate[] {
    return [...registry.values()];
  },
};
```

- [ ] **Step 3.3: Typecheck**

```bash
bun run --cwd infrastructure typecheck
```

Expected: no errors.

- [ ] **Step 3.4: Commit**

```bash
git add infrastructure/src/templates/BrilliantCvTemplate.ts infrastructure/src/templates/TemplateRegistry.ts
git commit -m "feat(infrastructure): add BrilliantCvTemplate constant and TemplateRegistry"
```

---

## Task 4: Refactor `TypstFileGenerator` to consume `ResumeTemplate`

Replace the hardcoded `RESUME_LAYOUT` constant in `TypstFileGenerator.ts` with values from a passed-in `ResumeTemplate`. The public static `generate()` signature gains a `template` parameter. No functional change to render output.

**Files:**
- Modify: `infrastructure/src/resume/TypstFileGenerator.ts`
- Modify: `infrastructure/test/resume/TypstFileGenerator.test.ts`

- [ ] **Step 4.1: Update `TypstFileGenerator` — add `template` parameter**

Replace the top of `TypstFileGenerator.ts`. Remove the `RESUME_LAYOUT` constant and thread `template` through the private methods:

```typescript
// infrastructure/src/resume/TypstFileGenerator.ts
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
      FS.writeFile(Path.join(workDir, 'metadata.toml'), TypstFileGenerator.buildMetadataToml(content, template), 'utf8'),
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

  // buildProfessionalTyp, buildSkillsTyp, buildEducationTyp are unchanged —
  // they do not reference RESUME_LAYOUT directly (only SHOW_ENTRY_SUMMARY which is now a module constant).
  // Replace `RESUME_LAYOUT.showEntrySummary` with `SHOW_ENTRY_SUMMARY` in buildProfessionalTyp.

  private static buildProfessionalTyp(content: BrilliantCVContent): string {
    const lines: string[] = [`#import "../helpers.typ": cv-section, cv-entry`, ``, `#cv-section("Experience")`, ``];

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
}
```

- [ ] **Step 4.2: Update `TypstResumeRenderer` to pass `BrilliantCvTemplate`**

This is a temporary step — in Task 5 the renderer will read `template` from its input. For now, import and pass the constant:

```typescript
// infrastructure/src/services/TypstResumeRenderer.ts
import { spawn } from 'node:child_process';
import FS from 'node:fs/promises';
import Path from 'node:path';
import { injectable } from '@needle-di/core';
import type { RenderResumeInput, ResumeRenderer } from '@tailoredin/application';
import { format } from 'date-fns';
import { snakeCase } from 'lodash';
import { BrilliantCvTemplate } from '../templates/BrilliantCvTemplate.js';
import { TYPST_DIR } from '../resume/TYPST_DIR.js';
import { TypstFileGenerator } from '../resume/TypstFileGenerator.js';

const RESUMES_DIR = Path.resolve(import.meta.dirname, '..', '..', 'resumes');

function typstCompile(cwd: string, pdfPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('typst', ['compile', '--font-path', './fonts', 'cv.typ', pdfPath], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const chunks: Buffer[] = [];
    proc.stderr.on('data', (chunk: Buffer) => chunks.push(chunk));
    proc.on('close', code => {
      if (code !== 0) {
        reject(new Error(`Typst compilation failed: ${Buffer.concat(chunks).toString()}`));
      } else {
        resolve();
      }
    });
    proc.on('error', reject);
  });
}

@injectable()
export class TypstResumeRenderer implements ResumeRenderer {
  public async render(input: RenderResumeInput): Promise<string> {
    const { content, companyName } = input;
    const outputDir = Path.resolve(RESUMES_DIR, snakeCase(companyName.toLowerCase()));
    const date = format(new Date(), 'yyyy_MM_dd');
    const pdfPath = Path.resolve(outputDir, `Sylvain_Estevez_${date}.pdf`);

    await FS.mkdir(outputDir, { recursive: true });
    await TypstFileGenerator.generate(content, TYPST_DIR, BrilliantCvTemplate);
    await typstCompile(TYPST_DIR, pdfPath);

    return pdfPath;
  }
}
```

- [ ] **Step 4.3: Update existing `TypstFileGenerator` tests**

In `infrastructure/test/resume/TypstFileGenerator.test.ts`, every call to `TypstFileGenerator.generate(content, tmpDir)` must become `TypstFileGenerator.generate(content, tmpDir, BrilliantCvTemplate)`. Add the import:

```typescript
import { BrilliantCvTemplate } from '../../src/templates/BrilliantCvTemplate.js';
```

Then update the `generateInTmpDir` helper:

```typescript
async function generateInTmpDir(content: BrilliantCVContent) {
  const tmpDir = await FS.mkdtemp(Path.join(OS.tmpdir(), 'typst-gen-'));
  await TypstFileGenerator.generate(content, tmpDir, BrilliantCvTemplate);
  return {
    metadata: await FS.readFile(Path.join(tmpDir, 'metadata.toml'), 'utf8'),
    cv: await FS.readFile(Path.join(tmpDir, 'cv.typ'), 'utf8'),
    helpers: await FS.readFile(Path.join(tmpDir, 'helpers.typ'), 'utf8'),
    professional: await FS.readFile(Path.join(tmpDir, 'modules_en', 'professional.typ'), 'utf8'),
    skills: await FS.readFile(Path.join(tmpDir, 'modules_en', 'skills.typ'), 'utf8'),
    education: await FS.readFile(Path.join(tmpDir, 'modules_en', 'education.typ'), 'utf8'),
  };
}
```

- [ ] **Step 4.4: Run existing tests**

```bash
bun test infrastructure/test/resume/TypstFileGenerator.test.ts
```

Expected: all tests pass (same output as before — only constant source changed, values are identical).

- [ ] **Step 4.5: Typecheck**

```bash
bun run --cwd infrastructure typecheck
```

Expected: no errors.

- [ ] **Step 4.6: Commit**

```bash
git add infrastructure/src/resume/TypstFileGenerator.ts \
        infrastructure/src/services/TypstResumeRenderer.ts \
        infrastructure/test/resume/TypstFileGenerator.test.ts
git commit -m "refactor(infrastructure): TypstFileGenerator consumes ResumeTemplate instead of hardcoded constants"
```

---

## Task 5: Update `RenderResumeInput` to carry `template`

**Files:**
- Modify: `application/src/ports/ResumeRenderer.ts`
- Modify: `infrastructure/src/services/TypstResumeRenderer.ts`

- [ ] **Step 5.1: Add `template` to `RenderResumeInput`**

```typescript
// application/src/ports/ResumeRenderer.ts
import type { ResumeTemplate } from '@tailoredin/domain';
import type { ResumeContentDto } from '../dtos/ResumeContentDto.js';

export type RenderResumeInput = {
  content: ResumeContentDto;
  companyName: string;
  template: ResumeTemplate;
};

export interface ResumeRenderer {
  render(input: RenderResumeInput): Promise<string>;
}
```

- [ ] **Step 5.2: Update `TypstResumeRenderer` to read `template` from input**

```typescript
// infrastructure/src/services/TypstResumeRenderer.ts
// Remove the BrilliantCvTemplate import from Task 4.
// Change the render method:

@injectable()
export class TypstResumeRenderer implements ResumeRenderer {
  public async render(input: RenderResumeInput): Promise<string> {
    const { content, companyName, template } = input;
    const outputDir = Path.resolve(RESUMES_DIR, snakeCase(companyName.toLowerCase()));
    const date = format(new Date(), 'yyyy_MM_dd');
    const pdfPath = Path.resolve(outputDir, `Sylvain_Estevez_${date}.pdf`);

    await FS.mkdir(outputDir, { recursive: true });
    await TypstFileGenerator.generate(content, TYPST_DIR, template);
    await typstCompile(TYPST_DIR, pdfPath);

    return pdfPath;
  }
}
```

- [ ] **Step 5.3: Update the three affected use cases**

The application layer cannot import from `@tailoredin/infrastructure`. Each use case that calls `renderer.render()` gets a `private readonly template: ResumeTemplate` constructor parameter injected from `container.ts`.

The three use cases that call `renderer.render()` are:
- `application/src/use-cases/GenerateResume.ts`
- `application/src/use-cases/resume-profile/GenerateResumeProfilePdf.ts`
- `application/src/use-cases/tailored-resume/GenerateTailoredResumePdf.ts`

For **each**, add the import and constructor parameter:

```typescript
import type { ResumeTemplate } from '@tailoredin/domain';
```

Add as the last constructor parameter:

```typescript
private readonly template: ResumeTemplate,
```

Change every `this.renderer.render({ content, companyName })` call to:

```typescript
this.renderer.render({ content, companyName, template: this.template });
```

- [ ] **Step 5.4: Update `container.ts` to pass `BrilliantCvTemplate` to affected use cases**

```typescript
// api/src/container.ts — add import
import { BrilliantCvTemplate, /* ... existing imports */ } from '@tailoredin/infrastructure';

// Update each affected use case binding — example:
container.bind({
  provide: DI.Resume.GenerateResume,
  useFactory: () =>
    new GenerateResume(
      container.get(DI.Profile.Repository),
      container.get(DI.Resume.ContentFactory),
      container.get(DI.Resume.Renderer),
      BrilliantCvTemplate,  // ADD THIS
    )
});
// Repeat for GenerateResumeProfilePdf, GenerateTailoredResumePdf, etc.
```

- [ ] **Step 5.5: Typecheck all packages**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 5.6: Commit**

```bash
git add application/src/ports/ResumeRenderer.ts \
        infrastructure/src/services/TypstResumeRenderer.ts \
        application/src/use-cases/ \
        api/src/container.ts
git commit -m "feat: thread ResumeTemplate through RenderResumeInput and affected use cases"
```

---

## Task 6: Add analysis mode to `TypstFileGenerator`

Analysis mode generates the same `.typ` files as render mode, but injects `#mark()` calls at block boundaries. All positions are accumulated into a single Typst state variable and queried in one `typst query` call.

**File:**
- Modify: `infrastructure/src/resume/TypstFileGenerator.ts`

The key Typst technique (added to `helpers.typ` in analysis mode):

```typst
// Shared state for all position markers
#let layout-positions = state("layout-positions", (:))

// Called at each block boundary
#let mark(id) = context {
  let pos = here().position()
  layout-positions.update(prev => {
    let next = prev
    next.insert(id, (page: here().page(), y: pos.y.pt()))
    next
  })
}
```

At the end of `cv.typ` (analysis mode), a single metadata element captures the final state:

```typst
#context metadata(layout-positions.final()) <all-layout-positions>
```

- [ ] **Step 6.1: Add `generateForAnalysis()` static method**

Add this method to `TypstFileGenerator` below the existing `generate()` method:

```typescript
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
```

- [ ] **Step 6.2: Add `buildAnalysisHelpersTyp()`**

```typescript
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
```

- [ ] **Step 6.3: Add `buildAnalysisCvTyp()`**

```typescript
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
```

- [ ] **Step 6.4: Add `buildAnalysisProfessionalTyp()`**

This version replaces `#list(...)` with individual `- bullet` lines wrapped in `#mark()` calls so we can measure each bullet independently. The visual output is equivalent.

```typescript
private static buildAnalysisProfessionalTyp(content: BrilliantCVContent): string {
  const lines: string[] = [
    `#import "../helpers.typ": cv-section, cv-entry, mark`,
    ``,
    `#cv-section("Experience")`,
    ``
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
```

- [ ] **Step 6.5: Add `buildAnalysisSkillsTyp()`**

```typescript
private static buildAnalysisSkillsTyp(content: BrilliantCVContent): string {
  const relevant = content.skills.filter(s => s.type !== 'interests');
  if (relevant.length === 0) return '';

  const lines: string[] = [
    `#import "../helpers.typ": cv-section, h-bar, mark`,
    ``,
    `#cv-section("Areas of Expertise")`,
    ``
  ];

  for (let si = 0; si < relevant.length; si++) {
    lines.push(`#mark("skill-${si}-start")`);
    lines.push(`#par[${escapeTypst(relevant[si].info)}]`);
    lines.push(`#mark("skill-${si}-end")`);
  }

  return lines.join('\n');
}
```

- [ ] **Step 6.6: Add `buildAnalysisEducationTyp()`**

```typescript
private static buildAnalysisEducationTyp(content: BrilliantCVContent): string {
  if (content.education.length === 0) return '';

  const lines: string[] = [
    `#import "../helpers.typ": cv-section, mark`,
    ``,
    `#cv-section("Education")`,
    ``
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
```

- [ ] **Step 6.7: Verify generated analysis files look correct**

Write a quick test that generates analysis files and inspects their content:

```bash
bun test infrastructure/test/resume/TypstFileGenerator.test.ts
```

Then add a new test in `infrastructure/test/resume/TypstFileGenerator.test.ts`:

```typescript
describe('generateForAnalysis', () => {
  it('injects mark() calls around experience bullets', async () => {
    const tmpDir = await FS.mkdtemp(Path.join(OS.tmpdir(), 'typst-analysis-'));
    await TypstFileGenerator.generateForAnalysis(MINIMAL_CONTENT, tmpDir, BrilliantCvTemplate);
    const professional = await FS.readFile(Path.join(tmpDir, 'modules_en', 'professional.typ'), 'utf8');

    expect(professional).toContain('#mark("exp-0-company-start")');
    expect(professional).toContain('#mark("exp-0-company-end")');
    expect(professional).toContain('#mark("exp-0-role-0-bullet-0-start")');
    expect(professional).toContain('#mark("exp-0-role-0-bullet-5-end")'); // MINIMAL_CONTENT has 6 bullets
  });

  it('includes the state capture element in cv.typ', async () => {
    const tmpDir = await FS.mkdtemp(Path.join(OS.tmpdir(), 'typst-analysis-'));
    await TypstFileGenerator.generateForAnalysis(MINIMAL_CONTENT, tmpDir, BrilliantCvTemplate);
    const cv = await FS.readFile(Path.join(tmpDir, 'cv.typ'), 'utf8');

    expect(cv).toContain('<all-layout-positions>');
    expect(cv).toContain('layout-positions.final()');
  });

  it('includes mark() in helpers.typ', async () => {
    const tmpDir = await FS.mkdtemp(Path.join(OS.tmpdir(), 'typst-analysis-'));
    await TypstFileGenerator.generateForAnalysis(MINIMAL_CONTENT, tmpDir, BrilliantCvTemplate);
    const helpers = await FS.readFile(Path.join(tmpDir, 'helpers.typ'), 'utf8');

    expect(helpers).toContain('#let mark(id)');
    expect(helpers).toContain('layout-positions');
  });
});
```

Run:

```bash
bun test infrastructure/test/resume/TypstFileGenerator.test.ts
```

Expected: all tests pass.

- [ ] **Step 6.8: Commit**

```bash
git add infrastructure/src/resume/TypstFileGenerator.ts \
        infrastructure/test/resume/TypstFileGenerator.test.ts
git commit -m "feat(infrastructure): add TypstFileGenerator analysis mode with position markers"
```

---

## Task 7: `LayoutAnalysisParser` — pure parser for `typst query` output

**Files:**
- Create: `infrastructure/src/services/LayoutAnalysisParser.ts`
- Create: `infrastructure/test/services/LayoutAnalysisParser.test.ts`

The `typst query cv.typ "<all-layout-positions>" --field value` command outputs JSON like:

```json
[
  {
    "exp-0-company-start": { "page": 1, "y": 72.0 },
    "exp-0-company-end": { "page": 1, "y": 210.5 },
    "exp-0-role-0-title-start": { "page": 1, "y": 72.0 },
    "exp-0-role-0-title-end": { "page": 1, "y": 89.25 },
    "exp-0-role-0-bullet-0-start": { "page": 1, "y": 95.25 },
    "exp-0-role-0-bullet-0-end": { "page": 1, "y": 103.125 },
    "edu-0-start": { "page": 1, "y": 240.0 },
    "edu-0-end": { "page": 1, "y": 247.875 },
    "skill-0-start": { "page": 1, "y": 220.0 },
    "skill-0-end": { "page": 1, "y": 227.875 }
  }
]
```

> **Note:** The exact JSON shape from `typst query --field value` on a Typst dictionary must be verified in the integration test (Task 10 Step 10.1). The parser assumes the structure above. Adjust if the actual output differs.

- [ ] **Step 7.1: Write `LayoutAnalysisParser`**

```typescript
// infrastructure/src/services/LayoutAnalysisParser.ts
import type { BlockLayout, LayoutAnalysis, ResumeTemplate } from '@tailoredin/domain';
import type { ResumeContentDto } from '@tailoredin/application';

type RawPosition = { page: number; y: number };
type RawPositions = Record<string, RawPosition>;

/**
 * Converts the JSON output of:
 *   typst query cv.typ "<all-layout-positions>" --field value
 * into a structured LayoutAnalysis.
 *
 * @param queryOutput - Raw string output from the typst query command
 * @param content - The content that was compiled (used to know array sizes)
 * @param template - Used to compute lineCount from raw y-coordinates
 */
export function parseLayoutAnalysis(
  queryOutput: string,
  content: ResumeContentDto,
  template: ResumeTemplate,
): LayoutAnalysis {
  const parsed = JSON.parse(queryOutput) as [RawPositions];
  const positions = parsed[0];

  const lineHeightPt = template.bodyFontSizePt * template.lineHeightEm;

  function blockLayout(startKey: string, endKey: string): BlockLayout {
    const start = positions[startKey];
    const end = positions[endKey];

    if (!start || !end) {
      return { lineCount: 0, pageNumbers: [] };
    }

    const pageNumbers = Array.from(
      new Set(
        [start.page, end.page].concat(
          // include all pages between start and end
          Array.from({ length: end.page - start.page + 1 }, (_, i) => start.page + i),
        )
      )
    ).sort((a, b) => a - b);

    const heightPt = end.page === start.page ? end.y - start.y : (end.y + (end.page - start.page) * 792); // approx
    const lineCount = Math.max(1, Math.ceil(heightPt / lineHeightPt));

    return { lineCount, pageNumbers };
  }

  // Header: approximated from font sizes since brilliant-cv's header is not instrumented.
  const headerLineHeightPt = template.bodyFontSizePt * template.lineHeightEm;
  const nameLinesApprox = Math.ceil(template.headerFontSizePt / headerLineHeightPt);
  const allPages = [...new Set(Object.values(positions).map(p => p.page))].sort((a, b) => a - b);

  // Re-derive groups to know how many roles per group
  const groups: Array<{ expIndices: number[] }> = [];
  for (let i = 0; i < content.experience.length; i++) {
    const exp = content.experience[i];
    const last = groups[groups.length - 1];
    if (last && content.experience[last.expIndices[0]].society === exp.society) {
      last.expIndices.push(i);
    } else {
      groups.push({ expIndices: [i] });
    }
  }

  const parsedExperiences = groups.map((group, gi) => {
    const company = blockLayout(`exp-${gi}-company-start`, `exp-${gi}-company-end`);
    const roles = group.expIndices.map((expIdx, ri) => {
      const exp = content.experience[expIdx];
      const title = blockLayout(`exp-${gi}-role-${ri}-title-start`, `exp-${gi}-role-${ri}-title-end`);
      const bullets = exp.highlights.map((_, bi) =>
        blockLayout(`exp-${gi}-role-${ri}-bullet-${bi}-start`, `exp-${gi}-role-${ri}-bullet-${bi}-end`)
      );
      return { title, bullets };
    });
    return { company, roles };
  });

  const relevantSkills = content.skills.filter(s => s.type !== 'interests');
  const parsedSkills = relevantSkills.map((_, si) =>
    blockLayout(`skill-${si}-start`, `skill-${si}-end`)
  );

  const parsedEducation = content.education.map((_, ei) =>
    blockLayout(`edu-${ei}-start`, `edu-${ei}-end`)
  );

  return {
    totalPages: allPages.length > 0 ? Math.max(...allPages) : 1,
    header: {
      name: { lineCount: nameLinesApprox, pageNumbers: [1] },
      headline: { lineCount: 1, pageNumbers: [1] },
      infoLine: { lineCount: 1, pageNumbers: [1] },
    },
    experiences: parsedExperiences,
    education: parsedEducation,
    skills: parsedSkills,
  };
}
```

- [ ] **Step 7.2: Write unit tests**

```typescript
// infrastructure/test/services/LayoutAnalysisParser.test.ts
import { describe, expect, it } from 'bun:test';
import type { ResumeContentDto } from '@tailoredin/application';
import { BrilliantCvTemplate } from '../../src/templates/BrilliantCvTemplate.js';
import { parseLayoutAnalysis } from '../../src/services/LayoutAnalysisParser.js';

const SIMPLE_CONTENT: ResumeContentDto = {
  personal: {
    first_name: 'Jane', last_name: 'Doe',
    github: 'janedoe', linkedin: 'janedoe',
    email: 'jane@example.com', phone: '555-0100',
    location: 'New York, NY', header_quote: 'Engineer'
  },
  keywords: [],
  experience: [
    {
      title: 'Senior Engineer', society: 'Acme Corp',
      date: 'Jan 2020 – Dec 2021', location: 'Remote',
      summary: 'Led platform team',
      highlights: ['Built API gateway', 'Reduced latency 40%']
    }
  ],
  skills: [{ type: 'Languages', info: 'TypeScript' }],
  education: [{ title: 'BS CS', society: 'MIT', date: '2016', location: 'Cambridge, MA' }],
};

const FAKE_POSITIONS = JSON.stringify([{
  'exp-0-company-start': { page: 1, y: 100.0 },
  'exp-0-company-end': { page: 1, y: 200.0 },
  'exp-0-role-0-title-start': { page: 1, y: 100.0 },
  'exp-0-role-0-title-end': { page: 1, y: 115.875 },   // ~2 body lines
  'exp-0-role-0-bullet-0-start': { page: 1, y: 120.0 },
  'exp-0-role-0-bullet-0-end': { page: 1, y: 127.875 }, // 1 body line (7.875pt = 10.5 * 0.75)
  'exp-0-role-0-bullet-1-start': { page: 1, y: 130.0 },
  'exp-0-role-0-bullet-1-end': { page: 1, y: 137.875 }, // 1 body line
  'skill-0-start': { page: 1, y: 210.0 },
  'skill-0-end': { page: 1, y: 217.875 },
  'edu-0-start': { page: 1, y: 230.0 },
  'edu-0-end': { page: 1, y: 237.875 },
}]);

describe('parseLayoutAnalysis', () => {
  it('returns totalPages from max page in positions', () => {
    const result = parseLayoutAnalysis(FAKE_POSITIONS, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.totalPages).toBe(1);
  });

  it('computes experience company block layout', () => {
    const result = parseLayoutAnalysis(FAKE_POSITIONS, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.experiences).toHaveLength(1);
    expect(result.experiences[0].company.pageNumbers).toEqual([1]);
    expect(result.experiences[0].company.lineCount).toBeGreaterThan(0);
  });

  it('computes lineCount=1 for a single-line bullet (7.875pt = 10.5 * 0.75)', () => {
    const result = parseLayoutAnalysis(FAKE_POSITIONS, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.experiences[0].roles[0].bullets[0].lineCount).toBe(1);
  });

  it('maps bullets indexed 1:1 with highlights array', () => {
    const result = parseLayoutAnalysis(FAKE_POSITIONS, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.experiences[0].roles[0].bullets).toHaveLength(2);
  });

  it('maps skills indexed to non-interests entries', () => {
    const result = parseLayoutAnalysis(FAKE_POSITIONS, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].lineCount).toBe(1);
  });

  it('maps education indexed 1:1 with content.education', () => {
    const result = parseLayoutAnalysis(FAKE_POSITIONS, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.education).toHaveLength(1);
  });

  it('returns empty blockLayout for missing marker keys', () => {
    const emptyPositions = JSON.stringify([{}]);
    const result = parseLayoutAnalysis(emptyPositions, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.experiences[0].company.lineCount).toBe(0);
    expect(result.experiences[0].company.pageNumbers).toEqual([]);
  });

  it('reports totalPages=2 when markers span two pages', () => {
    const multiPage = JSON.stringify([{
      'exp-0-company-start': { page: 1, y: 700.0 },
      'exp-0-company-end': { page: 2, y: 50.0 },
      'exp-0-role-0-title-start': { page: 1, y: 700.0 },
      'exp-0-role-0-title-end': { page: 1, y: 715.0 },
      'exp-0-role-0-bullet-0-start': { page: 2, y: 10.0 },
      'exp-0-role-0-bullet-0-end': { page: 2, y: 18.0 },
      'exp-0-role-0-bullet-1-start': { page: 2, y: 20.0 },
      'exp-0-role-0-bullet-1-end': { page: 2, y: 28.0 },
    }]);
    const result = parseLayoutAnalysis(multiPage, SIMPLE_CONTENT, BrilliantCvTemplate);
    expect(result.totalPages).toBe(2);
  });
});
```

- [ ] **Step 7.3: Run unit tests**

```bash
bun test infrastructure/test/services/LayoutAnalysisParser.test.ts
```

Expected: all tests pass.

- [ ] **Step 7.4: Commit**

```bash
git add infrastructure/src/services/LayoutAnalysisParser.ts \
        infrastructure/test/services/LayoutAnalysisParser.test.ts
git commit -m "feat(infrastructure): add LayoutAnalysisParser for typst query JSON parsing"
```

---

## Task 8: `TypstTemplateLayoutAnalyzer` — orchestrator with LRU cache

**File:**
- Create: `infrastructure/src/services/TypstTemplateLayoutAnalyzer.ts`

The analyzer:
1. Hashes `(template.id, JSON.stringify(content))` as a cache key
2. Returns the cached result if present
3. Otherwise: generates analysis files in a temp dir, runs `typst query`, parses, caches, and returns

- [ ] **Step 8.1: Write `TypstTemplateLayoutAnalyzer`**

```typescript
// infrastructure/src/services/TypstTemplateLayoutAnalyzer.ts
import { spawn } from 'node:child_process';
import FS from 'node:fs/promises';
import OS from 'node:os';
import Path from 'node:path';
import { injectable } from '@needle-di/core';
import type { TemplateLayoutAnalyzer } from '@tailoredin/application';
import type { ResumeContentDto } from '@tailoredin/application';
import type { LayoutAnalysis, ResumeTemplate } from '@tailoredin/domain';
import { TypstFileGenerator } from '../resume/TypstFileGenerator.js';
import { TYPST_DIR } from '../resume/TYPST_DIR.js';
import { parseLayoutAnalysis } from './LayoutAnalysisParser.js';

const MAX_CACHE_SIZE = 50;

/**
 * Runs `typst query` on an analysis-mode compiled resume to extract per-block
 * layout positions (page numbers + y-coordinates), then converts them to a
 * LayoutAnalysis. Results are cached by (templateId + contentHash).
 */
@injectable()
export class TypstTemplateLayoutAnalyzer implements TemplateLayoutAnalyzer {
  private readonly cache = new Map<string, { result: LayoutAnalysis; insertedAt: number }>();

  public async analyze(template: ResumeTemplate, content: ResumeContentDto): Promise<LayoutAnalysis> {
    const cacheKey = `${template.id}:${JSON.stringify(content)}`;

    const cached = this.cache.get(cacheKey);
    if (cached) return cached.result;

    const result = await this.runTypstQuery(template, content);
    this.insertCache(cacheKey, result);
    return result;
  }

  private async runTypstQuery(template: ResumeTemplate, content: ResumeContentDto): Promise<LayoutAnalysis> {
    const tmpDir = await FS.mkdtemp(Path.join(OS.tmpdir(), 'tailoredin-analysis-'));

    try {
      // Copy fonts from TYPST_DIR so brilliant-cv can find them
      const fontsSource = Path.join(TYPST_DIR, 'fonts');
      const fontsTarget = Path.join(tmpDir, 'fonts');
      await FS.cp(fontsSource, fontsTarget, { recursive: true });

      await TypstFileGenerator.generateForAnalysis(content, tmpDir, template);

      const queryOutput = await this.spawnTypstQuery(tmpDir);
      return parseLayoutAnalysis(queryOutput, content, template);
    } finally {
      await FS.rm(tmpDir, { recursive: true, force: true });
    }
  }

  private spawnTypstQuery(cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(
        'typst',
        ['query', '--font-path', './fonts', 'cv.typ', '<all-layout-positions>', '--field', 'value'],
        { cwd, stdio: ['pipe', 'pipe', 'pipe'] }
      );

      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      proc.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
      proc.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));

      proc.on('close', code => {
        if (code !== 0) {
          reject(new Error(`typst query failed: ${Buffer.concat(stderr).toString()}`));
        } else {
          resolve(Buffer.concat(stdout).toString());
        }
      });
      proc.on('error', reject);
    });
  }

  /** Evicts the oldest entry when cache is full. */
  private insertCache(key: string, result: LayoutAnalysis): void {
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldest = [...this.cache.entries()].sort((a, b) => a[1].insertedAt - b[1].insertedAt)[0];
      this.cache.delete(oldest[0]);
    }
    this.cache.set(key, { result, insertedAt: Date.now() });
  }
}
```

- [ ] **Step 8.2: Typecheck**

```bash
bun run --cwd infrastructure typecheck
```

Expected: no errors.

- [ ] **Step 8.3: Commit**

```bash
git add infrastructure/src/services/TypstTemplateLayoutAnalyzer.ts
git commit -m "feat(infrastructure): add TypstTemplateLayoutAnalyzer with LRU cache"
```

---

## Task 9: DI wiring and barrel exports

**Files:**
- Modify: `infrastructure/src/DI.ts`
- Modify: `infrastructure/src/index.ts`
- Modify: `api/src/container.ts`

- [ ] **Step 9.1: Add DI token**

In `infrastructure/src/DI.ts`, add `LayoutAnalyzer` to the `Resume` namespace:

```typescript
// Add this import at the top:
import type { TemplateLayoutAnalyzer } from '@tailoredin/application';

// In the DI.Resume object:
Resume: {
  LlmService: new InjectionToken<LlmService | null>('DI.Resume.LlmService'),
  Renderer: new InjectionToken<ResumeRenderer>('DI.Resume.Renderer'),
  ContentFactory: new InjectionToken<ResumeContentFactory>('DI.Resume.ContentFactory'),
  ChestQuery: new InjectionToken<ResumeChestQuery>('DI.Resume.ChestQuery'),
  LayoutAnalyzer: new InjectionToken<TemplateLayoutAnalyzer>('DI.Resume.LayoutAnalyzer'), // ADD
  GenerateResume: new InjectionToken<GenerateResume>('DI.Resume.GenerateResume'),
  GenerateResumeMarkdown: new InjectionToken<GenerateResumeMarkdown>('DI.Resume.GenerateResumeMarkdown'),
  TailoringService: new InjectionToken<ResumeTailoringService>('DI.Resume.TailoringService'),
},
```

- [ ] **Step 9.2: Export from infrastructure barrel**

In `infrastructure/src/index.ts`, add:

```typescript
export { BrilliantCvTemplate } from './templates/BrilliantCvTemplate.js';
export { TemplateRegistry } from './templates/TemplateRegistry.js';
export { TypstTemplateLayoutAnalyzer } from './services/TypstTemplateLayoutAnalyzer.js';
```

- [ ] **Step 9.3: Bind in container**

In `api/src/container.ts`, add import and binding:

```typescript
// Add to imports from @tailoredin/infrastructure:
import {
  // ... existing imports
  BrilliantCvTemplate,
  TypstTemplateLayoutAnalyzer,
} from '@tailoredin/infrastructure';

// After "Resume services" bindings, add:
container.bind({ provide: DI.Resume.LayoutAnalyzer, useClass: TypstTemplateLayoutAnalyzer });
```

- [ ] **Step 9.4: Typecheck all packages**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 9.5: Start the API to verify nothing is broken at runtime**

```bash
bun run api 2>&1 | head -20
```

Expected: server starts on port 8000 without errors.

- [ ] **Step 9.6: Commit**

```bash
git add infrastructure/src/DI.ts \
        infrastructure/src/index.ts \
        api/src/container.ts
git commit -m "feat: wire TypstTemplateLayoutAnalyzer into DI container"
```

---

## Task 10: Integration tests

Tests run the real Typst binary against a known fixture and assert on the `LayoutAnalysis` result.

**File:**
- Create: `infrastructure/test-integration/layout-analyzer.test.ts`

> These tests require `typst` on PATH and the fonts directory at `infrastructure/typst/fonts/`. They do NOT need a database.

- [ ] **Step 10.1: Inspect raw `typst query` output (exploratory step)**

Before writing tests, run the real query manually on a minimal fixture to confirm the exact JSON shape returned by `typst query --field value` on a Typst dictionary:

```bash
cd /path/to/infrastructure/typst
# Generate analysis files manually (or run a small Bun script):
bun -e "
import { TypstFileGenerator } from './src/resume/TypstFileGenerator.js';
import { BrilliantCvTemplate } from './src/templates/BrilliantCvTemplate.js';
import OS from 'node:os'; import Path from 'node:path'; import FS from 'node:fs/promises';
const d = await FS.mkdtemp(Path.join(OS.tmpdir(), 'test-'));
await FS.cp('./typst/fonts', Path.join(d, 'fonts'), { recursive: true });
await TypstFileGenerator.generateForAnalysis({
  personal: { first_name: 'J', last_name: 'D', github: 'jd', linkedin: 'jd', email: 'j@d.com', phone: '1', location: 'NY', header_quote: 'Eng' },
  keywords: [], experience: [], skills: [], education: []
}, d, BrilliantCvTemplate);
console.log(d);
"
# Then run:
# typst query --font-path ./fonts /tmp/test-<id>/cv.typ '<all-layout-positions>' --field value
```

Inspect the output and adjust `parseLayoutAnalysis` if the shape differs from what was assumed in Task 7.

- [ ] **Step 10.2: Write integration tests**

```typescript
// infrastructure/test-integration/layout-analyzer.test.ts
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { ResumeContentDto } from '@tailoredin/application';
import { BrilliantCvTemplate } from '../src/templates/BrilliantCvTemplate.js';
import { TypstTemplateLayoutAnalyzer } from '../src/services/TypstTemplateLayoutAnalyzer.js';

const ONE_LINER_CONTENT: ResumeContentDto = {
  personal: {
    first_name: 'Jane', last_name: 'Doe',
    github: 'janedoe', linkedin: 'janedoe',
    email: 'jane@example.com', phone: '555-0100',
    location: 'NYC', header_quote: 'Engineer'     // short — fits on one line
  },
  keywords: [],
  experience: [
    {
      title: 'Senior Engineer', society: 'Acme Corp',
      date: 'Jan 2020 – Dec 2021', location: 'Remote',
      summary: '',
      highlights: ['Built API gateway.']           // single short bullet — fits on one line
    }
  ],
  skills: [{ type: 'Languages', info: 'TypeScript' }],
  education: [{ title: 'BS CS', society: 'MIT', date: '2016', location: 'Cambridge, MA' }],
};

const LONG_BULLET_CONTENT: ResumeContentDto = {
  ...ONE_LINER_CONTENT,
  experience: [
    {
      title: 'Senior Engineer', society: 'Acme Corp',
      date: 'Jan 2020 – Dec 2021', location: 'Remote',
      summary: '',
      highlights: [
        // 200+ characters — guaranteed to wrap at 10.5pt in a US-letter column
        'Architected and delivered a horizontally scalable distributed event-streaming platform ' +
        'that reduced end-to-end processing latency by 40% while cutting infrastructure costs by 30% annually.'
      ]
    }
  ],
};

describe('TypstTemplateLayoutAnalyzer integration', () => {
  let analyzer: TypstTemplateLayoutAnalyzer;

  beforeEach(() => {
    analyzer = new TypstTemplateLayoutAnalyzer();
  });

  it('returns totalPages=1 for a minimal resume', async () => {
    const result = await analyzer.analyze(BrilliantCvTemplate, ONE_LINER_CONTENT);
    expect(result.totalPages).toBe(1);
  }, 60_000);

  it('returns lineCount=1 for a short single-line bullet', async () => {
    const result = await analyzer.analyze(BrilliantCvTemplate, ONE_LINER_CONTENT);
    expect(result.experiences[0].roles[0].bullets[0].lineCount).toBe(1);
  }, 60_000);

  it('returns lineCount>1 for a known-long bullet that wraps', async () => {
    const result = await analyzer.analyze(BrilliantCvTemplate, LONG_BULLET_CONTENT);
    expect(result.experiences[0].roles[0].bullets[0].lineCount).toBeGreaterThan(1);
  }, 60_000);

  it('reports pageNumbers=[1] for all blocks in a single-page resume', async () => {
    const result = await analyzer.analyze(BrilliantCvTemplate, ONE_LINER_CONTENT);
    for (const exp of result.experiences) {
      expect(exp.company.pageNumbers).toEqual([1]);
    }
  }, 60_000);

  it('caches: calling analyze twice with the same input spawns Typst only once', async () => {
    // First call — populates cache
    const r1 = await analyzer.analyze(BrilliantCvTemplate, ONE_LINER_CONTENT);
    // Second call — must hit cache (same object reference)
    const r2 = await analyzer.analyze(BrilliantCvTemplate, ONE_LINER_CONTENT);
    expect(r1).toBe(r2); // strict reference equality proves no second Typst call
  }, 60_000);

  it('returns different results for different content', async () => {
    const r1 = await analyzer.analyze(BrilliantCvTemplate, ONE_LINER_CONTENT);
    const r2 = await analyzer.analyze(BrilliantCvTemplate, LONG_BULLET_CONTENT);
    expect(r1).not.toBe(r2);
    expect(r1.experiences[0].roles[0].bullets[0].lineCount).not.toBe(
      r2.experiences[0].roles[0].bullets[0].lineCount
    );
  }, 60_000);
});
```

- [ ] **Step 10.3: Run integration tests**

```bash
bun run --cwd infrastructure test:integration
```

Expected: all 6 tests pass. If the `typst query` JSON shape differs from the parser assumption, fix `parseLayoutAnalysis` accordingly (ref Step 10.1).

- [ ] **Step 10.4: Commit**

```bash
git add infrastructure/test-integration/layout-analyzer.test.ts
git commit -m "test(infrastructure): add TypstTemplateLayoutAnalyzer integration tests"
```

---

## Verification

End-to-end smoke test after all tasks:

```bash
# All unit tests pass
bun run test

# All integration tests pass (requires typst + Postgres)
bun run --cwd infrastructure test:integration

# No type errors
bun run typecheck

# No dependency boundary violations
bun run dep:check

# API starts
bun run api 2>&1 | head -5
```

Expected: all pass, API starts on port 8000, no errors.
