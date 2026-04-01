# Session Instructions: P3 — Visual Polish

## Prerequisites

**Do not start this session until P1 and P2 are both merged to main.**

Before creating the worktree, run the integration checkpoint on main:

```bash
bun run check && bun run knip
```

Generate test PDFs for each archetype and visually confirm:
- Content uses selected bullet variants (P1 working)
- Layout differs per archetype style (P2 working)

## Setup

```bash
git worktree add .claude/worktrees/visual-polish -b feat/visual-polish
```

Do ALL work inside `.claude/worktrees/visual-polish`.

## Required Reading

1. `CLAUDE.md` — architecture, conventions, commands
2. `GOALS.md` — the "Now" section defines the product goal
3. `docs/superpowers/specs/2026-04-01-visual-polish.md` — your detailed spec
4. `docs/superpowers/specs/2026-04-01-resume-tailoring-coordination.md` — how this fits with the other plans

## Problem

After P1 (correct content) and P2 (archetype layouts), the resumes need a refinement pass: tighter color contrast for accessibility, page-fit validation across content volumes, and a test infrastructure to catch visual regressions.

## What to Build

### 1. Color Contrast Hardening

**Modify** `infrastructure/src/services/PlaywrightWebColorService.ts`:
- Tighten contrast check from WCAG large-text (3.5:1) to WCAG normal-text (4.5:1) — the accent color is used on 8pt and 10pt text, which requires the stricter ratio
- Add `DarkMuted` and `Muted` as fallback palette candidates after Vibrant/DarkVibrant/LightVibrant
- When no color passes, return `null`

**Modify** the caller (in `GenerateResume` or `DatabaseResumeContentFactory`) to default to `#0395DE` (brilliant-cv skyblue) when color is null.

**Optional**: Add `ColorUtil.darkenForContrast(rgb, backgroundRgb, targetRatio)` to `core/src/ColorUtil.ts` — incrementally darken a color until it meets a contrast ratio, preserving hue.

### 2. Spacing Tuning Verification

P2 set archetype-specific spacing via `templateLayouts.ts`. Verify the values produce good output:
- Generate PDFs for IC, ARCHITECT, EXECUTIVE with real-ish content
- If any layout looks off (too tight, too loose, orphaned sections), adjust the values in `templateLayouts.ts`
- If `metadata.toml` spacing alone is insufficient, add explicit `#v()` calls in `TypstFileGenerator.buildCvTyp()` between section includes

### 3. Page-Fit Validation Tests

**Create** `infrastructure/test/resume/visual-polish.test.ts`:

Test matrix — 3 content volumes x 3 brand colors x 3 template styles:

| Content Volume | Entries | Bullets |
|---|---|---|
| light | 3 entries, 2 bullets each | 6 total |
| standard | 5 entries, 3 bullets each | 15 total |
| heavy | 8 entries, 2-5 bullets each | ~27 total |

| Brand Color | Hex |
|---|---|
| Bright vibrant | `#FF4500` |
| Dark corporate | `#1B365D` |
| Null (fallback) | `#0395DE` |

For each combination, assert:
- Typst compiles without errors
- Output is 1-2 pages (EXECUTIVE style: 1 page for light/standard)
- All section headings present in extracted text

### 4. Visual Snapshot Baseline

Generate PNG snapshots via `typst compile --format png` for reference. Store in `infrastructure/test/resume/__snapshots__/`. These serve as a visual regression baseline for future changes.

## Key Files

| File | Action |
|---|---|
| `infrastructure/src/services/PlaywrightWebColorService.ts` | **Modify** — tighten contrast, add fallbacks |
| `core/src/ColorUtil.ts` | **Modify** (optional) — add `darkenForContrast()` |
| `infrastructure/src/resume/templateLayouts.ts` | **Tune** values if needed after visual inspection |
| `infrastructure/src/resume/TypstFileGenerator.ts` | **Modify** if inter-section `#v()` spacers needed |
| `infrastructure/test/resume/visual-polish.test.ts` | **Create** — compilation + page-fit tests |

## Important Notes

- Do NOT change font selections — Source Sans 3 (body) and Roboto (header) are intentional choices
- Do NOT apply accent color to bullet text — must remain `#343a40` (lightgray)
- Do NOT use backgrounds, fills, or scaling tricks — they break ATS parsing
- All relative imports must use `.js` extensions (NodeNext resolution)

## Completion Checklist

- [ ] Color contrast uses 4.5:1 ratio (WCAG normal-text)
- [ ] Fallback cascade includes DarkMuted/Muted
- [ ] Null color defaults to `#0395DE`
- [ ] Page-fit tests pass across the full test matrix
- [ ] Spacing values produce clean output (verified visually)
- [ ] PNG snapshots generated as baseline
- [ ] `bun run check` — clean
- [ ] `bun run knip` — no dead code
- [ ] Run `/land` to rebase, PR, and merge
