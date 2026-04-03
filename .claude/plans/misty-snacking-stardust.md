# Plan: Replace PDF Preview with typst.ts (Client-Side Typst Compilation)

## Context

The resume builder's live preview currently does a full server roundtrip per change:

```
Browser → POST /api/resumes/preview → DatabaseResumeContentFactory.makeFromSelection()
  → TypstFileGenerator writes .typ/.toml to disk → spawns `typst compile` → reads PDF
  ← PDF binary ← react-pdf renders pages in browser
```

This adds ~1-2s latency per content change (debounced at 1s). The library [typst.ts](https://github.com/Myriad-Dreamin/typst.ts) can compile Typst documents **in the browser via WASM**, rendering to SVG/Canvas. This would eliminate the server roundtrip for preview, making it near-instant.

**What stays unchanged**: The download/export flow (`POST /api/resumes/generate`) remains server-side because typst.ts renders SVG/Canvas, not PDF. All domain/application layer code is untouched.

---

## Architecture Change

```mermaid
graph TD
    subgraph "Current Flow (to be replaced)"
        A1[Content Selection] -->|POST /api/resumes/preview| B1[Server: GenerateResume]
        B1 --> C1[DatabaseResumeContentFactory]
        C1 --> D1[TypstFileGenerator → disk]
        D1 --> E1["typst compile (process spawn)"]
        E1 -->|PDF binary| F1[react-pdf renders pages]
    end

    subgraph "New Flow"
        A2[Content Selection] --> B2[buildTypstSource — pure string builder]
        B2 --> C2[typst.ts WASM Compiler]
        C2 -->|SVG artifacts| D2["TypstDocument React component"]
    end

    subgraph "Unchanged: Download Flow"
        A3[Download Button] -->|POST /api/resumes/generate| B3[Server: GenerateResume]
        B3 --> C3[TypstResumeRenderer → PDF file]
        C3 -->|attachment download| D3[Browser saves file]
    end
```

### What changes

| Layer | Current | With typst.ts |
|---|---|---|
| **Preview rendering** | Server `typst compile` → PDF → `react-pdf` | Client WASM compile → SVG via `<TypstDocument>` |
| **Preview hook** | `usePdfPreview` fetches from API | New `useTypstPreview` compiles locally |
| **Preview component** | `PdfPreviewPanel` with react-pdf | New component with typst.ts `<TypstDocument>` |
| **Typst source generation** | `TypstFileGenerator` (writes to disk, Node-only) | Shared pure string builder (no `node:fs`) + thin disk-writing wrapper |
| **Preview API route** | `POST /api/resumes/preview` | **Removed** |
| **Dependencies** | `react-pdf`, `pdfjs-dist` | `@myriaddreamin/typst.ts`, `@myriaddreamin/typst.react`, `@myriaddreamin/typst-ts-renderer`, `@myriaddreamin/typst-ts-web-compiler` |

---

## Critical Files Reference

### Files to modify/replace

| File | Action |
|---|---|
| `web/src/components/resume/builder/PdfPreviewPanel.tsx` | **Replace** — swap react-pdf for typst.ts `<TypstDocument>` |
| `web/src/hooks/use-pdf-preview.ts` | **Replace** — new hook that compiles locally via WASM |
| `web/src/routes/resume/builder.tsx` | **Modify** — update imports, change how preview data flows (no more `pdfData`/`isCompiling` from API) |
| `infrastructure/src/resume/TypstFileGenerator.ts` | **Refactor** — extract pure string builders into a shared module; keep a thin wrapper for disk writes |
| `api/src/routes/PreviewResumeRoute.ts` | **Delete** |
| `api/src/index.ts` | **Modify** — remove PreviewResumeRoute registration |
| `api/src/container.ts` | **Modify** — remove PreviewResumeRoute from container if bound there |
| `web/package.json` | **Modify** — remove `react-pdf`/`pdfjs-dist`, add typst.ts packages |

### Files to create

| File | Purpose |
|---|---|
| `web/src/hooks/use-typst-preview.ts` | New hook: takes content selection, generates Typst source, compiles via WASM, returns render artifacts |
| `web/src/components/resume/builder/TypstPreviewPanel.tsx` | New component: renders typst.ts output with download button and loading states |
| `web/src/lib/typst-compiler.ts` | Singleton WASM compiler initialization + compilation helper |
| `web/src/lib/typst-source-builder.ts` | Pure string builder extracted from `TypstFileGenerator` (no Node deps) |
| `web/public/typst-packages/brilliant-cv/` (or similar) | Pre-bundled BrilliantCV v3.3.0 package files for WASM virtual filesystem |

### Files that stay unchanged

- `api/src/routes/GenerateResumeRoute.ts` — download flow stays server-side
- `application/src/use-cases/GenerateResume.ts` — unchanged
- `infrastructure/src/services/TypstResumeRenderer.ts` — still used for download
- `infrastructure/src/services/DatabaseResumeContentFactory.ts` — still used for download
- `infrastructure/src/brilliant-cv/types.ts` — `BrilliantCVContent` type stays the same
- All domain layer code

---

## Implementation Steps

### Milestone 0: Spike — Validate BrilliantCV in WASM (DO THIS FIRST)

**Goal**: Prove that typst.ts can compile a document that imports `@preview/brilliant-cv:3.3.0` in the browser. This is the make-or-break question — if it doesn't work, the whole plan is blocked.

1. **Install typst.ts packages** in `web/`:
   ```bash
   cd web && bun add @myriaddreamin/typst.ts @myriaddreamin/typst.react @myriaddreamin/typst-ts-renderer @myriaddreamin/typst-ts-web-compiler
   ```

2. **Download BrilliantCV v3.3.0 source files** from the [Typst package registry](https://packages.typst.org/preview/brilliant-cv-3.3.0.tar.gz). Extract to `web/public/typst-packages/preview/brilliant-cv/3.3.0/`.

3. **Create a test route** `web/src/routes/resume/typst-test.tsx`:
   - Initialize the WASM compiler
   - Mount BrilliantCV files into the compiler's virtual filesystem
   - Compile a minimal document:
     ```typst
     #import "@preview/brilliant-cv:3.3.0": cv
     #let metadata = toml("./metadata.toml")
     #show: cv.with(metadata)
     Hello World
     ```
   - Render using `<TypstDocument>`
   - **Success criteria**: Document renders without errors, BrilliantCV styling visible

4. **If package resolution fails**, investigate:
   - Does typst.ts support `@preview/` package imports natively?
   - Can we configure a custom package resolver?
   - Fallback: inline BrilliantCV source directly (replace `#import "@preview/..."` with local paths)

**If this spike fails**, stop here and report findings. The rest of the plan depends on it.

### Milestone 1: Extract Typst Source Builder (Shared Module)

**Goal**: Make the Typst source generation logic usable in both browser and server without code duplication.

**Current state**: `infrastructure/src/resume/TypstFileGenerator.ts` has static methods that:
- Build `metadata.toml` string (`buildMetadataToml`)
- Build `cv.typ` string (`buildCvTyp`)
- Build `modules_en/professional.typ` string (`buildProfessionalTyp`)
- Build `modules_en/skills.typ` string (`buildSkillsTyp`)
- Build `modules_en/education.typ` string (`buildEducationTyp`)
- Write them all to disk via `node:fs/promises`

The string-building logic is pure — it only depends on `BrilliantCVContent` type and string operations. The `node:fs` usage is only in the `generate()` method.

**Approach**: Create a new shared module that the web package can import directly. Since the web package can't import from `@tailoredin/infrastructure` (architecture boundary), we need the source builder in a place the web can reach.

**Option A — Put it in `core/`**: This is a pure utility with no domain logic, so it fits `core/`. The `BrilliantCVContent` type would also need to move to `core/` or be duplicated.

**Option B — Put it in `web/src/lib/`**: Duplicate the string-building logic in the frontend. Simpler but creates drift risk.

**Option C — New shared package**: Overkill for one module.

**Recommended: Option A** — move the pure string builders and `BrilliantCVContent` type to `core/`. The infrastructure `TypstFileGenerator` becomes a thin wrapper that calls the core builders + writes to disk.

Steps:
1. Move `BrilliantCVContent` type (and sub-types) from `infrastructure/src/brilliant-cv/types.ts` to `core/src/resume/types.ts`
2. Create `core/src/resume/TypstSourceBuilder.ts` with the static string-building methods from `TypstFileGenerator` (no `node:fs`, no `node:path`)
3. Export from `core/` barrel
4. Update `infrastructure/src/resume/TypstFileGenerator.ts` to import from `@tailoredin/core` and only handle file I/O
5. Update `infrastructure/src/services/DatabaseResumeContentFactory.ts` to import types from `@tailoredin/core`
6. Update all other imports of `BrilliantCVContent` across the codebase
7. Run `bun run check` and `bun run --cwd infrastructure typecheck` to verify

**Type definitions to move to core**:
```typescript
// From infrastructure/src/brilliant-cv/types.ts — ALL of these:
export type BrilliantCVExperience = { title, society, date, location, summary, highlights[] }
export type BrilliantCVEducation = { title, society, date, location }
export type BrilliantCVSkill = { type, info }
export type BrilliantCVPersonal = { first_name, last_name, github, linkedin, email, phone, location, header_quote }
export type BrilliantCVContent = { personal, keywords[], experience[], skills[], education[] }
```

### Milestone 2: WASM Compiler Service

**Goal**: Create a singleton compiler service in the web package that initializes the WASM compiler once and exposes a `compile()` method.

Create `web/src/lib/typst-compiler.ts`:

```typescript
// Pseudocode — actual API depends on typst.ts docs
import { createTypstCompiler } from '@myriaddreamin/typst.ts';

let compilerPromise: Promise<TypstCompiler> | null = null;

export function getCompiler(): Promise<TypstCompiler> {
  if (!compilerPromise) {
    compilerPromise = initCompiler();
  }
  return compilerPromise;
}

async function initCompiler(): Promise<TypstCompiler> {
  const compiler = createTypstCompiler();
  await compiler.init({
    // Load WASM modules
    // Mount BrilliantCV package files
    // Mount font files (Source Sans 3, Raleway — used in metadata.toml)
  });
  return compiler;
}

export type TypstSources = {
  'cv.typ': string;
  'metadata.toml': string;
  'modules_en/professional.typ': string;
  'modules_en/skills.typ': string;
  'modules_en/education.typ': string;
};

export async function compileTypst(sources: TypstSources): Promise<Uint8Array> {
  const compiler = await getCompiler();
  // Write sources to virtual filesystem
  for (const [path, content] of Object.entries(sources)) {
    compiler.addSource(path, content);
  }
  // Compile and return SVG/vector artifact
  return compiler.compile('cv.typ');
}
```

**Font handling**: The template uses `Source Sans 3` and `Raleway` fonts (defined in `metadata.toml`). These need to be available to the WASM compiler. Options:
- Bundle font files as static assets in `web/public/fonts/` and mount them in the virtual FS
- Use web fonts already loaded on the page (if typst.ts supports it)
- Check if typst.ts has built-in font loading

**This is another risk area** — investigate during the spike (Milestone 0).

### Milestone 3: New Preview Hook

**Goal**: Replace `usePdfPreview` with a hook that compiles locally.

Create `web/src/hooks/use-typst-preview.ts`:

```typescript
import { useEffect, useRef, useState } from 'react';
import { TypstSourceBuilder } from '@tailoredin/core';  // from Milestone 1
import { compileTypst, type TypstSources } from '@/lib/typst-compiler';

type ContentSelection = {
  headlineText: string;
  experienceSelections: { experienceId: string; bulletIds: string[] }[];
  educationIds: string[];
  skillCategoryIds: string[];
  skillItemIds: string[];
};

type TypstPreviewState = {
  artifact: Uint8Array | null;  // SVG/vector data for <TypstDocument>
  isCompiling: boolean;
  error: string | null;
};

const DEBOUNCE_MS = 300;  // Can be much shorter now — no network latency

export function useTypstPreview(
  selection: ContentSelection | null,
  resumeContent: BrilliantCVContent | null  // Need full content for source generation
): TypstPreviewState {
  // Similar structure to usePdfPreview but:
  // 1. Generate Typst source strings from resumeContent using TypstSourceBuilder
  // 2. Call compileTypst() locally
  // 3. Return artifact data instead of PDF bytes
  // 4. Debounce at 300ms instead of 1000ms (no network overhead)
}
```

**Important data flow change**: The current `usePdfPreview` only sends content *selection IDs* to the server, which then fetches full content from the database. With client-side compilation, we need the **full content** (text, dates, etc.) available in the browser. This means:

- The builder page already loads `experiences`, `educations`, and `profile` data via TanStack Query hooks
- We need to **transform** the loaded data + selection into `BrilliantCVContent` on the client side
- This transformation is currently done by `DatabaseResumeContentFactory.makeFromSelection()` on the server
- We'll need a **client-side equivalent** that takes the already-loaded React state and produces `BrilliantCVContent`

Create `web/src/lib/resume-content-builder.ts`:

```typescript
import type { BrilliantCVContent } from '@tailoredin/core';
import type { Profile } from '@/hooks/use-profile';
import type { Experience } from '@/components/resume/experience/types';
import type { Education } from '@/hooks/use-education';

// Mirrors what DatabaseResumeContentFactory.makeFromSelection() does,
// but using the already-loaded React state instead of DB queries.
export function buildResumeContent(params: {
  profile: Profile;
  headlineText: string;
  experiences: Experience[];
  visibleBulletIds: Map<string, Set<string>>;
  educations: Education[];
  visibleEducationIds: Set<string>;
  // skillCategories / skillItems if needed
}): BrilliantCVContent {
  // Transform profile → BrilliantCVPersonal
  // Filter experiences by visibleBulletIds → BrilliantCVExperience[]
  // Filter educations by visibleEducationIds → BrilliantCVEducation[]
  // Build skills array → BrilliantCVSkill[]
  // Return full BrilliantCVContent
}
```

**Reference**: Check `infrastructure/src/services/DatabaseResumeContentFactory.ts` for the exact transformation logic to replicate. Key details:
- GitHub/LinkedIn handles are extracted from full URLs
- Experience dates are formatted as "Mon YYYY – Mon YYYY" or "Mon YYYY – Present"
- Skills items within a category are joined with ` #h-bar() ` separator
- Special characters are escaped for Typst/TOML

### Milestone 4: New Preview Component

**Goal**: Replace `PdfPreviewPanel` with a typst.ts-based component.

Create `web/src/components/resume/builder/TypstPreviewPanel.tsx`:

```typescript
import { TypstDocument } from '@myriaddreamin/typst.react';

type TypstPreviewPanelProps = {
  artifact: Uint8Array | null;
  isCompiling: boolean;
  error: string | null;
};

export function TypstPreviewPanel({ artifact, isCompiling, error }: TypstPreviewPanelProps) {
  // Same UI structure as PdfPreviewPanel:
  // - Header bar with page count + download button
  // - Scrollable content area
  // - Loading overlay when compiling
  // - Error state
  // - Empty state
  //
  // But instead of react-pdf <Document>/<Page>, use:
  //   <TypstDocument fill="#ffffff" artifact={artifact} />
  //
  // Download button: triggers POST /api/resumes/generate (server-side PDF)
  // since typst.ts doesn't produce PDF in-browser
}
```

### Milestone 5: Wire It All Together in builder.tsx

**Goal**: Update the builder page to use the new preview pipeline.

Changes to `web/src/routes/resume/builder.tsx`:

1. **Replace imports**:
   ```diff
   - import { usePdfPreview } from '@/hooks/use-pdf-preview';
   + import { useTypstPreview } from '@/hooks/use-typst-preview';
   ```

   ```diff
   - const PdfPreviewPanel = lazy(() =>
   -   import('@/components/resume/builder/PdfPreviewPanel').then(m => ({ default: m.PdfPreviewPanel }))
   - );
   + const TypstPreviewPanel = lazy(() =>
   +   import('@/components/resume/builder/TypstPreviewPanel').then(m => ({ default: m.TypstPreviewPanel }))
   + );
   ```

2. **Replace preview hook usage** (around line 131-143):
   ```diff
   - const pdfSelection = useMemo(() => { ... }, [activeArchetype]);
   - const { pdfData, isCompiling, error: pdfError } = usePdfPreview(pdfSelection);
   + const resumeContent = useMemo(() => {
   +   if (!activeArchetype || !profile) return null;
   +   return buildResumeContent({
   +     profile,
   +     headlineText: activeArchetype.headlineText,
   +     experiences,
   +     visibleBulletIds,
   +     educations,
   +     visibleEducationIds,
   +   });
   + }, [activeArchetype, profile, experiences, visibleBulletIds, educations, visibleEducationIds]);
   + const { artifact, isCompiling, error: previewError } = useTypstPreview(resumeContent);
   ```

3. **Replace component** (around line 406-415):
   ```diff
   - <PdfPreviewPanel pdfData={pdfData} isCompiling={isCompiling} error={pdfError} />
   + <TypstPreviewPanel artifact={artifact} isCompiling={isCompiling} error={previewError} />
   ```

4. **Keep the download handler** (`handleGenerate` at line 280) — it still calls `POST /api/resumes/generate` server-side.

### Milestone 6: Cleanup

1. **Delete** `web/src/hooks/use-pdf-preview.ts`
2. **Delete** `web/src/components/resume/builder/PdfPreviewPanel.tsx`
3. **Delete** `api/src/routes/PreviewResumeRoute.ts`
4. **Remove** PreviewResumeRoute from `api/src/index.ts` route registration
5. **Remove** PreviewResumeRoute from `api/src/container.ts` if it's bound there
6. **Remove** `react-pdf` and `pdfjs-dist` from `web/package.json`:
   ```bash
   cd web && bun remove react-pdf pdfjs-dist
   ```
7. **Remove** the test route from Milestone 0 (`web/src/routes/resume/typst-test.tsx`)
8. Run full checks:
   ```bash
   bun run check
   bun run --cwd web typecheck
   bun run --cwd api typecheck
   bun run --cwd infrastructure typecheck
   bun run knip
   bun run dep:check
   ```

---

## Open Questions & Risks

### 1. BrilliantCV Package Resolution (HIGH RISK)
The template imports `@preview/brilliant-cv:3.3.0`. The WASM compiler needs to resolve this. Options:
- **Pre-bundle**: Download package source, serve from `web/public/`, mount in virtual FS
- **Custom resolver**: Configure typst.ts to fetch from Typst package registry
- **Inline**: Replace `@preview/` import with local file paths

**Mitigation**: Milestone 0 (spike) validates this before any real work begins.

### 2. Font Availability (MEDIUM RISK)
The template uses `Source Sans 3` (regular) and `Raleway` (header). The WASM compiler needs these fonts.
- Check if typst.ts can use system fonts or web fonts
- May need to bundle `.ttf`/`.otf` files and mount them in the virtual FS
- Already using `@fontsource-variable/geist` in the web app, so font bundling is a known pattern

### 3. WASM Bundle Size (LOW RISK)
- Renderer: ~1 MB WASM
- Compiler: likely 5-10 MB WASM
- **Mitigation**: Lazy-load both — only fetch WASM when user visits the builder page. The `PdfPreviewPanel` is already lazy-loaded, so this pattern exists.

### 4. typst.ts API Stability (LOW-MEDIUM RISK)
- Currently v0.7.0-rc2 — APIs may change
- **Mitigation**: Isolate all typst.ts usage behind `typst-compiler.ts` abstraction. If APIs change, only one file needs updating.

### 5. SVG vs PDF Visual Fidelity (LOW RISK)
- typst.ts uses the same Typst engine, just renders to SVG instead of PDF
- Should be pixel-perfect, but worth a visual comparison during the spike

### 6. Content Transformation Drift (LOW RISK)
- `buildResumeContent()` (client) and `DatabaseResumeContentFactory.makeFromSelection()` (server) both produce `BrilliantCVContent`
- If one changes without the other, preview won't match download
- **Mitigation**: Both use the same `BrilliantCVContent` type from `core/`. Could add a visual regression check.

---

## Verification Plan

| Milestone | Verification |
|---|---|
| **0 (Spike)** | BrilliantCV template compiles and renders in browser. Visual output matches expectation. |
| **1 (Shared builder)** | `bun run check`, `bun run --cwd infrastructure typecheck`, `bun run knip`. Server-side preview/generate still works (no regression). |
| **2 (WASM service)** | Compiler initializes without errors. Can compile a simple document. |
| **3 (Preview hook)** | Content selection changes trigger local recompilation. Debounce works. Abort on unmount. |
| **4 (Preview component)** | Renders compiled output. Shows loading/error/empty states correctly. Download button works (calls server). |
| **5 (Integration)** | Full flow: change bullet visibility → preview updates in <500ms. Visual comparison: typst.ts preview matches the previous react-pdf preview. |
| **6 (Cleanup)** | All checks pass. No dead code. PreviewResumeRoute removed. `react-pdf` gone from deps. |

### Manual Testing Checklist
- [ ] Open resume builder → preview loads for default archetype
- [ ] Toggle a bullet on/off → preview updates within ~500ms
- [ ] Edit headline → preview updates
- [ ] Switch archetypes → preview updates to new selection
- [ ] Empty selection (no experiences, no education) → empty state shown
- [ ] Click Download → PDF downloads via server-side generation
- [ ] Multi-page resume → all pages render, scrollable
- [ ] Refresh page → WASM compiler reinitializes, preview works
- [ ] Compare typst.ts preview with old react-pdf preview → layouts match
