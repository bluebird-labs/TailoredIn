# Multi-Template Resume Renderer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add imprecv, modern-cv, and linked-cv as selectable Typst resume templates alongside the existing Brilliant CV, chosen per-request via an optional `theme` field in `POST /resume/pdf`.

**Architecture:** A new `ResumeRendererFactory` port replaces the current `ResumeRenderer` dependency in `GenerateResumePdf`. The factory holds four renderer classes (`BrilliantCvRenderer`, `ImprecvRenderer`, `ModernCvRenderer`, `LinkedCvRenderer`) and routes by a `ResumeTheme` string. `TypstResumeRenderer` is deleted; its logic moves to `BrilliantCvRenderer`. Generator helper functions for each template live in co-located `*-generators.ts` files so they can be unit-tested without running Typst.

**Tech Stack:** Bun, TypeScript, Typst CLI, `@preview/imprecv:1.0.1`, `@preview/modern-cv:0.9.0`, `@preview/linked-cv:0.1.0`, needle-di, Elysia

---

## File Map

| Action | Path |
|---|---|
| Create | `application/src/ports/ResumeRendererFactory.ts` |
| Modify | `application/src/ports/index.ts` |
| Modify | `application/src/index.ts` |
| Modify | `application/src/use-cases/resume/GenerateResumePdf.ts` |
| Create | `application/test/use-cases/resume/GenerateResumePdf.test.ts` |
| Create | `infrastructure/src/services/renderers/BrilliantCvRenderer.ts` |
| Delete | `infrastructure/src/services/TypstResumeRenderer.ts` |
| Create | `infrastructure/src/services/renderers/ImprecvRenderer.ts` |
| Create | `infrastructure/src/services/renderers/imprecv-generators.ts` |
| Create | `infrastructure/src/services/renderers/ModernCvRenderer.ts` |
| Create | `infrastructure/src/services/renderers/modern-cv-generators.ts` |
| Create | `infrastructure/src/services/renderers/LinkedCvRenderer.ts` |
| Create | `infrastructure/src/services/renderers/linked-cv-generators.ts` |
| Create | `infrastructure/src/services/TypstResumeRendererFactory.ts` |
| Create | `infrastructure/test/services/renderers/imprecv-generators.test.ts` |
| Create | `infrastructure/test/services/renderers/modern-cv-generators.test.ts` |
| Create | `infrastructure/test/services/renderers/linked-cv-generators.test.ts` |
| Create | `infrastructure/test/services/TypstResumeRendererFactory.test.ts` |
| Modify | `infrastructure/src/DI.ts` |
| Modify | `infrastructure/src/index.ts` |
| Modify | `api/src/container.ts` |
| Modify | `api/src/routes/resume/GenerateResumePdfRoute.ts` |
| Add assets | `infrastructure/typst/fonts/` (Roboto, Source Sans 3, FontAwesome 5) |
| Move static | `infrastructure/typst/brilliant-cv/` (cv.typ, helpers.typ, modules_en/) |

---

## Task 1: ResumeTheme type + ResumeRendererFactory port

**Files:**
- Create: `application/src/ports/ResumeRendererFactory.ts`
- Modify: `application/src/ports/index.ts`
- Modify: `application/src/index.ts`

- [ ] **Step 1: Create `ResumeRendererFactory.ts`**

```typescript
// application/src/ports/ResumeRendererFactory.ts
import type { ResumeRenderer } from './ResumeRenderer.js';

export type ResumeTheme = 'brilliant-cv' | 'imprecv' | 'modern-cv' | 'linked-cv';
export const DEFAULT_RESUME_THEME: ResumeTheme = 'brilliant-cv';

export interface ResumeRendererFactory {
  get(theme: ResumeTheme): ResumeRenderer;
}
```

- [ ] **Step 2: Export from ports barrel**

In `application/src/ports/index.ts`, add:
```typescript
export type { ResumeRendererFactory, ResumeTheme } from './ResumeRendererFactory.js';
```

`DEFAULT_RESUME_THEME` is a value only used inside the application package — it stays as a direct file import in `GenerateResumePdf.ts` and does not go in the barrel.

- [ ] **Step 3: Verify `application/src/index.ts` re-exports ports**

`application/src/index.ts` already has `export type * from './ports/index.js'` and `export * from './ports/index.js'` (via sub-barrel). Confirm `ResumeTheme` and `DEFAULT_RESUME_THEME` are re-exported.

Run:
```bash
bun run typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add application/src/ports/ResumeRendererFactory.ts application/src/ports/index.ts
git commit -m "feat(application): add ResumeTheme type and ResumeRendererFactory port"
```

---

## Task 2: Modify GenerateResumePdf to use factory

**Files:**
- Modify: `application/src/use-cases/resume/GenerateResumePdf.ts`
- Create: `application/test/use-cases/resume/GenerateResumePdf.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// application/test/use-cases/resume/GenerateResumePdf.test.ts
import { describe, expect, mock, test } from 'bun:test';
import {
  EntityNotFoundError,
  Experience,
  ExperienceId,
  type EducationRepository,
  type ExperienceRepository,
  type HeadlineRepository,
  type JobDescriptionRepository,
  type ProfileRepository,
  Headline,
  HeadlineId,
  JobDescription,
  JobDescriptionId,
  JobSource
} from '@tailoredin/domain';
import type { ResumeContentGenerator } from '../../../src/ports/ResumeContentGenerator.js';
import type { ResumeRendererFactory } from '../../../src/ports/ResumeRendererFactory.js';
import type { ResumeRenderer } from '../../../src/ports/ResumeRenderer.js';
import { GenerateResumePdf } from '../../../src/use-cases/resume/GenerateResumePdf.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProfile() {
  return {
    id: { value: 'profile-1' },
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: null,
    location: 'New York, NY',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    githubUrl: null,
    websiteUrl: null,
    about: 'Engineer'
  };
}

function makeHeadline() {
  return new Headline({
    id: new HeadlineId('headline-0000-0000-0000-000000000001'),
    profileId: 'profile-1',
    label: 'Test Headline',
    summaryText: 'Summary',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });
}

function makeJd() {
  return new JobDescription({
    id: new JobDescriptionId('jd-00000000-0000-0000-0000-000000000001'),
    companyId: 'company-1',
    title: 'Staff Engineer',
    description: 'Build things',
    rawText: null,
    url: null,
    location: null,
    salaryRange: null,
    level: null,
    locationType: null,
    source: JobSource.UPLOAD,
    postedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  });
}

function makeExperience() {
  return new Experience({
    id: new ExperienceId('exp-00000000-0000-0000-0000-000000000001'),
    profileId: 'profile-1',
    title: 'Engineer',
    companyName: 'Acme',
    companyWebsite: null,
    companyId: null,
    location: 'NY',
    startDate: '2022-01',
    endDate: null,
    summary: null,
    ordinal: 0,
    accomplishments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

function makeEducation() {
  // Plain object — avoids coupling to Education constructor shape
  return {
    id: { value: 'edu-00000000-0000-0000-0000-000000000001' },
    profileId: 'profile-1',
    degreeTitle: 'BSc CS',
    institutionName: 'MIT',
    graduationYear: 2020,
    location: 'Cambridge, MA',
    honors: null
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GenerateResumePdf', () => {
  const fakePdf = new Uint8Array([1, 2, 3]);

  const fakeRenderer: ResumeRenderer = {
    render: mock(async () => fakePdf)
  };

  const fakeFactory: ResumeRendererFactory = {
    get: mock(() => fakeRenderer)
  };

  const fakeGenerator: ResumeContentGenerator = {
    generate: mock(async () => ({
      experiences: [{ experienceId: 'exp-00000000-0000-0000-0000-000000000001', summary: null, bullets: ['Bullet'] }]
    }))
  };

  function makeUseCase() {
    const jd = makeJd();
    const profile = makeProfile();
    const headline = makeHeadline();
    const experience = makeExperience();
    const education = makeEducation();

    const profileRepo: ProfileRepository = { findSingle: mock(async () => profile) } as unknown as ProfileRepository;
    const headlineRepo: HeadlineRepository = { findAll: mock(async () => [headline]) } as unknown as HeadlineRepository;
    const experienceRepo: ExperienceRepository = { findAll: mock(async () => [experience]) } as unknown as ExperienceRepository;
    const educationRepo: EducationRepository = { findAll: mock(async () => [education]) } as unknown as EducationRepository;
    const jdRepo: JobDescriptionRepository = { findById: mock(async () => jd) } as unknown as JobDescriptionRepository;

    return new GenerateResumePdf(
      profileRepo,
      headlineRepo,
      experienceRepo,
      educationRepo,
      jdRepo,
      fakeGenerator,
      fakeFactory
    );
  }

  test('calls factory.get with the provided theme', async () => {
    const useCase = makeUseCase();
    await useCase.execute({
      jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001',
      headlineId: 'headline-0000-0000-0000-000000000001',
      theme: 'imprecv'
    });
    expect(fakeFactory.get).toHaveBeenCalledWith('imprecv');
  });

  test('uses brilliant-cv when theme is omitted', async () => {
    const useCase = makeUseCase();
    await useCase.execute({
      jobDescriptionId: 'jd-00000000-0000-0000-0000-000000000001',
      headlineId: 'headline-0000-0000-0000-000000000001'
    });
    expect(fakeFactory.get).toHaveBeenCalledWith('brilliant-cv');
  });

  test('throws EntityNotFoundError when JD does not exist', async () => {
    const jd = makeJd();
    const profile = makeProfile();
    const headline = makeHeadline();
    const profileRepo: ProfileRepository = { findSingle: mock(async () => profile) } as unknown as ProfileRepository;
    const headlineRepo: HeadlineRepository = { findAll: mock(async () => [headline]) } as unknown as HeadlineRepository;
    const experienceRepo: ExperienceRepository = { findAll: mock(async () => []) } as unknown as ExperienceRepository;
    const educationRepo: EducationRepository = { findAll: mock(async () => []) } as unknown as EducationRepository;
    const jdRepo: JobDescriptionRepository = { findById: mock(async () => null) } as unknown as JobDescriptionRepository;

    const useCase = new GenerateResumePdf(
      profileRepo, headlineRepo, experienceRepo, educationRepo, jdRepo, fakeGenerator, fakeFactory
    );
    await expect(
      useCase.execute({ jobDescriptionId: 'nonexistent', headlineId: 'headline-0000-0000-0000-000000000001' })
    ).rejects.toThrow(EntityNotFoundError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun test application/test/use-cases/resume/GenerateResumePdf.test.ts
```
Expected: FAIL — `GenerateResumePdf` constructor still takes `ResumeRenderer`, not `ResumeRendererFactory`.

