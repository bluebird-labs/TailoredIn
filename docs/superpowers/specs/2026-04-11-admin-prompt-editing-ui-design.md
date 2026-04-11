# Admin Prompt Editing UI

## Context

The composable resume generation pipeline (implemented in `worktree-dazzling-twirling-seal`) models prompts as typed sections composed into scope recipes. Currently, the section templates are hardcoded in infrastructure classes. This spec adds a Settings UI that lets the admin (single user for now, role-gated later) view and edit the prompt sections that drive resume generation.

## Goals

- Surface the prompt section templates in the Settings page as editable admin controls
- Support two views: composable blocks (toggle/reorder sections per scope) and raw editor (full composed prompt as text)
- Persist custom section templates so they survive server restarts
- Scope to admin role for future multi-user support

## Design

### Settings Page — New "Generation Prompts" Tab

Add a tab to `/settings` alongside existing generation settings (model tier, bullet range). The tab has two sub-views:

**1. Blocks View (default)**

Shows each scope recipe (HEADLINE, EXPERIENCE, EXPERIENCE_SUMMARY, BULLET) as a collapsible group. Within each group, lists the composed sections in order:

```
[HEADLINE]
  ✓ Rules               (system-stable)     [View] [Edit]
  ✓ Output Constraints   (system-stable)     [View] [Edit]
  ✓ Profile              (profile-stable)    [View]
  ✓ Tone                 (profile-stable)    [View]
  ✓ Education            (profile-stable)    [View]
  ✓ Settings             (session-stable)    [View] [Edit]
  ✓ Job Description      (request-variable)  [View]
  ✓ Other Experiences    (request-variable)  [View]
  ✓ User Instructions    (request-variable)  [View]
```

- Sections with `[View]` only show their rendered output (read-only, data-driven)
- Sections with `[Edit]` have editable templates: Rules, Output Constraints, Settings (admin prompts)
- Each section shows its cache tier as a colored badge
- Sections can be toggled on/off per scope (disabled sections are skipped during composition)
- Drag-to-reorder sections within a scope (within the same cache tier — can't move a REQUEST_VARIABLE section before a SYSTEM_STABLE one)

**2. Raw Editor View**

A full-text editor showing the composed prompt for a selected scope. This is the output of `ScopeRecipe.compose()` rendered as a single string with tier separators. Edits here override the block composition for that scope.

Toggle between views with a segmented control at the top.

### Data Model

Custom section overrides are persisted as `GenerationPrompt` entities (already exist in the domain — `GenerationSettings` has a `prompts` collection of `GenerationPrompt` entities with `scope` and `content`).

Extend `GenerationPrompt` to also support section-level overrides:

```typescript
// Existing
type GenerationPrompt = {
  scope: GenerationScope;    // RESUME, HEADLINE, EXPERIENCE
  content: string;           // admin prompt text
};

// Extended — add optional sectionName for section-level overrides
type GenerationPrompt = {
  scope: GenerationScope;
  sectionName: string | null; // null = scope-level admin prompt (existing), non-null = section template override
  content: string;
};
```

When `sectionName` is set, the content replaces the default template for that section in that scope's recipe. When null, it's the existing admin prompt behavior (appended via `SettingsSection`).

### API Endpoints

```
GET  /settings/generation/prompts
  → { sections: [{ name, cacheTier, defaultTemplate, customTemplate?, scopes[] }] }

PUT  /settings/generation/prompts/:sectionName
  → { content: string } — override a section's template

DELETE /settings/generation/prompts/:sectionName
  → revert to default template

GET  /settings/generation/preview/:scope
  → { composedPrompt: string } — preview the full composed prompt for a scope
```

### Frontend Components

| Component | Location | Purpose |
|---|---|---|
| `GenerationPromptsTab` | `web/src/components/settings/` | Tab container with blocks/raw toggle |
| `ScopeRecipeEditor` | `web/src/components/settings/` | Collapsible scope group showing its sections |
| `SectionCard` | `web/src/components/settings/` | Individual section: badge, view/edit, toggle |
| `SectionTemplateEditor` | `web/src/components/settings/` | Modal or inline textarea for editing a section template |
| `RawPromptEditor` | `web/src/components/settings/` | Full-text editor for composed prompt preview/override |

### What Changes in the Pipeline

The `PromptRegistry` currently receives statically constructed `ScopeRecipe` instances from the container. To support custom templates:

1. `PromptSection.render()` checks for a custom template override before using the default
2. Section overrides are loaded from `GenerationSettings.prompts` during `GenerationContextBuilder.build()`
3. The `SettingsSnapshot` carries section overrides: `sectionOverrides: Map<string, string>`
4. Each section's `render()` checks `context.settings.sectionOverrides.get(this.name)` — if present, uses the override content instead of the hardcoded template

### Access Control

- Currently: all users see the tab (single-user app)
- Future: gate behind an `isAdmin` flag on the profile, hide the tab for non-admins
- The API endpoints should check admin role when multi-user is added

## Files

### New
- `web/src/components/settings/GenerationPromptsTab.tsx`
- `web/src/components/settings/ScopeRecipeEditor.tsx`
- `web/src/components/settings/SectionCard.tsx`
- `web/src/components/settings/SectionTemplateEditor.tsx`
- `web/src/components/settings/RawPromptEditor.tsx`
- `application/src/use-cases/settings/GetGenerationPrompts.ts`
- `application/src/use-cases/settings/UpdateSectionOverride.ts`
- `application/src/use-cases/settings/DeleteSectionOverride.ts`
- `application/src/use-cases/settings/PreviewComposedPrompt.ts`
- `api/src/routes/settings/GenerationPromptsRoutes.ts`

### Modified
- `domain/src/entities/GenerationPrompt.ts` — add nullable `sectionName` field
- `domain/src/value-objects/GenerationContext.ts` — add `sectionOverrides` to `SettingsSnapshot`
- `application/src/services/GenerationContextBuilder.ts` — load section overrides
- `infrastructure/src/services/prompt-sections/*.ts` — check for overrides in `render()`
- `web/src/routes/settings.tsx` — add new tab
- Migration for `sectionName` column on `generation_prompts`

## Verification

1. Open Settings > Generation Prompts tab
2. View sections for each scope — verify correct section list and cache tier badges
3. Edit the Rules section template — verify the change persists and is used in next generation
4. Preview the composed prompt for HEADLINE scope — verify it reflects the custom template
5. Revert the Rules section — verify it goes back to the default
6. Generate a resume — verify custom templates are used
7. Toggle a section off for a scope — verify it's excluded from generation
