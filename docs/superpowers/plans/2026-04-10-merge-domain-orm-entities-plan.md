# Plan: Merge Domain and ORM Entities

**Spec:** `/Users/sylvainestevez/Documents/Projects/TailoredIn/docs/superpowers/specs/2026-04-10-merge-domain-orm-entities-design.md`

## Context

The codebase maintains two parallel entity hierarchies (domain entities in `domain/src/entities/` and MikroORM entities in `infrastructure/src/db/entities/`) with repositories manually mapping between them. This refactor merges them into a single entity class per concept — domain entities gain MikroORM decorators, infrastructure ORM entities are deleted, and repositories are drastically simplified.

## Phase 0 — Safety Net

- [ ] Run `bun run typecheck && bun run test && bun run --cwd infrastructure test:integration && bun run dep:check` and confirm green baseline
- [ ] Snapshot current schema via MikroORM `SchemaGenerator` for later comparison

## Phase 1 — Foundation

- [ ] Add `@mikro-orm/core` and `@mikro-orm/decorators` to `domain/package.json` dependencies; run `bun install`
- [ ] Refactor `domain/src/Entity.ts`: change `protected readonly _id` + `get id()` to `public readonly id`; update `equals()` to use `this.id` instead of `this._id`
- [ ] Create `domain/src/orm-types/ValueObjectIdType.ts` — generic base extending MikroORM `Type<T, string>`
- [ ] Create 11 concrete ID type files in `domain/src/orm-types/`: `ProfileIdType`, `ExperienceIdType`, `AccomplishmentIdType`, `CompanyIdType`, `EducationIdType`, `ApplicationIdType`, `JobDescriptionIdType`, `GenerationSettingsIdType`, `GenerationPromptIdType`, `ExperienceGenerationOverrideIdType`, `ResumeContentIdType`
- [ ] Add `toJSON(): string` to all 11 ID ValueObject classes in `domain/src/value-objects/`
- [ ] Add `toJSON()` to `domain/src/value-objects/SalaryRange.ts`
- [ ] Add barrel export for orm-types in `domain/src/index.ts`
- [ ] Run `bun run typecheck && bun run test` — verify green

## Phase 2 — Merge Entities (one by one)

For each entity below: add MikroORM decorators to domain entity → update `infrastructure/src/db/orm-config.ts` to import from `@tailoredin/domain` → simplify the repository → delete the infrastructure ORM entity file → run `typecheck + test`.

### 2.1 Profile
- [ ] Add `@Entity`, `@PrimaryKey`, `@Property` decorators to `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Profile.ts`
- [ ] Update `orm-config.ts` to import Profile from `@tailoredin/domain`
- [ ] Simplify `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/repositories/PostgresProfileRepository.ts` — remove `toDomain()`, return entity directly from `findSingle()`, simplify `save()`
- [ ] Delete `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/entities/profile/Profile.ts`
- [ ] Run `typecheck + test`

### 2.2 Education
- [ ] Add decorators to `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Education.ts` — use `@ManyToOne(() => Profile, { fieldName: 'profile_id', mapToPk: true })` for profileId
- [ ] Update `orm-config.ts`
- [ ] Simplify `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/repositories/PostgresEducationRepository.ts`
- [ ] Delete `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/entities/education/Education.ts`
- [ ] Run `typecheck + test`

### 2.3 Company
- [ ] Add decorators to `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Company.ts` — enum fields as `type: 'text'`
- [ ] Update `orm-config.ts`
- [ ] Simplify `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/repositories/PostgresCompanyRepository.ts` — note: `CompanyOrmRepository` has custom upsert logic that needs to be preserved or adapted
- [ ] Delete `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/entities/companies/Company.ts`
- [ ] Run `typecheck + test`