- [ ] **Step 3: Update `GenerateResumePdf`**

Replace the current file entirely:

```typescript
// application/src/use-cases/resume/GenerateResumePdf.ts
import {
  DEFAULT_RESUME_TEMPLATE,
  type EducationRepository,
  EntityNotFoundError,
  type ExperienceRepository,
  type HeadlineRepository,
  JobDescriptionId,
  type JobDescriptionRepository,
  type ProfileRepository
} from '@tailoredin/domain';
import type { ResumeContentGenerator } from '../../ports/ResumeContentGenerator.js';
import { DEFAULT_RESUME_THEME, type ResumeRendererFactory, type ResumeTheme } from '../../ports/ResumeRendererFactory.js';
import type { ResumeRenderInput } from '../../ports/ResumeRenderer.js';

export type GenerateResumePdfInput = {
  jobDescriptionId: string;
  headlineId: string;
  theme?: ResumeTheme;
};

const BULLET_LIMITS: Array<{ min: number; max: number }> = [
  { min: 2, max: 12 },
  { min: 2, max: 10 },
  { min: 2, max: 8 },
  { min: 2, max: 6 }
];
const BULLET_LIMITS_DEFAULT = { min: 2, max: 3 };

function extractLinkedinSlug(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '').replace(/\/$/, '');
}

function extractGithubUsername(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\/$/, '');
}

export class GenerateResumePdf {
  public constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly headlineRepository: HeadlineRepository,
    private readonly experienceRepository: ExperienceRepository,
    private readonly educationRepository: EducationRepository,
    private readonly jobDescriptionRepository: JobDescriptionRepository,
    private readonly generator: ResumeContentGenerator,
    private readonly rendererFactory: ResumeRendererFactory
  ) {}

  public async execute(input: GenerateResumePdfInput): Promise<Uint8Array> {
    const jd = await this.jobDescriptionRepository.findById(new JobDescriptionId(input.jobDescriptionId));
    if (!jd) {
      throw new EntityNotFoundError('JobDescription', input.jobDescriptionId);
    }

    const profile = await this.profileRepository.findSingle();

    const allHeadlines = await this.headlineRepository.findAll();
    const headline = allHeadlines.find(h => h.id.value === input.headlineId) ?? null;
    if (!headline) {
      throw new EntityNotFoundError('Headline', input.headlineId);
    }

    const allExperiences = await this.experienceRepository.findAll();
    const experiences = allExperiences
      .filter(e => e.profileId === profile.id.value)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));

    const allEducations = await this.educationRepository.findAll();
    const educations = allEducations
      .filter(e => e.profileId === profile.id.value)
      .sort((a, b) => b.graduationYear - a.graduationYear);

    const generated = await this.generator.generate({
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        about: profile.about
      },
      headline: { summaryText: headline.summaryText },
      jobDescription: {
        title: jd.title,
        description: jd.description,
        rawText: jd.rawText
      },
      experiences: experiences.map((exp, index) => {
        const limits = BULLET_LIMITS[index] ?? BULLET_LIMITS_DEFAULT;
        return {
          id: exp.id.value,
          title: exp.title,
          companyName: exp.companyName,
          summary: exp.summary,
          accomplishments: exp.accomplishments.map(a => ({
            title: a.title,
            narrative: a.narrative
          })),
          minBullets: limits.min,
          maxBullets: limits.max
        };
      })
    });

    const generatedByExperienceId = new Map(generated.experiences.map(e => [e.experienceId, e]));

    const renderInput: ResumeRenderInput = {
      personal: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        linkedin: extractLinkedinSlug(profile.linkedinUrl),
        github: extractGithubUsername(profile.githubUrl),
        website: profile.websiteUrl
      },
      headlineSummary: headline.summaryText,
      experiences: experiences.map(exp => {
        const gen = generatedByExperienceId.get(exp.id.value);
        return {
          title: exp.title,
          companyName: exp.companyName,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate || null,
          summary: gen?.summary ?? null,
          bullets: gen?.bullets ?? []
        };
      }),
      educations: educations.map(edu => ({
        degreeTitle: edu.degreeTitle,
        institutionName: edu.institutionName,
        graduationYear: edu.graduationYear,
        location: edu.location,
        honors: edu.honors
      })),
      template: DEFAULT_RESUME_TEMPLATE
    };

    const renderer = this.rendererFactory.get(input.theme ?? DEFAULT_RESUME_THEME);
    return renderer.render(renderInput);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun test application/test/use-cases/resume/GenerateResumePdf.test.ts
```
Expected: PASS (3 tests).

- [ ] **Step 5: Run full suite to confirm no regressions**

```bash
bun run typecheck && bun run test
```
Expected: all pass (container.ts will error on typecheck since it still references `DI.Resume.Renderer` and `TypstResumeRenderer` — that is expected and will be fixed in Task 9).

- [ ] **Step 6: Commit**

