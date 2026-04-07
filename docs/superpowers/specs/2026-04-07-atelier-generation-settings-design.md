# Atelier & Generation Settings

## Context

Resume generation currently uses hardcoded defaults: `claude-opus-4-6` model, bullet range of 2–20, and a single prompt template loaded from a markdown file. Users have no control over these parameters. The only customization is an ephemeral "additional prompt" textarea per generation on the job detail page.

This design introduces **per-profile generation settings** and consolidates resume tailoring into a new **Atelier** page — a three-column workspace that replaces the job detail page's Resume tab as the primary resume crafting interface.

## Data Model

### New Tables

```
generation_settings
├── id (UUID, PK)
├── profile_id (FK → profiles, UNIQUE)
├── model_tier (enum: 'fast' | 'balanced' | 'best')
├── bullet_min (int, default 2)
├── bullet_max (int, default 5)
├── created_at
└── updated_at

generation_prompts
├── id (UUID, PK)
├── generation_settings_id (FK → generation_settings)
├── scope (enum: 'resume' | 'headline' | 'experience')
├── content (text)
├── created_at
└── updated_at
UNIQUE(generation_settings_id, scope)

experience_generation_overrides
├── id (UUID, PK)
├── experience_id (FK → experiences, UNIQUE)
├── bullet_min (int)
├── bullet_max (int)
├── created_at
└── updated_at
```

### Design Decisions

- **No JSONB** — all settings are relational columns.
- **`generation_prompts`** is a separate table (not 4 text columns on `generation_settings`) for clean per-scope querying and avoiding wide rows of mostly-null text.
- **`experience_generation_overrides`** is sparse — rows only exist when the user explicitly sets an override. Experiences without overrides use the profile defaults from `generation_settings`.
- **Cascade deletes**: deleting an experience cascades the override row. Deleting a profile cascades `generation_settings` and its `generation_prompts`.
- **`generation_settings`** is created when a profile is created, seeded with system defaults.

### Model Tier Mapping (in code)

| Tier | Model ID |
|------|----------|
| `fast` | `claude-haiku-4-5` |
| `balanced` | `claude-sonnet-4-6` |
| `best` | `claude-opus-4-6` |

The UI presents tiers by description (Fast / Balanced / Best), never by model name. The backend resolves to a concrete model. This allows swapping models without user-visible changes.

### Enums

- **`ModelTier`**: `Fast`, `Balanced`, `Best`
- **`GenerationScope`**: `Resume`, `Headline`, `Experience`

## Domain Layer

### New Aggregate: `GenerationSettings`

Owned by Profile (1:1). Created when a profile is created.

**Fields:**
- `id: GenerationSettingsId`
- `profileId: string`
- `modelTier: ModelTier`
- `bulletMin: number`
- `bulletMax: number`
- `prompts: GenerationPrompt[]`
- `createdAt: Date`
- `updatedAt: Date`

**Methods:**
- `updateModelTier(tier: ModelTier): void`
- `updateBulletRange(min: number, max: number): void`
- `setPrompt(scope: GenerationScope, content: string): void`
- `removePrompt(scope: GenerationScope): void`
- `getPrompt(scope: GenerationScope): string | null`

### New Entity: `GenerationPrompt` (child of GenerationSettings)

**Fields:**
- `id: GenerationPromptId`
- `scope: GenerationScope`
- `content: string`
- `createdAt: Date`
- `updatedAt: Date`

### New Entity: `ExperienceGenerationOverride` (child of Experience)

**Fields:**
- `id: ExperienceGenerationOverrideId`
- `experienceId: string`
- `bulletMin: number`
- `bulletMax: number`
- `createdAt: Date`
- `updatedAt: Date`

## Prompt Composition

At generation time, the effective prompt is composed by layering:

| Generation Scope | Prompt Composition |
|---|---|
| **Full resume** | `resume prompt` + per-job additional prompt |
| **Headline only** | `resume prompt` + `headline prompt` + per-job additional prompt |
| **Experience only** | `resume prompt` + `experience prompt` + per-job additional prompt |

The `resume` scope prompt acts as the base — always included. Scope-specific prompts layer on top for narrow regenerations. If a prompt for a given scope is not set (no `generation_prompts` row exists), that layer is simply omitted — no empty string injected.

