# Skills Page Design

## Context

TailoredIn has a skills taxonomy (~2000 skills across 10 categories) that is currently only accessible through the SkillPicker in experience editing. Users need a way to browse and discover the full skills directory. This spec describes a read-only Skills page accessible from the left nav sidebar.

## Layout

Two-panel layout with a global search bar above:

- **Search bar** — full-width at the top. Filters skills client-side across all categories.
- **Left sidebar** — vertical list of "All" + one entry per SkillCategory, each with a count of matching skills. When a search query is active, categories with zero matches are hidden.
- **Right content** — skills displayed as pill/chip tags, grouped by category header. In "All" view, all categories are shown. When a specific category is selected, only that category's skills appear.

### Search behavior

- On the "All" tab, search filters the displayed skills and hides empty categories from both the sidebar and content area.
- On a specific category tab, search filters within that category only.
- Clearing the search restores the full list.
- Client-side filtering (case-insensitive substring match on label). No server round-trips on keystroke.

### Navigation

- New entry in the Workroom sidebar group: "Skills" with a `Sparkles` icon, positioned between Profile and Atelier.
- Route: `/skills`

## Data loading

All skills are loaded in a single API call on page mount. The taxonomy is finite (<2000 skills, ~200KB payload) so client-side filtering provides instant feedback without debounce complexity.

### New API endpoint

`GET /skills/all` — returns all skills with their categories.

- Response: `{ data: SkillDto[] }`
- No query parameters.
- Backed by a new `ListSkills` use case that calls `SkillRepository.findAll()` and batch-resolves categories.

The existing `GET /skills?q=...` search endpoint is unchanged (still used by SkillPicker).

## Component hierarchy

```
SkillsPage (route component)
├── Search input
└── Two-column flex layout
    ├── SkillCategorySidebar
    │   ├── "All" entry (total count)
    │   └── Category entries (filtered count each, hidden when 0 during search)
    └── SkillsContent
        └── SkillCategoryGroup[] (one per visible category)
            ├── Category label heading
            └── Skill chips (pill badges)
```

## Layer changes

### Application layer

- New `ListSkills` use case in `application/src/use-cases/skill/ListSkills.ts`
- Same dependencies as `SearchSkills`: `SkillRepository` + `SkillCategoryRepository`
- Returns `SkillDto[]` with resolved categories

### Infrastructure layer

- New DI token `DI.Skill.List` in `infrastructure/src/DI.ts`

### API layer

- New `ListSkillsRoute` at `api/src/routes/skill/ListSkillsRoute.ts` — `GET /skills/all`
- Container binding in `api/src/container.ts`
- Mount in `api/src/index.ts`

### Web layer

- New query keys: `skills.list()` and `skills.categories()`
- New hooks: `useAllSkills()` and `useSkillCategories()` in `web/src/hooks/use-skills.ts`
- New route file: `web/src/routes/skills/index.tsx`
- New components in `web/src/components/skills/`:
  - `SkillCategorySidebar.tsx`
  - `SkillCategoryGroup.tsx`
  - `SkillsContent.tsx`
- Modified: `web/src/components/layout/sidebar.tsx` — add Skills nav item

## UI rules (per design system)

- No bold/semibold — max `font-medium` (500)
- Borders not shadows
- Skills as pill chips with border and muted background
- Typography: h1=22px/medium for page heading, h3=15px/medium for category group headings