```bash
git add application/src/use-cases/resume/GenerateResumePdf.ts \
        application/test/use-cases/resume/GenerateResumePdf.test.ts
git commit -m "feat(application): GenerateResumePdf uses ResumeRendererFactory with per-request theme"
```

---

## Task 3: Extract BrilliantCvRenderer + restructure static files

**Files:**
- Create: `infrastructure/src/services/renderers/BrilliantCvRenderer.ts`
- Move (mkdir + copy): `infrastructure/typst/brilliant-cv/` (cv.typ, helpers.typ, modules_en/)
- Delete: `infrastructure/src/services/TypstResumeRenderer.ts`

- [ ] **Step 1: Create `infrastructure/typst/brilliant-cv/` and move static files**

```bash
mkdir -p "infrastructure/typst/brilliant-cv/modules_en"
cp infrastructure/typst/cv.typ infrastructure/typst/brilliant-cv/
cp infrastructure/typst/helpers.typ infrastructure/typst/brilliant-cv/
cp -r infrastructure/typst/modules_en/. infrastructure/typst/brilliant-cv/modules_en/
```

The `fonts/` directory stays at `infrastructure/typst/fonts/` — shared across all renderers.

- [ ] **Step 2: Create `infrastructure/src/services/renderers/BrilliantCvRenderer.ts`**

This is a copy of `TypstResumeRenderer.ts` with the TYPST_DIR path updated to point to `brilliant-cv/`:

```typescript
// infrastructure/src/services/renderers/BrilliantCvRenderer.ts
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
  type ResumeRenderExperience
} from '../typst-generators.js';

const TYPST_DIR = join(import.meta.dir, '../../../typst/brilliant-cv');
const FONTS_DIR = join(import.meta.dir, '../../../typst/fonts');
const MAX_PAGES = 2;

@injectable()
export class BrilliantCvRenderer implements ResumeRenderer {
  public async render(input: ResumeRenderInput): Promise<Uint8Array> {
    const tmpDir = await mkdtemp('/tmp/tailoredin-resume-');

    try {
      await this.setupTempDir(tmpDir, input);

      let educations = [...input.educations];
      const experiences = input.experiences.map(e => ({ ...e, bullets: [...e.bullets] }));

      let pdf = await this.compile(tmpDir, experiences, educations);
      let { totalPages } = analyzeLayout(pdf);

      while (totalPages > MAX_PAGES && educations.length > 1) {
        educations = educations.slice(0, -1);
        pdf = await this.compile(tmpDir, experiences, educations);
        ({ totalPages } = analyzeLayout(pdf));
      }

      while (totalPages > MAX_PAGES) {
        let trimmed = false;
        for (let i = experiences.length - 1; i >= 0; i--) {
          if (experiences[i].bullets.length > 1) {
            experiences[i] = { ...experiences[i], bullets: experiences[i].bullets.slice(0, -1) };
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

    await Bun.write(join(tmpDir, 'cv.typ'), Bun.file(join(TYPST_DIR, 'cv.typ')));
    await Bun.write(join(tmpDir, 'helpers.typ'), Bun.file(join(TYPST_DIR, 'helpers.typ')));
    await Bun.write(join(tmpDir, 'modules_en', 'skills.typ'), Bun.file(join(TYPST_DIR, 'modules_en', 'skills.typ')));

    await mkdir(join(tmpDir, 'fonts'));
    const fontsGlob = new Bun.Glob('**/*.{otf,ttf,woff,woff2}');
    for await (const fontFile of fontsGlob.scan(FONTS_DIR)) {
      const dest = join(tmpDir, 'fonts', fontFile.split('/').pop()!);
      await Bun.write(dest, Bun.file(join(FONTS_DIR, fontFile)));
    }

    await writeFile(join(tmpDir, 'config.typ'), generateConfigTyp(input.template));
    await writeFile(
      join(tmpDir, 'metadata.toml'),
      generateMetadataToml(input.personal, input.headlineSummary, input.template)
    );
  }

  private async compile(
    tmpDir: string,
    experiences: ResumeRenderExperience[],
    educations: ResumeRenderEducation[]
  ): Promise<Uint8Array> {
    await writeFile(join(tmpDir, 'modules_en', 'professional.typ'), generateProfessionalTyp(experiences));
    await writeFile(join(tmpDir, 'modules_en', 'education.typ'), generateEducationTyp(educations));

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
  }
}
```

- [ ] **Step 3: Run existing typst-generators tests to confirm nothing broke**

```bash
bun test infrastructure/test/services/typst-generators.test.ts
```
Expected: all pass.

- [ ] **Step 4: Delete `TypstResumeRenderer.ts`**

```bash
rm infrastructure/src/services/TypstResumeRenderer.ts
```

- [ ] **Step 5: Commit**

```bash
git add infrastructure/typst/brilliant-cv/ \
        infrastructure/src/services/renderers/BrilliantCvRenderer.ts
git rm infrastructure/src/services/TypstResumeRenderer.ts
git commit -m "refactor(infrastructure): extract BrilliantCvRenderer, move static files to brilliant-cv/"
```

---

## Task 4: Add font assets for modern-cv and linked-cv

These two templates require Roboto, Source Sans 3, and FontAwesome 5 Free. imprecv uses Libertinus Serif (bundled with Typst — no download needed).

- [ ] **Step 1: Download Roboto**

Go to https://fonts.google.com/specimen/Roboto, click "Download family". Extract and copy these files to `infrastructure/typst/fonts/`:
- `Roboto-Light.ttf` (weight 300)
- `Roboto-Regular.ttf` (weight 400)
- `Roboto-Medium.ttf` (weight 500)
- `Roboto-Bold.ttf` (weight 700)

- [ ] **Step 2: Download Source Sans 3**

Go to https://fonts.google.com/specimen/Source+Sans+3, click "Download family". Extract and copy:
- `SourceSans3-Light.ttf` (weight 300)
- `SourceSans3-Regular.ttf` (weight 400)
- `SourceSans3-SemiBold.ttf` (weight 600)

- [ ] **Step 3: Download FontAwesome 5 Free OTF files**

FontAwesome 5 Free OTF files (required for modern-cv icons). Download from:
https://github.com/FortAwesome/Font-Awesome/releases/tag/5.15.4

Inside the release zip, find `otfs/` directory. Copy:
- `Font Awesome 5 Free-Regular-400.otf`
- `Font Awesome 5 Free-Solid-900.otf`
- `Font Awesome 5 Brands-Regular-400.otf`

Place all three files into `infrastructure/typst/fonts/`.

**Note:** The filenames with spaces are required — Typst identifies fonts by the family name embedded in the file, which FontAwesome uses "Font Awesome 5 Free".

- [ ] **Step 4: Commit font assets**

```bash
git add infrastructure/typst/fonts/Roboto-*.ttf \
        infrastructure/typst/fonts/SourceSans3-*.ttf \
        "infrastructure/typst/fonts/Font Awesome 5 Free-Regular-400.otf" \
        "infrastructure/typst/fonts/Font Awesome 5 Free-Solid-900.otf" \
        "infrastructure/typst/fonts/Font Awesome 5 Brands-Regular-400.otf"
git commit -m "assets: add Roboto, Source Sans 3, FontAwesome 5 Free fonts for modern-cv/linked-cv"
```

---

## Task 5: ImprecvRenderer

