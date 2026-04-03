# Resume Color Scheme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce Corporate Polished steel blue (`#3E6B8A`) as the resume accent color, with a matching colored section divider line, replacing the current charcoal (`#333333`).

**Architecture:** The `TypstFileGenerator` class in `infrastructure/src/resume/` is the source of truth — it generates all Typst files on every render. A new `helpers.typ` file defines a custom `cv-section` that overrides the brilliant-cv package's hardcoded black divider line with the accent color. Module files import `cv-section` from `helpers.typ` instead of directly from the package.

**Tech Stack:** TypeScript (Bun), Typst / `@preview/brilliant-cv:3.3.0`

---

## File Map

| File | Change |
|---|---|
| `infrastructure/src/resume/TypstFileGenerator.ts` | Change accent color; add `buildHelpersTyp()`; wire into `generate()`; update module imports |
| `infrastructure/test/resume/TypstFileGenerator.test.ts` | Update color test; add tests for `helpers.typ` and module imports |
| `infrastructure/typst/metadata.toml` | Update `awesome_color` |
| `infrastructure/typst/helpers.typ` | New file (static snapshot) |
| `infrastructure/typst/modules_en/professional.typ` | Update import |
| `infrastructure/typst/modules_en/skills.typ` | Update import |
| `infrastructure/typst/modules_en/education.typ` | Update import |

---

### Task 1: Update accent color — TDD

**Files:**
- Modify: `infrastructure/test/resume/TypstFileGenerator.test.ts`
- Modify: `infrastructure/src/resume/TypstFileGenerator.ts`

- [ ] **Step 1: Update the existing test to expect `#3E6B8A`**

In `infrastructure/test/resume/TypstFileGenerator.test.ts`, find and change the test at line 63:

```typescript
it('sets awesome_color to #3E6B8A (Corporate Polished steel blue) in metadata.toml', async () => {
  const files = await generateInTmpDir(MINIMAL_CONTENT);
  expect(files.metadata).toContain('awesome_color = "#3E6B8A"');
  await files.cleanup();
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd infrastructure && bun test test/resume/TypstFileGenerator.test.ts --filter "awesome_color"
```

Expected: FAIL — `Expected string to contain: awesome_color = "#3E6B8A"` (currently produces `#333333`).

- [ ] **Step 3: Update the generator**

In `infrastructure/src/resume/TypstFileGenerator.ts`, in `buildMetadataToml()` at line 51, change:
```typescript
  awesome_color = "#333333"
```
to:
```typescript
  awesome_color = "#3E6B8A"
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd infrastructure && bun test test/resume/TypstFileGenerator.test.ts --filter "awesome_color"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add infrastructure/src/resume/TypstFileGenerator.ts infrastructure/test/resume/TypstFileGenerator.test.ts
git commit -m "feat: set resume accent color to Corporate Polished steel blue #3E6B8A"
```

---

### Task 2: Add `helpers.typ` generation and update module imports — TDD

**Files:**
- Modify: `infrastructure/test/resume/TypstFileGenerator.test.ts`
- Modify: `infrastructure/src/resume/TypstFileGenerator.ts`

- [ ] **Step 1: Add tests for `helpers.typ` and updated module imports**

Append to the `describe('TypstFileGenerator', ...)` block in `infrastructure/test/resume/TypstFileGenerator.test.ts`:

```typescript
describe('helpers.typ', () => {
  it('generates helpers.typ alongside cv.typ', async () => {
    const tmpDir = await FS.mkdtemp(Path.join(OS.tmpdir(), 'typst-gen-'));
    await TypstFileGenerator.generate(MINIMAL_CONTENT, tmpDir);
    const helpers = await FS.readFile(Path.join(tmpDir, 'helpers.typ'), 'utf8');
    expect(helpers).toContain('#3E6B8A');
    await FS.rm(tmpDir, { recursive: true });
  });

  it('helpers.typ defines a custom cv-section with accent divider', async () => {
    const tmpDir = await FS.mkdtemp(Path.join(OS.tmpdir(), 'typst-gen-'));
    await TypstFileGenerator.generate(MINIMAL_CONTENT, tmpDir);
    const helpers = await FS.readFile(Path.join(tmpDir, 'helpers.typ'), 'utf8');
    expect(helpers).toContain('let cv-section');
    expect(helpers).toContain('stroke: 0.9pt + _accent');
    await FS.rm(tmpDir, { recursive: true });
  });

  it('helpers.typ re-exports cv-entry, cv-skill, h-bar from brilliant-cv', async () => {
    const tmpDir = await FS.mkdtemp(Path.join(OS.tmpdir(), 'typst-gen-'));
    await TypstFileGenerator.generate(MINIMAL_CONTENT, tmpDir);
    const helpers = await FS.readFile(Path.join(tmpDir, 'helpers.typ'), 'utf8');
    expect(helpers).toContain('cv-entry');
    expect(helpers).toContain('cv-skill');
    expect(helpers).toContain('h-bar');
    await FS.rm(tmpDir, { recursive: true });
  });
});

describe('module imports', () => {
  it('professional.typ imports cv-section from helpers.typ', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    expect(files.professional).toContain('#import "../helpers.typ"');
    expect(files.professional).not.toContain('#import "@preview/brilliant-cv');
    await files.cleanup();
  });

  it('skills.typ imports cv-section from helpers.typ', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    expect(files.skills).toContain('#import "../helpers.typ"');
    expect(files.skills).not.toContain('#import "@preview/brilliant-cv');
    await files.cleanup();
  });

  it('education.typ imports cv-section from helpers.typ', async () => {
    const files = await generateInTmpDir(MINIMAL_CONTENT);
    expect(files.education).toContain('#import "../helpers.typ"');
    expect(files.education).not.toContain('#import "@preview/brilliant-cv');
    await files.cleanup();
  });
});
```

Note: `generateInTmpDir` already reads `metadata`, `cv`, `professional`, `skills`, `education`. The `helpers.typ` tests use a separate tmp dir and read the file directly.

- [ ] **Step 2: Run the new tests to verify they all fail**

```bash
cd infrastructure && bun test test/resume/TypstFileGenerator.test.ts --filter "helpers|module imports"
```

Expected: all FAIL — `helpers.typ` does not exist yet, module files still import from `@preview/brilliant-cv`.

- [ ] **Step 3: Add `buildHelpersTyp()` to `TypstFileGenerator`**

In `infrastructure/src/resume/TypstFileGenerator.ts`, add this private static method after `buildCvTyp()`:

```typescript
private static buildHelpersTyp(): string {
  return `\
#import "@preview/brilliant-cv:3.3.0": cv-entry, cv-skill, h-bar

#let _accent = rgb("#3E6B8A")
#let _section-skip = ${RESUME_LAYOUT.beforeSectionSkip}

// Custom cv-section: re-implements brilliant-cv's section header with an accent-colored divider line.
// The package's built-in cv-section uses a hardcoded black stroke that does not follow awesome_color.
#let cv-section(title, letters: 3) = {
  v(_section-skip)
  block(
    sticky: true,
    [#text(size: 16pt, weight: "bold", fill: _accent, title.slice(0, letters))#text(size: 16pt, weight: "bold", title.slice(letters))
    #h(2pt)
    #box(width: 1fr, line(stroke: 0.9pt + _accent, length: 100%))]
  )
}
`;
}
```

- [ ] **Step 4: Wire `buildHelpersTyp()` into `generate()`**

In `TypstFileGenerator.generate()`, add `helpers.typ` to the parallel write array:

```typescript
await Promise.all([
  FS.writeFile(Path.join(workDir, 'metadata.toml'), TypstFileGenerator.buildMetadataToml(content), 'utf8'),
  FS.writeFile(Path.join(workDir, 'cv.typ'), TypstFileGenerator.buildCvTyp(), 'utf8'),
  FS.writeFile(Path.join(workDir, 'helpers.typ'), TypstFileGenerator.buildHelpersTyp(), 'utf8'),
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
```

- [ ] **Step 5: Update module import lines in the generator**

In `TypstFileGenerator.ts`, make these three changes:

**`buildProfessionalTyp()`** — change line:
```typescript
`#import "@preview/brilliant-cv:3.3.0": cv-section, cv-entry`,
```
to:
```typescript
`#import "../helpers.typ": cv-section, cv-entry`,
```

**`buildSkillsTyp()`** — change line:
```typescript
`#import "@preview/brilliant-cv:3.3.0": cv-section, cv-skill, h-bar`,
```
to:
```typescript
`#import "../helpers.typ": cv-section, cv-skill, h-bar`,
```

**`buildEducationTyp()`** — change line:
```typescript
`#import "@preview/brilliant-cv:3.3.0": cv-section`,
```
to:
```typescript
`#import "../helpers.typ": cv-section`,
```

- [ ] **Step 6: Run all new tests to verify they pass**

```bash
cd infrastructure && bun test test/resume/TypstFileGenerator.test.ts
```

Expected: all tests PASS (including the existing ones from Task 1).

- [ ] **Step 7: Commit**

```bash
git add infrastructure/src/resume/TypstFileGenerator.ts infrastructure/test/resume/TypstFileGenerator.test.ts
git commit -m "feat: add helpers.typ with accent-colored section divider, update module imports"
```

---

### Task 3: Sync static snapshot files

**Files:**
- Modify: `infrastructure/typst/metadata.toml`
- Create: `infrastructure/typst/helpers.typ`
- Modify: `infrastructure/typst/modules_en/professional.typ`
- Modify: `infrastructure/typst/modules_en/skills.typ`
- Modify: `infrastructure/typst/modules_en/education.typ`

The static files in `infrastructure/typst/` are overwritten on every render but are committed as a reference snapshot. Keep them in sync manually.

- [ ] **Step 1: Update `metadata.toml`**

In `infrastructure/typst/metadata.toml`, change line 3:
```toml
  awesome_color = "#333333"
```
to:
```toml
  awesome_color = "#3E6B8A"
```

- [ ] **Step 2: Create `infrastructure/typst/helpers.typ`**

```typst
#import "@preview/brilliant-cv:3.3.0": cv-entry, cv-skill, h-bar

#let _accent = rgb("#3E6B8A")
#let _section-skip = 4pt

// Custom cv-section: re-implements brilliant-cv's section header with an accent-colored divider line.
// The package's built-in cv-section uses a hardcoded black stroke that does not follow awesome_color.
#let cv-section(title, letters: 3) = {
  v(_section-skip)
  block(
    sticky: true,
    [#text(size: 16pt, weight: "bold", fill: _accent, title.slice(0, letters))#text(size: 16pt, weight: "bold", title.slice(letters))
    #h(2pt)
    #box(width: 1fr, line(stroke: 0.9pt + _accent, length: 100%))]
  )
}
```

- [ ] **Step 3: Update `modules_en/professional.typ` import**

Change line 1:
```typst
#import "@preview/brilliant-cv:3.3.0": cv-section, cv-entry
```
to:
```typst
#import "../helpers.typ": cv-section, cv-entry
```

- [ ] **Step 4: Update `modules_en/skills.typ` import**

Change line 1:
```typst
#import "@preview/brilliant-cv:3.3.0": cv-section, cv-skill, h-bar
```
to:
```typst
#import "../helpers.typ": cv-section, cv-skill, h-bar
```

- [ ] **Step 5: Update `modules_en/education.typ` import**

Change line 1:
```typst
#import "@preview/brilliant-cv:3.3.0": cv-section
```
to:
```typst
#import "../helpers.typ": cv-section
```

- [ ] **Step 6: Compile to verify the static template renders correctly**

```bash
cd infrastructure/typst && typst compile cv.typ /tmp/test-resume.pdf
```

Expected: exits 0, PDF written to `/tmp/test-resume.pdf`. Open it and verify:
- Name in steel blue
- Section headers with steel blue first letters (`Exp`, `Ski`, `Edu`) and steel blue divider line
- Job titles in steel blue small caps
- Location text in steel blue italic
- Company names still bold dark
- Dates still muted gray
- Bullet text dark, no color bleed

- [ ] **Step 7: Commit**

```bash
git add infrastructure/typst/metadata.toml infrastructure/typst/helpers.typ infrastructure/typst/modules_en/
git commit -m "chore: sync static typst snapshot to steel blue color scheme"
```