### 2.4 ExperienceGenerationOverride
- [ ] Add decorators to `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/ExperienceGenerationOverride.ts` — `@ManyToOne(() => Experience, { fieldName: 'experience_id', mapToPk: true })`
- [ ] Update `orm-config.ts`
- [ ] Simplify `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/repositories/PostgresExperienceGenerationOverrideRepository.ts`
- [ ] Delete `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/entities/experience/ExperienceGenerationOverride.ts`
- [ ] Run `typecheck + test`

### 2.5 Accomplishment
- [ ] Add decorators to `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Accomplishment.ts` — `@ManyToOne(() => Experience, { fieldName: 'experience_id', mapToPk: true })` for experienceId
- [ ] Update `orm-config.ts`
- [ ] Delete `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/entities/experience/Accomplishment.ts`
- [ ] Run `typecheck + test`

### 2.6 Experience (most complex)
- [ ] Add decorators to `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Experience.ts`:
  - `@ManyToOne(() => Profile, { fieldName: 'profile_id', mapToPk: true })` for profileId
  - `@ManyToOne(() => Company, { fieldName: 'company_id', mapToPk: true, nullable: true })` for companyId
  - `@OneToMany(() => Accomplishment, acc => acc.experienceId, { orphanRemoval: true, orderBy: { ordinal: 'ASC' } })` for accomplishments
  - Change `accomplishments: Accomplishment[]` to `accomplishments = new Collection<Accomplishment>(this)`
- [ ] Update business methods to use Collection API (`.add()`, `.remove()`, `.getItems()`)
- [ ] Update constructor — don't accept accomplishments in props, initialize via field initializer
- [ ] Update `orm-config.ts`
- [ ] Simplify `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/repositories/PostgresExperienceRepository.ts` — remove toDomain, syncAccomplishments, persistNewAccomplishment; save becomes `em.persist + flush`
- [ ] Delete `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/entities/experience/Experience.ts`
- [ ] Update domain unit tests for Collection API changes
- [ ] Run `typecheck + test`

### 2.7 GenerationPrompt
- [ ] Add decorators to `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/GenerationPrompt.ts` — FK to GenerationSettings via `mapToPk`
- [ ] Update `orm-config.ts`
- [ ] Delete `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/entities/generation-settings/GenerationPrompt.ts`
- [ ] Run `typecheck + test`

### 2.8 GenerationSettings
- [ ] Add decorators to `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/GenerationSettings.ts`:
  - `@ManyToOne(() => Profile, { fieldName: 'profile_id', mapToPk: true })` for profileId
  - `@OneToMany(() => GenerationPrompt, ..., { orphanRemoval: true })` for prompts
  - Change `prompts: GenerationPrompt[]` to `Collection<GenerationPrompt>`
- [ ] Update business methods (`setPrompt`, `removePrompt`, `getPrompt`) to use Collection API
- [ ] Update `orm-config.ts`
- [ ] Simplify `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/repositories/PostgresGenerationSettingsRepository.ts` — remove syncPrompts
- [ ] Delete `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/entities/generation-settings/GenerationSettings.ts`
- [ ] Run `typecheck + test`

### 2.9 Application
- [ ] Add decorators to `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Application.ts` — three FKs via `mapToPk`
- [ ] Update `orm-config.ts`
- [ ] Simplify `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/repositories/PostgresApplicationRepository.ts`
- [ ] Delete `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/entities/application/Application.ts`
- [ ] Run `typecheck + test`

### 2.10 JobDescription
- [ ] Add decorators to `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/JobDescription.ts`:
  - `@ManyToOne(() => Company, { fieldName: 'company_id', mapToPk: true })` for companyId
  - JSONB fields (`soughtHardSkills`, `soughtSoftSkills`) with `type: 'jsonb'`
  - `resumePdf` as `type: 'bytea', nullable: true`
  - Handle `SalaryRange` VO — store as separate `salaryMin`/`salaryMax`/`salaryCurrency` columns or use a custom MikroORM Embeddable