**Files:**
- Create: `infrastructure/src/services/renderers/imprecv-generators.ts`
- Create: `infrastructure/test/services/renderers/imprecv-generators.test.ts`
- Create: `infrastructure/src/services/renderers/ImprecvRenderer.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// infrastructure/test/services/renderers/imprecv-generators.test.ts
import { describe, expect, test } from 'bun:test';
import type { ResumeRenderInput } from '@tailoredin/application';
import { DEFAULT_RESUME_TEMPLATE } from '@tailoredin/domain';
import {
  escapeYamlString,
  generateImprecvYaml,
  generateImprecvTemplateTyp
} from '../../../src/services/renderers/imprecv-generators.js';

function makeInput(overrides: Partial<ResumeRenderInput> = {}): ResumeRenderInput {
  return {
    personal: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1-555-0100',
      location: 'New York, NY',
      linkedin: 'johndoe',
      github: 'johndoe',
      website: null
    },
    headlineSummary: 'Staff Engineer focused on platform',
    experiences: [
      {
        title: 'Staff Engineer',
        companyName: 'Acme Corp',
        location: 'New York, NY',
        startDate: '2022-01-15',
        endDate: null,
        summary: 'Led platform team',
        bullets: ['Built distributed systems', 'Reduced latency by 40%']
      }
    ],
    educations: [
      {
        degreeTitle: 'BSc Computer Science',
        institutionName: 'MIT',
        graduationYear: 2020,
        location: 'Cambridge, MA',
        honors: null
      }
    ],
    template: DEFAULT_RESUME_TEMPLATE,
    ...overrides
  };
}

describe('escapeYamlString', () => {
  test('escapes double quotes', () => {
    expect(escapeYamlString('say "hello"')).toBe('say \\"hello\\"');
  });

  test('escapes backslashes', () => {
    expect(escapeYamlString('path\\to\\file')).toBe('path\\\\to\\\\file');
  });

  test('leaves normal text unchanged', () => {
    expect(escapeYamlString('normal text')).toBe('normal text');
  });
});

describe('generateImprecvYaml', () => {
  test('includes personal name fields', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('first: "John"');
    expect(yaml).toContain('last: "Doe"');
  });

  test('includes email and phone', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('john@example.com');
    expect(yaml).toContain('+1-555-0100');
  });

  test('includes LinkedIn profile', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('linkedin.com/in/johndoe');
  });

  test('omits GitHub profile when null', () => {
    const yaml = generateImprecvYaml(makeInput({ personal: { ...makeInput().personal, github: null } }));
    expect(yaml).not.toContain('github.com');
  });

  test('includes work organization and position', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('organization: "Acme Corp"');
    expect(yaml).toContain('position: "Staff Engineer"');
  });

  test('formats startDate as ISO 8601', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('startDate: "2022-01-15"');
  });

  test('uses "present" for current role', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('endDate: "present"');
  });

  test('includes bullet highlights', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('Built distributed systems');
    expect(yaml).toContain('Reduced latency by 40%');
  });

  test('skips experiences with no bullets', () => {
    const input = makeInput();
    input.experiences[0].bullets = [];
    const yaml = generateImprecvYaml(input);
    expect(yaml).not.toContain('Staff Engineer');
  });

  test('includes education institution', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('institution: "MIT"');
  });

  test('includes graduation year as endDate year', () => {
    const yaml = generateImprecvYaml(makeInput());
    expect(yaml).toContain('"2020-');
  });
});

describe('generateImprecvTemplateTyp', () => {
  test('imports imprecv package', () => {
    const typ = generateImprecvTemplateTyp();
    expect(typ).toContain('@preview/imprecv');
  });

  test('references cv.yaml data file', () => {
    const typ = generateImprecvTemplateTyp();
    expect(typ).toContain('cv.yaml');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun test infrastructure/test/services/renderers/imprecv-generators.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `imprecv-generators.ts`**

```typescript
// infrastructure/src/services/renderers/imprecv-generators.ts
import type { ResumeRenderInput } from '@tailoredin/application';

