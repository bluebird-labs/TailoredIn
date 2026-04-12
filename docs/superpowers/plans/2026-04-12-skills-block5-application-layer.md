# Plan: Skills Block 5 — Application Layer

**Spec:** `/Users/sylvainestevez/Documents/Projects/TailoredIn/docs/superpowers/specs/skills-domain-proposals.md`

## Context

Use cases for querying the skill catalog (typeahead search, category listing) and managing skills on experiences. Plain TypeScript classes — no DI framework, no decorators. Repositories injected via constructor.

## Depends on

- Block 1 (domain entities + ports)

## Deliverables

### DTOs

- [ ] `application/src/dtos/SkillDto.ts` — `{ id: string, label: string, type: SkillType, categoryId: string | null, category: SkillCategoryDto | null, description: string | null }`
- [ ] `application/src/dtos/SkillCategoryDto.ts` — `{ id: string, label: string, ordinal: number }`
- [ ] `application/src/dtos/ExperienceSkillDto.ts` — `{ id: string, skillId: string, skill: SkillDto }`

### Use Cases

- [ ] `application/src/use-cases/skill/SearchSkills.ts` — search the skill catalog (typeahead)
  - Input: `{ query: string, limit?: number }` (default limit 20)
  - Calls `SkillRepository.search(query, limit)`
  - Returns `SkillDto[]` (with category populated)
- [ ] `application/src/use-cases/skill/ListSkillCategories.ts` — list all categories
  - Returns `SkillCategoryDto[]` ordered by ordinal
- [ ] `application/src/use-cases/experience/SyncExperienceSkills.ts` — sync skills on an experience
  - Input: `{ experienceId: string, skillIds: string[] }`
  - Loads experience, validates all skillIds exist via `SkillRepository.findByIds()`, calls `experience.syncSkills(skillIds)`
  - Returns updated `ExperienceDto` with skills populated

### DTO Mapper Updates

- [ ] Update `ExperienceDto` to include `skills: ExperienceSkillDto[]`
- [ ] Update `toExperienceDto()` mapper to populate skills (load skill details via repository)

### Diagram

- [ ] Update `application/APPLICATION.mmd` via `bun run app:diagram`

### Tests

- [ ] Unit tests for `SearchSkills` (mock SkillRepository)
- [ ] Unit tests for `ListSkillCategories` (mock SkillCategoryRepository)
- [ ] Unit tests for `SyncExperienceSkills` (mock both repos + ExperienceRepository)

## Verification

```bash
bun run typecheck
bun run test
bun run check
bun run dep:check
bun run app:diagram
```
