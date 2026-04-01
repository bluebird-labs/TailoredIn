# Spec: Visual Polish Pass — Resume PDF Output

**Date:** 2026-04-01
**Status:** Draft
**Prerequisites:** Pipeline Correctness (Plan 1), Archetype-Specific Templates (Plan 2)

## 1. Context

TailoredIn generates PDF resumes via Typst using the `brilliant-cv` v3.3.0 package. The current `metadata.toml` sets all spacing values to `"1pt"` (essentially zero), uses `Source Sans 3` as the body font and `Roboto` as the header font, and passes company brand color as `awesome_color`. This spec defines the refinements needed to produce resumes meeting engineering leadership hiring standards.

## 2. Typography

### Current State
- Body font: `Source Sans 3` (brilliant-cv default)
- Header font: `Roboto`
- Font size: not explicitly set — brilliant-cv defaults to `9pt`

### Recommendations

**Keep Source Sans 3 as body font.** Highly legible at small sizes, professional, widely available, ATS-parseable. Has proper weight variants (light through black).

**Keep Roboto as header font.** Pairs well with Source Sans 3 — similar x-height, different enough personality. Header already uses light for first name, bold for last name.

**Set explicit `font_size` to `"10pt"`.** The default 9pt is slightly small for US-letter with current margins. 10pt improves readability without significantly impacting content fit.

### Visual Hierarchy (brilliant-cv built-in)

| Element | Font | Size | Weight |
|---|---|---|---|
| First name | Roboto | 32pt | light |
| Last name | Roboto | 32pt | bold |
| Contact info | Source Sans 3 | 10pt | regular, accent color |
| Headline | Source Sans 3 | 10pt | medium, italic, accent |
| Section title | Source Sans 3 | 16pt | bold, accent highlight |
| Company name | Source Sans 3 | 10pt | bold |
| Job title | Source Sans 3 | 8pt | medium, smallcaps, accent |
| Bullets | Source Sans 3 | base | regular, lightgray |

No changes needed to the hierarchy — brilliant-cv's built-in styles are well-established.

## 3. Spacing and Rhythm

### Current State

All three spacing values are `"1pt"` — extremely compressed, sections run together.

### Recommended Defaults

| Parameter | Current | Recommended | Rationale |
|---|---|---|---|
| `before_section_skip` | `"1pt"` | `"6pt"` | Visual separation between sections |
| `before_entry_skip` | `"1pt"` | `"4pt"` | Clear gap between job entries |
| `before_entry_description_skip` | `"1pt"` | `"2pt"` | Tight coupling of bullets to entry header |

These are the base values. Plan 2 (archetype templates) will override them per template style — IC uses tighter spacing, EXECUTIVE uses more generous spacing.

### Inter-Section Spacers (if TOML alone is insufficient)

Add explicit `#v()` calls in `buildCvTyp()` between `#include` directives:

```typst
#include "modules_en/professional.typ"
#v(2pt)
#include "modules_en/skills.typ"
#v(2pt)
#include "modules_en/education.typ"
```

## 4. Brand Color Integration

### Current Pipeline

1. `PlaywrightWebColorService.findPrimaryColor()` screenshots company website, extracts palette via node-vibrant
2. Filters out grayish colors and those failing WCAG large-text contrast (3.5:1) against white
3. Returns first match in priority: Vibrant, DarkVibrant, LightVibrant
4. Passed as `awesome_color` in `metadata.toml`

### Where the Color Appears (brilliant-cv)

- Header contact info (email, phone, GitHub, LinkedIn, location)
- Header headline (italic summary)
- Section titles (first 3 characters accent-highlighted)
- Entry date column (oblique)
- Entry subtitle / job title (smallcaps)

These application points are well-chosen. No changes needed to where color appears.

### Color Contrast Hardening

**Enhancement:** Tighten from WCAG large-text (3.5:1) to WCAG normal-text (4.5:1) for the smaller accent-colored elements (8pt subtitle, 10pt contact info).

**Fallback cascade:**
1. Try Vibrant → DarkVibrant → LightVibrant (current)
2. Add DarkMuted, Muted as additional candidates
3. If nothing passes 4.5:1, fall back to `#0395DE` (brilliant-cv skyblue)