export function escapeYamlString(text: string): string {
  return text.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function isoDateToImprecvDate(iso: string): string {
  // "2022-01-15" or "2022-01" → "2022-01-15" or "2022-01-01"
  const parts = iso.split('-');
  if (parts.length === 2) return `${parts[0]}-${parts[1]}-01`;
  return iso;
}

export function generateImprecvYaml(input: ResumeRenderInput): string {
  const { personal, experiences, educations } = input;

  const profiles: string[] = [];
  if (personal.linkedin) {
    profiles.push(
      `    - network: "LinkedIn"\n      username: "${escapeYamlString(personal.linkedin)}"\n      url: "https://linkedin.com/in/${escapeYamlString(personal.linkedin)}"`
    );
  }
  if (personal.github) {
    profiles.push(
      `    - network: "GitHub"\n      username: "${escapeYamlString(personal.github)}"\n      url: "https://github.com/${escapeYamlString(personal.github)}"`
    );
  }
  if (personal.website) {
    profiles.push(
      `    - network: "Website"\n      username: "${escapeYamlString(personal.website)}"\n      url: "${escapeYamlString(personal.website)}"`
    );
  }

  const workEntries = experiences
    .filter(exp => exp.bullets.length > 0)
    .map(exp => {
      const startDate = isoDateToImprecvDate(exp.startDate);
      const endDate = exp.endDate ? `"${isoDateToImprecvDate(exp.endDate)}"` : '"present"';
      const highlights = exp.bullets.map(b => `          - "${escapeYamlString(b)}"`).join('\n');
      return `  - organization: "${escapeYamlString(exp.companyName)}"
    url: ""
    location: "${escapeYamlString(exp.location)}"
    positions:
      - position: "${escapeYamlString(exp.title)}"
        startDate: "${startDate}"
        endDate: ${endDate}
        highlights:
${highlights}`;
    });

  const educationEntries = educations.map(edu => {
    return `  - institution: "${escapeYamlString(edu.institutionName)}"
    url: ""
    area: "${escapeYamlString(edu.degreeTitle)}"
    studyType: ""
    location: "${escapeYamlString(edu.location ?? '')}"
    startDate: ""
    endDate: "${edu.graduationYear}-06-01"
    honors: []
    courses: []
    highlights: []`;
  });

  return `personal:
  name:
    first: "${escapeYamlString(personal.firstName)}"
    last: "${escapeYamlString(personal.lastName)}"
  email: "${escapeYamlString(personal.email)}"
  phone: "${escapeYamlString(personal.phone ?? '')}"
  url: "${escapeYamlString(personal.website ?? '')}"
  location:
    city: "${escapeYamlString(personal.location ?? '')}"
  profiles:
${profiles.join('\n')}

work:
${workEntries.join('\n')}

education:
${educationEntries.join('\n')}

affiliations: []
awards: []
certificates: []
publications: []
projects: []
skills: []
languages: []
interests: []
references: []
`;
}

export function generateImprecvTemplateTyp(): string {
  return `#import "@preview/imprecv:1.0.1": *

#let uservars = (
  bodysize: 10pt,
  headingfont: "Libertinus Serif",
  bodyfont: "Libertinus Serif",
  monospacefont: "Libertinus Mono",
  showAddress: false,
  showNumber: true,
  showTitle: true,
)

#show: cv.with(metadata: yaml("cv.yaml"), uservars: uservars)
`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun test infrastructure/test/services/renderers/imprecv-generators.test.ts
```
Expected: all pass.

- [ ] **Step 5: Implement `ImprecvRenderer.ts`**

```typescript
// infrastructure/src/services/renderers/ImprecvRenderer.ts
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { injectable } from '@needle-di/core';
import type { ResumeRenderer, ResumeRenderInput } from '@tailoredin/application';
import { generateImprecvTemplateTyp, generateImprecvYaml } from './imprecv-generators.js';

@injectable()
export class ImprecvRenderer implements ResumeRenderer {
  public async render(input: ResumeRenderInput): Promise<Uint8Array> {
    const tmpDir = await mkdtemp('/tmp/tailoredin-resume-');

    try {
      await writeFile(`${tmpDir}/cv.yaml`, generateImprecvYaml(input));
      await writeFile(`${tmpDir}/template.typ`, generateImprecvTemplateTyp());

      const proc = Bun.spawn(['typst', 'compile', 'template.typ', 'output.pdf'], {
        cwd: tmpDir,
        stderr: 'pipe'
      });

      const exitCode = await proc.exited;
      if (exitCode !== 0) {
        const stderr = await new Response(proc.stderr).text();
        throw new Error(`Typst compilation failed (exit ${exitCode}): ${stderr}`);
      }

      const pdfBuffer = await Bun.file(`${tmpDir}/output.pdf`).arrayBuffer();
      return new Uint8Array(pdfBuffer);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add infrastructure/src/services/renderers/imprecv-generators.ts \
        infrastructure/src/services/renderers/ImprecvRenderer.ts \
        infrastructure/test/services/renderers/imprecv-generators.test.ts
git commit -m "feat(infrastructure): add ImprecvRenderer with YAML generator"
```

---

## Task 6: ModernCvRenderer

**Files:**
- Create: `infrastructure/src/services/renderers/modern-cv-generators.ts`
- Create: `infrastructure/test/services/renderers/modern-cv-generators.test.ts`
- Create: `infrastructure/src/services/renderers/ModernCvRenderer.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// infrastructure/test/services/renderers/modern-cv-generators.test.ts
import { describe, expect, test } from 'bun:test';
import type { ResumeRenderInput } from '@tailoredin/application';
import { DEFAULT_RESUME_TEMPLATE } from '@tailoredin/domain';
import { generateModernCvTyp } from '../../../src/services/renderers/modern-cv-generators.js';

function makeInput(overrides: Partial<ResumeRenderInput> = {}): ResumeRenderInput {
  return {
    personal: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1-555-0100',
      location: 'New York, NY',
      linkedin: 'johndoe',
      github: 'johndoe',
      website: null
    },
    headlineSummary: 'Staff Engineer',
    experiences: [
      {
        title: 'Staff Engineer',
        companyName: 'Acme Corp',
        location: 'New York, NY',
        startDate: '2022-01-15',
        endDate: null,
        summary: null,
        bullets: ['Built distributed systems', 'Reduced latency by 40%']
      }
    ],
    educations: [
      {
        degreeTitle: 'BSc Computer Science',
        institutionName: 'MIT',
        graduationYear: 2020,
        location: 'Cambridge, MA',
        honors: null
      }
    ],
    template: DEFAULT_RESUME_TEMPLATE,
    ...overrides
  };
}

describe('generateModernCvTyp', () => {
  test('imports modern-cv package', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('@preview/modern-cv');
  });

  test('includes author firstname and lastname', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('firstname: "John"');
    expect(typ).toContain('lastname: "Doe"');
  });

  test('includes email', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('john@example.com');
  });

  test('includes linkedin slug', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('johndoe');
  });

  test('includes experience entry with company and title', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('Acme Corp');
    expect(typ).toContain('Staff Engineer');
  });

  test('includes bullet as list item', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('- Built distributed systems');
    expect(typ).toContain('- Reduced latency by 40%');
  });

  test('skips experiences with no bullets', () => {
    const input = makeInput();
    input.experiences[0].bullets = [];
    const typ = generateModernCvTyp(input);
    expect(typ).not.toContain('resume-entry');
  });

  test('formats date range correctly', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('Jan 2022');
    expect(typ).toContain('Present');
  });

  test('includes education section', () => {
    const typ = generateModernCvTyp(makeInput());
    expect(typ).toContain('MIT');
    expect(typ).toContain('BSc Computer Science');
    expect(typ).toContain('2020');
  });

  test('escapes Typst special characters in bullet text', () => {
    const input = makeInput();
    input.experiences[0].bullets = ['Used #hash and [brackets]'];
    const typ = generateModernCvTyp(input);
    expect(typ).toContain('\\#hash');
    expect(typ).toContain('\\[brackets\\]');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun test infrastructure/test/services/renderers/modern-cv-generators.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `modern-cv-generators.ts`**

```typescript
// infrastructure/src/services/renderers/modern-cv-generators.ts
import type { ResumeRenderInput } from '@tailoredin/application';
import { escapeTypst } from '../typst-generators.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string): string {
  const [year, month] = iso.split('-');
  const monthIndex = parseInt(month ?? '1', 10) - 1;
  return `${MONTHS[monthIndex] ?? 'Jan'} ${year}`;
}

function formatDateRange(startDate: string, endDate: string | null): string {
  return `${formatDate(startDate)} - ${endDate ? formatDate(endDate) : 'Present'}`;
}

function escapeAuthorField(text: string): string {
  return text.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

export function generateModernCvTyp(input: ResumeRenderInput): string {
  const { personal, experiences, educations, headlineSummary } = input;

  const positions = headlineSummary
    ? `("${escapeAuthorField(headlineSummary)}")`
    : '()';

  const experienceEntries = experiences
    .filter(exp => exp.bullets.length > 0)
    .map(exp => {
      const date = escapeTypst(formatDateRange(exp.startDate, exp.endDate));
      const bullets = exp.bullets.map(b => `  - ${escapeTypst(b)}`).join('\n');
      return `#resume-entry(
  title: "${escapeAuthorField(exp.title)}",
  location: "${escapeAuthorField(exp.location)}",
  date: "${date}",
  description: "${escapeAuthorField(exp.companyName)}",
)

#resume-item[
${bullets}
]`;
    });

  const educationEntries = educations.map(edu => {
    return `#resume-entry(
  title: "${escapeAuthorField(edu.degreeTitle)}",
  location: "${escapeAuthorField(edu.location ?? '')}",
  date: "${edu.graduationYear}",
  description: "${escapeAuthorField(edu.institutionName)}",
)`;
  });

  return `#import "@preview/modern-cv:0.9.0": *

#show: resume.with(
  author: (
    firstname: "${escapeAuthorField(personal.firstName)}",
    lastname: "${escapeAuthorField(personal.lastName)}",
    email: "${escapeAuthorField(personal.email)}",
    phone: "${escapeAuthorField(personal.phone ?? '')}",
    github: "${escapeAuthorField(personal.github ?? '')}",
    linkedin: "${escapeAuthorField(personal.linkedin ?? '')}",
    address: "${escapeAuthorField(personal.location ?? '')}",
    positions: ${positions},
  ),
  profile-picture: none,
  date: none,
  language: "en",
  paper-size: "us-letter",
  colored-headers: true,
  show-footer: false,
)

= Experience

${experienceEntries.join('\n\n')}

= Education

${educationEntries.join('\n\n')}
`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun test infrastructure/test/services/renderers/modern-cv-generators.test.ts
```
Expected: all pass.

- [ ] **Step 5: Implement `ModernCvRenderer.ts`**

```typescript
// infrastructure/src/services/renderers/ModernCvRenderer.ts
import { join } from 'node:path';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { injectable } from '@needle-di/core';
import type { ResumeRenderer, ResumeRenderInput } from '@tailoredin/application';
import { generateModernCvTyp } from './modern-cv-generators.js';

const FONTS_DIR = join(import.meta.dir, '../../../typst/fonts');

@injectable()
export class ModernCvRenderer implements ResumeRenderer {
  public async render(input: ResumeRenderInput): Promise<Uint8Array> {
    const tmpDir = await mkdtemp('/tmp/tailoredin-resume-');

    try {
      await mkdir(join(tmpDir, 'fonts'));
      const fontsGlob = new Bun.Glob('**/*.{otf,ttf,woff,woff2}');
      for await (const fontFile of fontsGlob.scan(FONTS_DIR)) {
        const dest = join(tmpDir, 'fonts', fontFile.split('/').pop()!);
        await Bun.write(dest, Bun.file(join(FONTS_DIR, fontFile)));
      }

      await writeFile(join(tmpDir, 'resume.typ'), generateModernCvTyp(input));

      const proc = Bun.spawn(
        ['typst', 'compile', '--font-path', './fonts', 'resume.typ', 'output.pdf'],
        { cwd: tmpDir, stderr: 'pipe' }
      );

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
```

