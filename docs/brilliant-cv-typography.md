# BrilliantCV Typography Catalog

All elements use **IBM Plex Sans** (overriding the package defaults of Source Sans 3 / Roboto), set via `metadata.toml` `[layout.fonts]`.

## Base Text Settings

| Property | Value | Set by |
|---|---|---|
| Font | IBM Plex Sans | `metadata.toml` → `lib.typ:54` |
| Weight | regular | `lib.typ:54` |
| Base size | 9pt (package default, not overridden in metadata) | `lib.typ:50-53` |
| Body size | **10pt** (overrides base for body content only) | `cv.typ:4` via `cfg-body-font-size` |
| Paragraph leading | 0.65em | `cv.typ:5` via `cfg-leading` |
| Base fill | `#343a40` (lightgray) | `lib.typ:54` via `_regular-colors.lightgray` |

## Header Elements

| Element | Size | Weight | Style | Fill | Source |
|---|---|---|---|---|---|
| **First name** | 32pt | light | normal | `#212529` (darkgray) | `cv.typ:18` `_header-styles` |
| **Last name** | 32pt | bold | normal | inherited (`#343a40`) | `cv.typ:23` `_header-styles` |
| **Info line** (email, phone, linkedin, etc.) | **8pt** | regular | normal | accent `#1A1A1A` | `metadata.toml` `info_font_size = "8pt"` → `cv.typ:24` |
| **Info icons** (GH, ✉, in, ☎, ⌂) | **7pt** | regular | normal | inherited from info | `cv.typ:9-13` custom-icons |
| **h-bar separator** (`\|`) | inherited from info (8pt) | inherited | normal | inherited from info | `styles.typ:2` |
| **Headline / quote** | **10pt** | medium | **italic** | accent `#1A1A1A` | `cv.typ:25` `_header-styles` |

## Section Headers (custom `cv-section` in `helpers.typ`)

| Element | Size | Weight | Style | Fill | Source |
|---|---|---|---|---|---|
| **Section title** ("Experience", "Education") | **16pt** | bold | normal | inherited (`#343a40`) | `helpers.typ:12` |
| **Divider line** | 0.9pt stroke | — | — | accent `#3E6B8A` | `helpers.typ:14` |
| **Section skip (above)** | 4pt | — | — | — | `helpers.typ:4` `_section-skip` |

## Experience / Education Entries

`cv-entry` with `display_entry_society_first = true`: **society = company name** appears first (bold), **title = job title** appears second (subtitle).

| Element | Size | Weight | Style | Fill | Source |
|---|---|---|---|---|---|
| **Company name** (a1 = society, top-left) | 10pt | bold | normal | inherited (`#343a40`) | `cv.typ:363` `_entry-styles.a1` |
| **Location** (a2, top-right) | inherited (10pt) | medium | **oblique** | accent `#1A1A1A` | `cv.typ:364` `_entry-styles.a2` |
| **Job title** (b1 = title, bottom-left) | **8pt** | medium | normal, **smallcaps** | accent `#1A1A1A` | `cv.typ:365` `_entry-styles.b1` |
| **Date range** (b2, bottom-right) | **8pt** | medium | **oblique** | `gray` (Typst built-in) | `cv.typ:366` `_entry-styles.b2` |
| **Experience summary** (italic line before bullets) | inherited (10pt) | regular | **italic** | inherited (`#343a40`) | `typst-generators.ts:118` `_text_` markup |
| **Bullet points** (description list items) | inherited (10pt) | regular | normal | `#343a40` (lightgray) | `cv.typ:371-377` `_entry-styles.description` |
| **Entry tags** (if used) | 8pt | regular | normal | inherited, bg: `#ededee` | `cv.typ:378` `_entry-styles.tag` |

## Skills Section

| Element | Size | Weight | Style | Fill | Source |
|---|---|---|---|---|---|
| **Skill type** (left column, 17% width) | 10pt | bold | normal | inherited | `cv.typ:746` `cv-skill` |
| **Skill info** (right column) | inherited (10pt) | regular | normal | inherited | `cv.typ:749` `cv-skill` |

## Spacing

| Property | Value | Source |
|---|---|---|
| Page margins | 1.1cm all sides | `cfg-margin` from `ResumeTemplate` defaults |
| Section spacing (`before_section_skip`) | 2pt | `metadata.toml` via `template.sectionSpacingPt` |
| Entry spacing (`before_entry_skip`) | 2pt | `metadata.toml` via `template.entrySpacingPt` |
| Entry description spacing | 1pt | `metadata.toml` (floor of entrySpacing/2) |
| Entry row gutter | 6pt | `cv.typ:431` hardcoded in `_make-cv-entry` |
| Page size | us-letter | `metadata.toml` via `template.pageSize` |

## Colors Summary

| Name | Hex | Used for |
|---|---|---|
| `awesome_color` (accent in metadata) | `#1A1A1A` | Info line, headline, job title (b1), location (a2) |
| `_accent` (helpers.typ) | `#3E6B8A` | Section header divider line only |
| `lightgray` | `#343a40` | Base text, bullet points, company name |
| `darkgray` | `#212529` | First name |
| `gray` | Typst built-in | Date range (b2) |
| `subtlegray` | `#ededee` | Tag backgrounds |