- [ ] Update `orm-config.ts`
- [ ] Simplify `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/repositories/PostgresJobDescriptionRepository.ts`
- [ ] Delete `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/entities/job-description/JobDescription.ts`
- [ ] Run `typecheck + test`

### 2.11 ResumeContent
- [ ] Add decorators to `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/ResumeContent.ts`:
  - Two FKs via `mapToPk`
  - JSONB fields (`experiences`, `hiddenEducationIds`, `schema`)
- [ ] Update `orm-config.ts`
- [ ] Simplify `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/repositories/PostgresResumeContentRepository.ts`
- [ ] Delete `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/entities/resume-content/ResumeContent.ts`
- [ ] Run `typecheck + test`

## Phase 3 — Cleanup

- [ ] Delete `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/BaseEntity.ts`
- [ ] Delete remaining files/directories under `infrastructure/src/db/entities/`
- [ ] Update seeds in `infrastructure/src/db/seeds/` to use domain entities
- [ ] Update barrel exports in `infrastructure/src/index.ts` and `domain/src/index.ts`
- [ ] Remove `UuidPrimaryKey` decorator from `infrastructure/src/db/helpers.ts` (keep `generateUuid` if seeds use it)
- [ ] Run full suite: `bun run typecheck && bun run test && bun run --cwd infrastructure test:integration && bun run dep:check && bun run knip`

## Phase 4 — DTO Simplification

- [ ] Eliminate Tier 1 DTOs: remove `ProfileDto`, `AccomplishmentDto`, `CompanyDto`, `EducationDto`, `ExperienceGenerationOverrideDto` mapper functions; update use cases to return entities directly
- [ ] Simplify Tier 2: remove `ApplicationDto` mapper (toJSON on IDs + MikroORM serialize handles it)
- [ ] Simplify Tier 3 mappers: remove ID unwrapping boilerplate from `ExperienceDto`, `JobDescriptionDto`, `ResumeContentDto`, `GenerationSettingsDto`
- [ ] Run `typecheck + test`

## Phase 5 — Verification & Documentation

- [ ] Schema diff verification: `SchemaGenerator.getUpdateSchemaSQL()` must produce empty diff
- [ ] Run `bun run --cwd infrastructure test:integration`
- [ ] Run `bun e2e:test`
- [ ] Update `/Users/sylvainestevez/Documents/Projects/TailoredIn/CLAUDE.md` — remove "Separate ORM entities" from Key Design Decisions, update architecture description
- [ ] Update `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/CLAUDE.md` — reflect MikroORM dependency, update hard rules
- [ ] Update `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/CLAUDE.md` — remove ORM entity section, update repository pattern description
- [ ] Regenerate diagrams: `bun run diags`
- [ ] Commit diagram changes

## Key Technical Decisions

1. **Base class**: Keep domain `Entity<TId>` / `AggregateRoot<TId>`. Do NOT extend MikroORM's BaseEntity. Change `_id` → `id`.
2. **ValueObject IDs**: Custom MikroORM `Type` subclasses for transparent DB conversion. Keep ID classes, add `toJSON()`.
3. **Cross-aggregate FKs**: `@ManyToOne(() => Target, { mapToPk: true })` — stays as plain string. Use cases unchanged.
4. **Intra-aggregate children**: `@OneToMany` with `Collection<T>` + `orphanRemoval: true`. Business methods adapt to Collection API.
5. **Repositories**: Thin wrappers around `em.find/persist/flush`. No more mapping code.
6. **Tests**: Domain unit tests still work without DB (decorators are inert metadata; Collection works standalone).
7. **Schema**: Zero migrations. Verified via `SchemaGenerator.getUpdateSchemaSQL()`.

## Risk Mitigation

- Run `typecheck + test` after every entity merge
- Run integration tests after Phase 2 completes
- Schema diff check confirms zero DDL changes
- Each entity is merged independently — can revert any single entity
- Old ORM entities are only deleted after the domain entity is verified working