- [ ] **Step 6: Commit**

```bash
git add infrastructure/src/services/renderers/modern-cv-generators.ts \
        infrastructure/src/services/renderers/ModernCvRenderer.ts \
        infrastructure/test/services/renderers/modern-cv-generators.test.ts
git commit -m "feat(infrastructure): add ModernCvRenderer with Typst generator"
```

---

## Task 7: LinkedCvRenderer

**Files:**
- Create: `infrastructure/src/services/renderers/linked-cv-generators.ts`
- Create: `infrastructure/test/services/renderers/linked-cv-generators.test.ts`
- Create: `infrastructure/src/services/renderers/LinkedCvRenderer.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// infrastructure/test/services/renderers/linked-cv-generators.test.ts
import { describe, expect, test } from 'bun:test';
import type { ResumeRenderInput, ResumeRenderExperience } from '@tailoredin/application';
import { DEFAULT_RESUME_TEMPLATE } from '@tailoredin/domain';
import {
  formatLinkedCvDate,
  groupExperiencesByCompany,
  generateLinkedCvTyp
} from '../../../src/services/renderers/linked-cv-generators.js';

function makeExp(overrides: Partial<ResumeRenderExperience> = {}): ResumeRenderExperience {
  return {
    title: 'Staff Engineer',
    companyName: 'Acme Corp',
    location: 'New York, NY',
    startDate: '2022-01-15',
    endDate: null,
    summary: null,
    bullets: ['Built systems'],
    ...overrides
  };
}

function makeInput(exps: ResumeRenderExperience[] = [makeExp()]): ResumeRenderInput {
  return {
    personal: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: null,
      location: 'New York, NY',
      linkedin: 'johndoe',
      github: null,
      website: null
    },
    headlineSummary: 'Platform engineer',
    experiences: exps,
    educations: [
      {
        degreeTitle: 'BSc CS',
        institutionName: 'MIT',
        graduationYear: 2020,
        location: 'Cambridge, MA',
        honors: null
      }
    ],
    template: DEFAULT_RESUME_TEMPLATE
  };
}

describe('formatLinkedCvDate', () => {
  test('formats YYYY-MM-DD as MM-YYYY', () => {
    expect(formatLinkedCvDate('2022-01-15')).toBe('01-2022');
  });

  test('formats YYYY-MM as MM-YYYY', () => {
    expect(formatLinkedCvDate('2022-01')).toBe('01-2022');
  });

  test('zero-pads single-digit months', () => {
    expect(formatLinkedCvDate('2022-03')).toBe('03-2022');
  });
});

describe('groupExperiencesByCompany', () => {
  test('groups two roles at same company into one entry', () => {
    const exps = [
      makeExp({ title: 'Staff Engineer', companyName: 'Acme', startDate: '2023-01' }),
      makeExp({ title: 'Senior Engineer', companyName: 'Acme', startDate: '2021-01', endDate: '2022-12' })
    ];
    const groups = groupExperiencesByCompany(exps);
    expect(groups).toHaveLength(1);
    expect(groups[0].companyName).toBe('Acme');
    expect(groups[0].roles).toHaveLength(2);
  });

  test('keeps different companies as separate groups, preserving input order', () => {
    const exps = [
      makeExp({ companyName: 'Acme', startDate: '2023-01' }),
      makeExp({ companyName: 'Beta', startDate: '2021-01' })
    ];
    const groups = groupExperiencesByCompany(exps);
    expect(groups).toHaveLength(2);
    expect(groups[0].companyName).toBe('Acme');
    expect(groups[1].companyName).toBe('Beta');
  });

  test('skips experiences with no bullets', () => {
    const exps = [makeExp({ bullets: [] })];
    const groups = groupExperiencesByCompany(exps);
    expect(groups).toHaveLength(0);
  });
});

describe('generateLinkedCvTyp', () => {
  test('imports linked-cv package', () => {
    const typ = generateLinkedCvTyp(makeInput());
    expect(typ).toContain('@preview/linked-cv');
  });

  test('includes name', () => {
    const typ = generateLinkedCvTyp(makeInput());
    expect(typ).toContain('John');
    expect(typ).toContain('Doe');
  });

  test('includes employer name', () => {
    const typ = generateLinkedCvTyp(makeInput());
    expect(typ).toContain('Acme Corp');
  });

  test('uses MM-YYYY format for dates', () => {
    const typ = generateLinkedCvTyp(makeInput());
    expect(typ).toContain('"01-2022"');
  });

  test('uses "current" for ongoing roles', () => {
    const typ = generateLinkedCvTyp(makeInput());
    expect(typ).toContain('"current"');
  });

  test('includes bullet text', () => {
    const typ = generateLinkedCvTyp(makeInput());
    expect(typ).toContain('Built systems');
  });

  test('groups multiple roles at same company into one connected-frames block', () => {
    const exps = [
      makeExp({ title: 'Staff Engineer', companyName: 'Acme', startDate: '2023-01' }),
      makeExp({ title: 'Senior Engineer', companyName: 'Acme', startDate: '2021-01', endDate: '2022-12' })
    ];
    const typ = generateLinkedCvTyp(makeInput(exps));
    // Only one employer-info block for Acme
    const employerInfoCount = (typ.match(/employer-info/g) ?? []).length;
    expect(employerInfoCount).toBe(1);
    // Both titles appear
    expect(typ).toContain('Staff Engineer');
    expect(typ).toContain('Senior Engineer');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun test infrastructure/test/services/renderers/linked-cv-generators.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `linked-cv-generators.ts`**

```typescript
// infrastructure/src/services/renderers/linked-cv-generators.ts
import type { ResumeRenderExperience, ResumeRenderInput } from '@tailoredin/application';
import { escapeTypst } from '../typst-generators.js';

export type CompanyGroup = {
  companyName: string;
  companySlug: string;
  /** Start date of the earliest role at this company (MM-YYYY) */
  overallStart: string;
  /** End date of the most recent role (MM-YYYY or "current") */
  overallEnd: string;
  roles: ResumeRenderExperience[];
};