The per-job additional prompt is **ephemeral** — sent in the `POST /resume/generate` request body (as it is today), never persisted to the database.

## Bullet Range Resolution

For each experience at generation time:

1. Check `experience_generation_overrides` for the experience
2. If override exists → use its `bullet_min` / `bullet_max`
3. If no override → use profile's `generation_settings.bullet_min` / `generation_settings.bullet_max`

## Atelier Page

### Route

`/atelier` — new top-level route replacing the job detail page's Resume tab as the resume crafting workspace.

### Layout: Three-Column

```
┌─────────────────┬────────────────────────────────────┬──────────────────┐
│  Settings       │  Tailoring Content                 │  PDF Preview     │
│  (~280px fixed) │  (flex)                            │  (~35% fixed)    │
│                 │                                    │                  │
│  Model Tier     │  Job Selector (combobox)            │  Theme Selector  │
│  [Fast|Bal|Best]│  ┌──────────────────────────────┐  │  [Generate PDF]  │
│                 │  │ + Additional prompt...        │  │                  │
│  Bullet Range   │  │ [Generate Resume]             │  │  ┌────────────┐ │
│  Min [3] Max [5]│  └──────────────────────────────┘  │  │            │ │
│                 │                                    │  │   PDF       │ │
│  Prompts        │  Headline Card                     │  │   iframe    │ │
│  ▾ Resume       │  ┌──────────────────────────────┐  │  │            │ │
│    [textarea]   │  │ "Full-stack engineer..."  ↻  │  │  │            │ │
│  ▸ Headline     │  └──────────────────────────────┘  │  │            │ │
│  ▸ Experience   │                                    │  │            │ │
│                 │  Experience Card          3-5 ↻    │  │            │ │
│                 │  ┌──────────────────────────────┐  │  │            │ │
│  [Discard][Save]│  │ 👁 Bullet 1                  │  │  │            │ │
│                 │  │ 👁 Bullet 2                  │  │  └────────────┘ │
│                 │  │ 👁 Bullet 3 (hidden)         │  │  [⤢ Expand]     │
│                 │  └──────────────────────────────┘  │                  │
│                 │                                    │                  │
│                 │  Education                         │                  │
│                 │  👁 B.S. Computer Science — MIT    │                  │
└─────────────────┴────────────────────────────────────┴──────────────────┘
```

### Left Column — Settings

- **Model Tier**: segmented control (Fast / Balanced / Best)
- **Default Bullet Range**: two number inputs (min / max)
- **Prompts**: accordion with 3 collapsible sections (Resume, Headline, Experience) — each expands to a textarea
- **Save/Discard** buttons at bottom — persists to `generation_settings` and `generation_prompts`
- Uses click-to-edit pattern consistent with the rest of the app

### Center Column — Tailoring Content

- **Job selector**: combobox at top, loads existing job descriptions
- **Additional prompt**: optional textarea for per-job one-off instructions (ephemeral, not saved)
- **Generate Resume button**: triggers generation using profile settings + job context
- **Headline card**: displays generated headline, regenerate button with optional prompt popover
- **Experience cards**: each shows title, company, date range, summary, bullet list with:
  - **Eye/eye-off toggle** per bullet (show/hide from PDF)
  - **Bullet range pill**: shows current range (accent-bordered if overridden, muted if using default), click to edit inline
  - **Regenerate button** with optional prompt popover
- **Education section**: list with eye/eye-off toggles

### Right Column — PDF Preview

- **Theme selector**: dropdown (existing 4 themes)
- **Generate PDF button**
- **PDF iframe**: displays rendered resume
- **Expand button**: opens fullscreen modal

### Navigation Change

- Add "Atelier" entry to sidebar (new section or under Resume section)
- Remove Resume tab from job detail page (`/jobs/$jobDescriptionId`) — job page keeps Overview tab only

## Application Layer Changes

### Modified Use Case: `GenerateResumeContent`

Current hardcoded values replaced with settings lookups:

- `BULLET_LIMITS` → read from `GenerationSettings` + per-experience `ExperienceGenerationOverride`
- Model selection → resolve `ModelTier` from `GenerationSettings` to concrete model ID
- Prompt composition → read `GenerationPrompt` entries by scope, compose as described above

### New Use Cases

- **`GetGenerationSettings`** — returns profile's generation settings + prompts
- **`UpdateGenerationSettings`** — updates model tier, bullet range, prompts
- **`SetExperienceGenerationOverride`** — creates or updates bullet range override for an experience
- **`RemoveExperienceGenerationOverride`** — deletes the override row, reverting to profile defaults

### New Port

- **`GenerationSettingsRepository`** — `findByProfileId()`, `save()`
- **`ExperienceGenerationOverrideRepository`** — `findByExperienceId()`, `findByExperienceIds()`, `save()`, `delete()`

## Infrastructure Layer Changes

### New ORM Entities

- `GenerationSettingsEntity` → maps to `generation_settings` table
- `GenerationPromptEntity` → maps to `generation_prompts` table
- `ExperienceGenerationOverrideEntity` → maps to `experience_generation_overrides` table

### New Repositories

- `PostgresGenerationSettingsRepository` — implements `GenerationSettingsRepository` port
- `PostgresExperienceGenerationOverrideRepository` — implements `ExperienceGenerationOverrideRepository` port

### Modified: `ClaudeApiResumeContentGenerator`

- Accept `modelTier` (resolved to model ID) instead of hardcoding `claude-opus-4-6`
- Accept composed prompt string instead of building from template alone
- Request classes (`GenerateResumeBulletsRequest`, `RegenerateHeadlineRequest`, `RegenerateExperienceRequest`) accept model as parameter

### New Migration

- Creates `generation_settings`, `generation_prompts`, `experience_generation_overrides` tables
- Seeds `generation_settings` for existing profiles with system defaults

## API Layer Changes

### New Routes

- `GET /generation-settings` — returns current profile's settings + prompts
- `PUT /generation-settings` — updates model tier, bullet range, prompts
- `PUT /experiences/:id/generation-override` — set bullet range override
- `DELETE /experiences/:id/generation-override` — remove override

### Modified Route

- `POST /resume/generate` — no body changes, but the use case now reads settings from DB instead of hardcoded values

## Web Layer Changes

### New Route

- `/atelier` — new page component

### New Components

- `AtelierPage` — three-column layout container
- `GenerationSettingsPanel` — left column (model tier, bullet range, prompts accordion)
- `ModelTierSelector` — segmented control
- `BulletRangeInput` — min/max number inputs
- `PromptsAccordion` — collapsible prompt editors per scope
- `BulletRangePill` — inline display/edit of per-experience bullet range
- `JobSelector` — combobox for picking a job description

### Relocated Components

The following components move from the job detail page to the Atelier center column (adapted, not rewritten):

- Headline card with regenerate
- Experience cards with bullet toggles
- Education visibility toggles
- PDF preview panel (right column)
- Additional prompt textarea

### Sidebar Update

- Add "Atelier" nav item (Palette or Wand icon)
- Keep existing Resume section (Profile, Experiences, Education) and Directory section (Jobs, Companies)

### Removed

- Resume tab from `/jobs/$jobDescriptionId` — page becomes Overview only

## Verification

1. **Settings persistence**: create/update generation settings, verify they persist across page reloads
2. **Model tier**: generate with each tier, verify correct model is called (check API logs)
3. **Bullet ranges**: set profile default to 3–4, generate, verify bullet counts. Set per-experience override to 2–2 on one experience, regenerate, verify that experience gets exactly 2 bullets while others follow default
4. **Prompts**: set resume prompt "Always use past tense", generate, verify. Set experience prompt "Focus on metrics", regenerate single experience, verify both prompts apply
5. **Override lifecycle**: create override → verify pill shows accent border. Remove override → verify pill reverts to muted/default. Delete experience → verify override row is cascade-deleted
6. **Job switching**: select different jobs in the Atelier, verify content loads correctly per job
7. **PDF preview**: verify PDF reflects visible bullets only (hidden bullets excluded)
8. **Migration**: verify existing profiles get seeded `generation_settings` with system defaults
9. **Backward compatibility**: verify existing resume content is still accessible after migration
