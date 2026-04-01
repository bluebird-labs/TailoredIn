# Session Instructions: P1 — Pipeline Correctness

## Setup

```bash
git worktree add .claude/worktrees/resume-pipeline-fix -b feat/resume-pipeline-fix
```

Do ALL work inside `.claude/worktrees/resume-pipeline-fix`.

## Required Reading

1. `CLAUDE.md` — architecture, conventions, commands
2. `GOALS.md` — the "Now" section defines the product goal
3. `docs/superpowers/specs/2026-04-01-pipeline-correctness.md` — your detailed spec
4. `docs/superpowers/specs/2026-04-01-resume-tailoring-coordination.md` — how this fits with parallel sessions

## Problem

`DatabaseResumeContentFactory` at `infrastructure/src/services/DatabaseResumeContentFactory.ts` (lines 55-74) ignores the `bulletVariantIds` from archetype content selections. It dumps ALL bullets from each selected experience instead of using the specific bullet variants the user chose per archetype.

The domain model, UI, API, and persistence all work correctly — the bug is isolated to this one factory method.

## What to Build

1. **Fix the factory** — Build a `variantMap` from all loaded experiences' bullet variants, then iterate `sel.bulletVariantIds` (preserving selection order) to resolve variant texts as highlights. Skip missing variants gracefully (log warning, don't throw). See spec section 6 for the full replacement code.

2. **Write unit tests** — Create `infrastructure/test/services/DatabaseResumeContentFactory.test.ts` with these cases:
   - Happy path: selected variants drive highlights
   - Selection order is preserved
   - Missing variant is skipped silently
   - Empty bulletVariantIds → empty highlights, experience still in output
   - Multiple experiences with different selections
   - Trailing period handling (added if missing, not doubled)

## Key Files

| File | Action |
|---|---|
| `infrastructure/src/services/DatabaseResumeContentFactory.ts` | **Modify** lines 55-74 |
| `infrastructure/test/services/DatabaseResumeContentFactory.test.ts` | **Create** — unit tests |
| `domain/src/value-objects/ContentSelection.ts` | Read — defines `ExperienceSelection` with `bulletVariantIds` |
| `domain/src/entities/BulletVariant.ts` | Read — `.text` property is what becomes the highlight |
| `domain/src/entities/Bullet.ts` | Read — `.variants` collection |
| `infrastructure/src/repositories/PostgresExperienceRepository.ts` | Read — confirms variants are eagerly loaded (no changes needed) |
| `application/src/dtos/ResumeContentDto.ts` | Read — `highlights: string[]` shape is preserved |

## Edge Cases

- Selected variantId deleted → skip, log warning
- Experience selected but bulletVariantIds empty → empty highlights array, experience still appears
- Variant not APPROVED → include it (approval is editorial, not a generation gate)
- No repository or DTO changes needed

## Completion Checklist

- [ ] Factory uses bulletVariantIds to resolve variant texts
- [ ] Selection order preserved (not re-sorted by bullet ordinal)
- [ ] All 6 unit test cases pass
- [ ] `bun run check` — clean
- [ ] `bun run knip` — no dead code
- [ ] Run `/land` to rebase, PR, and merge