export function formatLinkedCvDate(iso: string): string {
  // "2022-01-15" or "2022-01" → "01-2022"
  const parts = iso.split('-');
  const year = parts[0] ?? '2000';
  const month = parts[1] ?? '01';
  return `${month.padStart(2, '0')}-${year}`;
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function groupExperiencesByCompany(experiences: ResumeRenderExperience[]): CompanyGroup[] {
  const groups: CompanyGroup[] = [];
  const indexByCompany = new Map<string, number>();

  for (const exp of experiences) {
    if (exp.bullets.length === 0) continue;

    const existing = indexByCompany.get(exp.companyName);
    if (existing !== undefined) {
      groups[existing].roles.push(exp);
      // Expand the overall date range if this role is earlier
      if (exp.endDate === null) {
        groups[existing].overallEnd = 'current';
      }
    } else {
      indexByCompany.set(exp.companyName, groups.length);
      groups.push({
        companyName: exp.companyName,
        companySlug: toSlug(exp.companyName),
        overallStart: formatLinkedCvDate(exp.startDate),
        overallEnd: exp.endDate ? formatLinkedCvDate(exp.endDate) : 'current',
        roles: [exp]
      });
    }
  }

  return groups;
}

function renderRole(exp: ResumeRenderExperience): string {
  const start = formatLinkedCvDate(exp.startDate);
  const end = exp.endDate ? formatLinkedCvDate(exp.endDate) : 'current';
  const bullets = exp.bullets.map(b => `      - ${escapeTypst(b)}`).join('\n');

  return `  (
    title: [${escapeTypst(exp.title)}],
    duration: ("${start}", "${end}"),
    body: [
${bullets}
    ]
  )`;
}

export function generateLinkedCvTyp(input: ResumeRenderInput): string {
  const { personal, experiences, educations, headlineSummary } = input;
  const groups = groupExperiencesByCompany(experiences);

  const experienceBlocks = groups.map(group => {
    const roles = group.roles.map(renderRole).join(',\n');
    return `#components.employer-info(
  none,
  name: "${escapeTypst(group.companyName)}",
  duration: ("${group.overallStart}", "${group.overallEnd}"),
)

#frame.connected-frames(
  "${group.companySlug}",
${roles},
)`;
  });

  const educationEntries = educations.map(edu => {
    const endYear = `${edu.graduationYear}-06-01`;
    return `#components.employer-info(
  none,
  name: "${escapeTypst(edu.institutionName)}",
  duration: ("09-${edu.graduationYear - 4}", "${formatLinkedCvDate(endYear)}"),
)
#frame.connected-frames(
  "${toSlug(edu.institutionName)}",
  (
    title: [${escapeTypst(edu.degreeTitle)}],
    duration: ("09-${edu.graduationYear - 4}", "${formatLinkedCvDate(endYear)}"),
    body: []
  ),
)`;
  });

  const tagline = headlineSummary ? escapeTypst(headlineSummary) : '';

  return `#import "@preview/linked-cv:0.1.0": *

#show: cv.with(
  name: "${escapeTypst(personal.firstName)} ${escapeTypst(personal.lastName)}",
  tagline: "${tagline}",
  email: "${escapeTypst(personal.email)}",
  phone: "${escapeTypst(personal.phone ?? '')}",
  linkedin: "${escapeTypst(personal.linkedin ? `linkedin.com/in/${personal.linkedin}` : '')}",
  github: "${escapeTypst(personal.github ? `github.com/${personal.github}` : '')}",
  accent-colour: rgb("#0077B5"),
  paper: "us-letter",
)

#components.section("Experience")

${experienceBlocks.join('\n\n')}

#components.section("Education")

${educationEntries.join('\n\n')}
`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun test infrastructure/test/services/renderers/linked-cv-generators.test.ts
```
Expected: all pass.

- [ ] **Step 5: Implement `LinkedCvRenderer.ts`**

```typescript
// infrastructure/src/services/renderers/LinkedCvRenderer.ts
import { join } from 'node:path';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { injectable } from '@needle-di/core';
import type { ResumeRenderer, ResumeRenderInput } from '@tailoredin/application';
import { generateLinkedCvTyp } from './linked-cv-generators.js';

const FONTS_DIR = join(import.meta.dir, '../../../typst/fonts');

@injectable()
export class LinkedCvRenderer implements ResumeRenderer {
  public async render(input: ResumeRenderInput): Promise<Uint8Array> {
    const tmpDir = await mkdtemp('/tmp/tailoredin-resume-');

    try {
      await mkdir(join(tmpDir, 'fonts'));
      const fontsGlob = new Bun.Glob('**/*.{otf,ttf,woff,woff2}');
      for await (const fontFile of fontsGlob.scan(FONTS_DIR)) {
        const dest = join(tmpDir, 'fonts', fontFile.split('/').pop()!);
        await Bun.write(dest, Bun.file(join(FONTS_DIR, fontFile)));
      }

      await writeFile(join(tmpDir, 'main.typ'), generateLinkedCvTyp(input));

      const proc = Bun.spawn(
        ['typst', 'compile', '--font-path', './fonts', 'main.typ', 'output.pdf'],
        { cwd: tmpDir, stderr: 'pipe' }
      );

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
```

- [ ] **Step 6: Commit**

```bash
git add infrastructure/src/services/renderers/linked-cv-generators.ts \
        infrastructure/src/services/renderers/LinkedCvRenderer.ts \
        infrastructure/test/services/renderers/linked-cv-generators.test.ts
git commit -m "feat(infrastructure): add LinkedCvRenderer with employer-grouping generator"
```

---

## Task 8: TypstResumeRendererFactory

**Files:**
- Create: `infrastructure/src/services/TypstResumeRendererFactory.ts`
- Create: `infrastructure/test/services/TypstResumeRendererFactory.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// infrastructure/test/services/TypstResumeRendererFactory.test.ts
import { describe, expect, test } from 'bun:test';
import { TypstResumeRendererFactory } from '../../src/services/TypstResumeRendererFactory.js';
import { BrilliantCvRenderer } from '../../src/services/renderers/BrilliantCvRenderer.js';
import { ImprecvRenderer } from '../../src/services/renderers/ImprecvRenderer.js';
import { ModernCvRenderer } from '../../src/services/renderers/ModernCvRenderer.js';
import { LinkedCvRenderer } from '../../src/services/renderers/LinkedCvRenderer.js';

describe('TypstResumeRendererFactory', () => {
  const factory = new TypstResumeRendererFactory();

  test('returns BrilliantCvRenderer for "brilliant-cv"', () => {
    expect(factory.get('brilliant-cv')).toBeInstanceOf(BrilliantCvRenderer);
  });

  test('returns ImprecvRenderer for "imprecv"', () => {
    expect(factory.get('imprecv')).toBeInstanceOf(ImprecvRenderer);
  });

  test('returns ModernCvRenderer for "modern-cv"', () => {
    expect(factory.get('modern-cv')).toBeInstanceOf(ModernCvRenderer);
  });

  test('returns LinkedCvRenderer for "linked-cv"', () => {
    expect(factory.get('linked-cv')).toBeInstanceOf(LinkedCvRenderer);
  });

  test('returns the same instance on repeated calls (singleton per theme)', () => {
    expect(factory.get('imprecv')).toBe(factory.get('imprecv'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun test infrastructure/test/services/TypstResumeRendererFactory.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `TypstResumeRendererFactory.ts`**

```typescript
// infrastructure/src/services/TypstResumeRendererFactory.ts
import { injectable } from '@needle-di/core';
import type { ResumeRendererFactory, ResumeTheme } from '@tailoredin/application';
import type { ResumeRenderer } from '@tailoredin/application';
import { BrilliantCvRenderer } from './renderers/BrilliantCvRenderer.js';
import { ImprecvRenderer } from './renderers/ImprecvRenderer.js';
import { LinkedCvRenderer } from './renderers/LinkedCvRenderer.js';
import { ModernCvRenderer } from './renderers/ModernCvRenderer.js';

@injectable()
export class TypstResumeRendererFactory implements ResumeRendererFactory {
  private readonly brilliantCv = new BrilliantCvRenderer();
  private readonly imprecv = new ImprecvRenderer();
  private readonly modernCv = new ModernCvRenderer();
  private readonly linkedCv = new LinkedCvRenderer();

  public get(theme: ResumeTheme): ResumeRenderer {
    switch (theme) {
      case 'brilliant-cv': return this.brilliantCv;
      case 'imprecv':      return this.imprecv;
      case 'modern-cv':    return this.modernCv;
      case 'linked-cv':    return this.linkedCv;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun test infrastructure/test/services/TypstResumeRendererFactory.test.ts
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add infrastructure/src/services/TypstResumeRendererFactory.ts \
        infrastructure/test/services/TypstResumeRendererFactory.test.ts
git commit -m "feat(infrastructure): add TypstResumeRendererFactory routing by ResumeTheme"
```

---

## Task 9: DI tokens + container wiring

**Files:**
- Modify: `infrastructure/src/DI.ts`
- Modify: `infrastructure/src/index.ts`
- Modify: `api/src/container.ts`

- [ ] **Step 1: Update `infrastructure/src/DI.ts`**

In the imports, replace:
```typescript
import type { ResumeRenderer } from '@tailoredin/application';
```
with:
```typescript
import type { ResumeRendererFactory } from '@tailoredin/application';
```

In the `Resume` namespace, replace the `Renderer` token:
```typescript
// Before:
Renderer: new InjectionToken<ResumeRenderer>('DI.Resume.Renderer'),

// After:
RendererFactory: new InjectionToken<ResumeRendererFactory>('DI.Resume.RendererFactory'),
```

- [ ] **Step 2: Update `infrastructure/src/index.ts`**

Replace the `TypstResumeRenderer` export with:
```typescript
export { TypstResumeRendererFactory } from './services/TypstResumeRendererFactory.js';
```

- [ ] **Step 3: Update `api/src/container.ts`**

Replace the import:
```typescript
// Before:
import { TypstResumeRenderer, ... } from '@tailoredin/infrastructure';

// After:
import { TypstResumeRendererFactory, ... } from '@tailoredin/infrastructure';
```

Replace the `Resume.Renderer` binding and `GenerateResumePdf` wiring:
```typescript
// Before:
container.bind({ provide: DI.Resume.Renderer, useClass: TypstResumeRenderer });
// ...
container.bind({
  provide: DI.Resume.GeneratePdf,
  useFactory: () => new GenerateResumePdf(
    container.get(DI.Profile.Repository),
    container.get(DI.Headline.Repository),
    container.get(DI.Experience.Repository),
    container.get(DI.Education.Repository),
    container.get(DI.JobDescription.Repository),
    container.get(DI.Resume.Generator),
    container.get(DI.Resume.Renderer),
  ),
});

// After:
container.bind({ provide: DI.Resume.RendererFactory, useClass: TypstResumeRendererFactory });
// ...
container.bind({
  provide: DI.Resume.GeneratePdf,
  useFactory: () => new GenerateResumePdf(
    container.get(DI.Profile.Repository),
    container.get(DI.Headline.Repository),
    container.get(DI.Experience.Repository),
    container.get(DI.Education.Repository),
    container.get(DI.JobDescription.Repository),
    container.get(DI.Resume.Generator),
    container.get(DI.Resume.RendererFactory),
  ),
});
```

- [ ] **Step 4: Run typecheck**

```bash
bun run typecheck
```
Expected: no errors.

- [ ] **Step 5: Run full test suite**

```bash
bun run test
```
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add infrastructure/src/DI.ts infrastructure/src/index.ts api/src/container.ts
git commit -m "feat(infrastructure): wire TypstResumeRendererFactory into DI container"
```

---

## Task 10: Route update — add `theme` field

**Files:**
- Modify: `api/src/routes/resume/GenerateResumePdfRoute.ts`

- [ ] **Step 1: Add `theme` to the Elysia body schema**

```typescript
// api/src/routes/resume/GenerateResumePdfRoute.ts
import { inject, injectable } from '@needle-di/core';
import type { GenerateResumePdf } from '@tailoredin/application';
import { EntityNotFoundError } from '@tailoredin/domain';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

/**
 * Generates a tailored resume PDF for a given job description and headline.
 *
 * @example
 * curl -X POST http://localhost:8000/resume/pdf \
 *   -H "Content-Type: application/json" \
 *   -d '{"jobDescriptionId": "your-jd-id", "headlineId": "your-headline-id", "theme": "imprecv"}' \
 *   --output resume.pdf
 */
@injectable()
export class GenerateResumePdfRoute {
  public constructor(private readonly generateResumePdf: GenerateResumePdf = inject(DI.Resume.GeneratePdf)) {}

  public plugin() {
    return new Elysia().post(
      '/resume/pdf',
      async ({ body, set }) => {
        try {
          const pdf = await this.generateResumePdf.execute({
            jobDescriptionId: body.jobDescriptionId,
            headlineId: body.headlineId,
            theme: body.theme
          });
          set.headers['Content-Type'] = 'application/pdf';
          set.headers['Content-Disposition'] = 'attachment; filename="resume.pdf"';
          return pdf;
        } catch (e) {
          if (e instanceof EntityNotFoundError) {
            set.status = 404;
            return { error: { code: 'NOT_FOUND', message: e.message } };
          }
          throw e;
        }
      },
      {
        body: t.Object({
          jobDescriptionId: t.String(),
          headlineId: t.String(),
          theme: t.Optional(
            t.Union([
              t.Literal('brilliant-cv'),
              t.Literal('imprecv'),
              t.Literal('modern-cv'),
              t.Literal('linked-cv')
            ])
          )
        })
      }
    );
  }
}
```

- [ ] **Step 2: Run typecheck**

```bash
bun run typecheck
```
Expected: no errors.

- [ ] **Step 3: Run dep:check and knip**

```bash
bun run dep:check && bun run knip
```
Expected: no violations. If knip flags `DI.Resume.Renderer` token as unused, that is correct — it was removed in Task 9.

- [ ] **Step 4: Commit**

```bash
git add api/src/routes/resume/GenerateResumePdfRoute.ts
git commit -m "feat(api): add optional theme field to POST /resume/pdf"
```

---

## Task 11: Final verification

- [ ] **Step 1: Run full quality check**

```bash
bun run typecheck && bun run check && bun run dep:check && bun run knip && bun run test
```
Expected: all pass with zero errors.

- [ ] **Step 2: Start worktree environment**

```bash
bun wt:up
```

Wait for servers to start. Note the API port from the output.

- [ ] **Step 3: Smoke test — brilliant-cv (default)**

```bash
curl -s -X POST http://localhost:{PORT}/resume/pdf \
  -H "Content-Type: application/json" \
  -d '{"jobDescriptionId": "YOUR_JD_ID", "headlineId": "YOUR_HEADLINE_ID"}' \
  --output /tmp/resume-brilliant.pdf && echo "OK: $(wc -c < /tmp/resume-brilliant.pdf) bytes"
```
Expected: `OK: NNNNN bytes` (>10000). Open `/tmp/resume-brilliant.pdf` — Brilliant CV layout.

- [ ] **Step 4: Smoke test — imprecv**

```bash
curl -s -X POST http://localhost:{PORT}/resume/pdf \
  -H "Content-Type: application/json" \
  -d '{"jobDescriptionId": "YOUR_JD_ID", "headlineId": "YOUR_HEADLINE_ID", "theme": "imprecv"}' \
  --output /tmp/resume-imprecv.pdf && echo "OK: $(wc -c < /tmp/resume-imprecv.pdf) bytes"
```
Expected: PDF with Libertinus Serif, dense ATS-first layout. First run will download `@preview/imprecv:1.0.1` from the Typst registry (one-time, ~2–3s).

- [ ] **Step 5: Smoke test — modern-cv**

```bash
curl -s -X POST http://localhost:{PORT}/resume/pdf \
  -H "Content-Type: application/json" \
  -d '{"jobDescriptionId": "YOUR_JD_ID", "headlineId": "YOUR_HEADLINE_ID", "theme": "modern-cv"}' \
  --output /tmp/resume-modern.pdf && echo "OK: $(wc -c < /tmp/resume-modern.pdf) bytes"
```
Expected: PDF with colored section headers, Roboto/Source Sans typography.

- [ ] **Step 6: Smoke test — linked-cv**

```bash
curl -s -X POST http://localhost:{PORT}/resume/pdf \
  -H "Content-Type: application/json" \
  -d '{"jobDescriptionId": "YOUR_JD_ID", "headlineId": "YOUR_HEADLINE_ID", "theme": "linked-cv"}' \
  --output /tmp/resume-linked.pdf && echo "OK: $(wc -c < /tmp/resume-linked.pdf) bytes"
```
Expected: PDF with LinkedIn-style timeline layout.

- [ ] **Step 7: Stop worktree and commit if needed**

```bash
bun wt:down
```

If any diagnostic fixes were made during smoke tests, commit them:
```bash
git add -p
git commit -m "fix(infrastructure): <describe fix>"
```