**Optional utility:** `ColorUtil.darkenForContrast(rgb, backgroundRgb, targetRatio)` — incrementally darken a color to preserve brand hue while meeting contrast.

### What to Avoid

- Do not apply color to body text / bullets (must remain `#343a40`)
- Do not use color for backgrounds or fills (breaks ATS, looks cheap)
- Do not use more than one accent color

## 5. Page-Fit Validation

### Content Budget Estimates (at 10pt, US-letter)

| Element | Estimated Height |
|---|---|
| Usable page height | ~24.5cm |
| Header block | ~3.5cm |
| Section title + rule | ~0.8cm |
| Experience entry header | ~0.6cm |
| Bullet point (single line) | ~0.4cm |
| Skill row | ~0.4cm |
| Education entry | ~0.6cm |

### Compilation Smoke Tests

For each archetype template style, compile a PDF and assert:
1. Compiles without Typst errors/warnings
2. Output is 1-2 pages
3. All section headings present in extracted text

### Content Volume Test Matrix

| Fixture | Entries | Bullets | Expected Pages |
|---|---|---|---|
| `light-profile` | 3 entries, 2 bullets each | 6 total | 1 page |
| `standard-profile` | 5 entries, 3 bullets each | 15 total | 1-2 pages |
| `heavy-profile` | 8 entries, 2-5 bullets each | ~27 total | 2 pages |

### Overflow Prevention

- Archetype content selection controls which entries are included (user's tool)
- `maxBulletsPerEntry` per template style caps bullet density (Plan 2)
- Post-compilation warning if pages > 2 (informational, not blocking)
- No scaling tricks — they break ATS parsing

## 6. ATS Compatibility

### Already ATS-Safe

- Typst outputs PDF with selectable text (not images)
- Standard section headings ("Professional Experience", "Skills", "Education")
- Single-flow layout (date in side column, content flows linearly)
- Keyword injection as 2pt white text (invisible, ATS-parseable)

### Verification Steps

1. Run generated PDF through a free ATS parser (Jobscan, Resume Worded) to verify section detection
2. Copy-paste all text — verify complete and in reading order
3. Verify keyword injection text appears in copy-paste output
4. Check with `pdffonts` that Source Sans 3 and Roboto are embedded (not referenced)

## 7. Verification Approach

### Test Matrix

| Dimension | Values |
|---|---|
| Content volume | light (3 entries), standard (5 entries), heavy (8 entries) |
| Brand color | bright vibrant (`#FF4500`), dark corporate (`#1B365D`), null/fallback |
| Template style | IC, ARCHITECT, EXECUTIVE |

9 combinations initially (3 volumes x 3 colors). Multiply by 3 template styles = 27 once Plan 2 is complete.

### Automated Checks

1. **Compilation**: Every combination compiles without errors
2. **Page count**: Every combination produces 1-2 pages
3. **Text extraction**: All section headings present
4. **Snapshot testing**: PDF → PNG via `typst compile --format png`, store as reference snapshots

### Visual Review

For initial implementation, manually review all generated PDFs for:
- Spacing balance
- Color integration
- No orphaned sections
- Consistent alignment
- Professional appearance at a glance

## 8. Files to Modify

| File | Change |
|---|---|
| `infrastructure/src/resume/TypstFileGenerator.ts` | Update spacing defaults, add `font_size`, add optional `#v()` spacers |
| `infrastructure/src/services/PlaywrightWebColorService.ts` | Tighten contrast from 3.5:1 → 4.5:1, add fallback palette keys |
| `core/src/ColorUtil.ts` | Add `darkenForContrast()` utility (optional) |
| `infrastructure/test/resume/visual-polish.test.ts` | **New** — compilation smoke tests, page count assertions, snapshot generation |

## 9. Implementation Sequence

1. **Spacing tuning** — Update `buildMetadataToml()` with recommended spacing values and explicit `font_size`
2. **Color contrast hardening** — Tighten `PlaywrightWebColorService`, add fallback cascade
3. **Page-fit validation** — Add compilation smoke tests and page count assertions
4. **Visual snapshot baseline** — Generate reference PNGs for the test matrix
5. **Inter-section spacing** (optional) — Add `#v()` calls if TOML spacing alone is insufficient
