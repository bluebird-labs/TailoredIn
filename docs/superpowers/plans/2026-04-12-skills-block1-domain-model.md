# Plan: Skills Block 1 — Domain Model

**Spec:** `/Users/sylvainestevez/Documents/Projects/TailoredIn/docs/superpowers/specs/skills-domain-proposals.md`

## Context

Define the domain entities, value objects, enum, and ports for the skills system. This is the foundation block — everything else depends on it. No infrastructure, no database, no I/O — pure domain layer + a shared `normalizeLabel()` utility in `core/`.

## Deliverables

### core/

- [ ] `core/src/normalizeLabel.ts` — shared normalization function: trim → toLowerCase → strip spaces, dashes, underscores → preserve `+#./@&` and all other chars
- [ ] `core/src/normalizeLabel.test.ts` — unit tests covering all examples from the spec (JavaScript, Node.js, C++, CI/CD, etc.) + edge cases (empty string, special chars only)
- [ ] Export from `core/src/index.ts`

### domain/ — Value Objects & Enum

- [ ] `domain/src/value-objects/SkillType.ts` — enum: `LANGUAGE`, `TECHNOLOGY`, `METHODOLOGY`, `INTERPERSONAL`
- [ ] `domain/src/value-objects/SkillAlias.ts` — value object: `{ label: string; normalizedLabel: string }`

### domain/ — Entities

- [ ] `domain/src/entities/Skill.ts` — AggregateRoot with MikroORM decorators
  - Fields: `id`, `label`, `normalizedLabel`, `type` (SkillType), `categoryId` (nullable FK string), `description` (nullable), `aliases` (SkillAlias[] as JSONB), `createdAt`, `updatedAt`
  - `static create()` factory — generates UUID, derives `normalizedLabel` from label via `normalizeLabel()`
  - Validation: label 1-500 chars
- [ ] `domain/src/entities/SkillCategory.ts` — AggregateRoot with MikroORM decorators
  - Fields: `id`, `label`, `normalizedLabel`, `ordinal`, `createdAt`, `updatedAt`
  - `static create()` factory — generates UUID, derives `normalizedLabel`
  - Validation: label 1-500 chars, ordinal >= 0
- [ ] `domain/src/entities/ExperienceSkill.ts` — Entity (child of Experience) with MikroORM decorators
  - Fields: `id`, `experienceId`, `skillId`, `createdAt`
  - `static create()` factory — generates UUID
  - No ordinal (unordered set)

### domain/ — Experience Updates

- [ ] Update `domain/src/entities/Experience.ts`:
  - Add `@OneToMany(() => ExperienceSkill, es => es.experienceId, { orphanRemoval: true })` collection
  - Add `addSkill(skillId: string): ExperienceSkill`
  - Add `removeSkill(skillId: string): void`
  - Add `syncSkills(skillIds: string[]): void` — removes skills not in list, adds new ones (same pattern as `syncAccomplishments`)

### domain/ — Ports

- [ ] `domain/src/ports/SkillRepository.ts` — interface: `findByIds(ids: string[])`, `search(query: string, limit: number)`, `findAll()`, `findByNormalizedLabel(normalizedLabel: string)`
- [ ] `domain/src/ports/SkillCategoryRepository.ts` — interface: `findAll()`, `findByIdOrFail(id: string)`

### domain/ — Diagram

- [ ] Update `domain/DOMAIN.mmd` — add Skill, SkillCategory, ExperienceSkill, SkillAlias, SkillType with correct colors and relationships

### domain/ — Barrel Exports

- [ ] Export all new types from `domain/src/index.ts`

### Tests

- [ ] `domain/src/entities/Skill.test.ts` — create, validation, aliases
- [ ] `domain/src/entities/SkillCategory.test.ts` — create, validation
- [ ] `domain/src/entities/ExperienceSkill.test.ts` — create
- [ ] `domain/src/entities/Experience.test.ts` — update existing tests to cover `addSkill`, `removeSkill`, `syncSkills`

## Verification

```bash
bun run typecheck
bun run test
bun run check
bun run dep:check
bun run knip
bun run domain:diagram
```
