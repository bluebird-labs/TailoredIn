# Merge Domain and ORM Entities

**Date:** 2026-04-10
**Status:** Draft

## Context

The TailoredIn monorepo follows DDD/Onion Architecture with separate domain entities (`domain/src/entities/`) and MikroORM entities (`infrastructure/src/db/entities/`). Repositories in `infrastructure/src/repositories/` contain `toDomain()` and manual field-by-field `save()` methods that map between the two representations.

This dual-entity setup causes three categories of pain:

1. **Boilerplate** — every repository has ~50–100 lines of mechanical mapping code. Child entity sync (accomplishments, prompts) adds another 30–50 lines per aggregate with children.
2. **Cognitive overhead** — two representations of the same concept makes the codebase harder to reason about. Contributors must understand which "Experience" class they're looking at.
3. **Performance** — every read hydrates an ORM entity then allocates a separate domain entity. Every write does the reverse.

The separation was originally justified by DDD purity (domain layer free of framework deps), but in practice the domain entities are nearly 1:1 with the ORM entities and the mapping code is where bugs hide.

## Decision

Merge ORM decorators into domain entities, eliminating the infrastructure ORM entity layer entirely.

## Architecture After the Merge

### What changes

- Domain entities gain MikroORM decorators (`@Entity`, `@Property`, `@ManyToOne`, `@OneToMany`)
- `@mikro-orm/core` becomes a dependency of the `domain/` package (decorators are metadata-only, no I/O)
- ORM entities in `infrastructure/src/db/entities/` are deleted
- Repositories lose all `toDomain()`/`toORM()` mapping, become thin wrappers around `EntityManager`
- DTOs are simplified — eliminated where entity shape matches API response

### What stays the same

- Database schema (zero migrations needed)
- Repository port interfaces in `domain/src/ports/`
- DI composition root in `api/src/container.ts`
- Use case signatures
- Cross-aggregate FKs as plain string IDs (`profileId`, `companyId`)
- ValueObject IDs (preserved with MikroORM custom types)
- dependency-cruiser rules (they check workspace path imports, not npm packages)

## Entity Merge Mechanics

### Base class changes

`Entity<TId>` currently uses `protected readonly _id` + `get id()`. Change to `public readonly id` so MikroORM decorators can be applied on concrete classes:

```typescript
// Entity.ts — after
export abstract class Entity<TId extends ValueObject<{ value: string }>> {
  public readonly id: TId;
  protected constructor(id: TId) { this.id = id; }
  public equals(other: Entity<TId>): boolean {
    if (other === null || other === undefined) return false;
    if (other.constructor !== this.constructor) return false;
    return this.id.equals(other.id);
  }
}
```

All external code already accesses `.id` via the getter — no call sites change.

### Custom MikroORM types for ValueObject IDs

Generic base type in `domain/src/orm-types/ValueObjectIdType.ts`:

```typescript
export abstract class ValueObjectIdType<T extends { value: string }> extends Type<T, string> {
  abstract create(value: string): T;
  
  convertToDatabaseValue(value: T | string | null | undefined, platform: Platform): string | null {
    if (value == null) return null;
    return typeof value === 'string' ? value : value.value;
  }
  
  convertToJSValue(value: string | null | undefined, platform: Platform): T | null {
    if (value == null) return null;
    return this.create(value);
  }
  
  getColumnType(): string { return 'uuid'; }
}
```

One concrete subclass per ID type (11 total), each ~3 lines:

```typescript
export class ExperienceIdType extends ValueObjectIdType<ExperienceId> {
  create(value: string) { return new ExperienceId(value); }
}
```

### ValueObject ID serialization

Add `toJSON()` to each ID ValueObject class so it serializes to a plain string in API responses. Since all ID classes share the same pattern (`ValueObject<{ value: string }>` with a `get value()` accessor), add `toJSON()` to each concrete class:

```typescript
// On each ID class (ProfileId, ExperienceId, etc.)
public toJSON(): string { return this.value; }
```

Also add `toJSON()` to `SalaryRange` so it serializes to `{ min, max, currency }` automatically.

### Merged entity example (Experience)

```typescript
@Entity({ tableName: 'experiences' })
export class Experience extends AggregateRoot<ExperienceId> {
  @PrimaryKey({ type: ExperienceIdType, fieldName: 'id' })
  public declare readonly id: ExperienceId;

  @ManyToOne(() => Profile, { fieldName: 'profile_id', mapToPk: true })
  public readonly profileId: string;

  @Property({ type: 'text' })
  public title: string;

  @Property({ type: 'text' })
  public companyName: string;

  @Property({ type: 'text', nullable: true })
  public companyWebsite: string | null;

  @Property({ type: 'text', nullable: true })
  public companyAccent: string | null;

  @ManyToOne(() => Company, { fieldName: 'company_id', mapToPk: true, nullable: true })
  public companyId: string | null;

  @Property({ type: 'text' })
  public location: string;

  @Property({ type: 'text' })
  public startDate: string;

  @Property({ type: 'text' })
  public endDate: string;

  @Property({ type: 'text', nullable: true })
  public summary: string | null;

  @Property({ type: 'integer' })
  public ordinal: number;

  @OneToMany(() => Accomplishment, acc => acc.experienceId, { orphanRemoval: true, orderBy: { ordinal: 'ASC' } })
  public readonly accomplishments = new Collection<Accomplishment>(this);

  @Property({ type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  // Constructor, factory method, and business methods stay
  public constructor(props: { ... }) {
    super(props.id);
    // ... assign all fields
    // accomplishments initialized as empty Collection in field initializer
  }

  public static create(props: ExperienceCreateProps): Experience { ... }
  public addAccomplishment(...) { ... }
  public removeAccomplishment(...) { ... }
  public syncAccomplishments(...) { ... }
  public linkCompany(...) { ... }
  public unlinkCompany() { ... }
}
```

### Relationship strategy

| Relationship type | Approach | Example |
|---|---|---|
| Cross-aggregate FK | `@ManyToOne(() => Target, { mapToPk: true })` — stays as plain string | `Experience.profileId: string` |
| Intra-aggregate parent | `@ManyToOne(() => Parent, { mapToPk: true })` — stays as plain string for simplicity | `Accomplishment.experienceId: string` |
| Intra-aggregate children | `@OneToMany(() => Child, ..., { orphanRemoval: true })` — `Collection<T>` | `Experience.accomplishments` |

### Collection<T> impact on business methods

`Accomplishment[]` → `Collection<Accomplishment>`. Method adaptations:

| Array operation | Collection equivalent |
|---|---|
| `.push(item)` | `.add(item)` |
| `.splice(i, 1)` | `.remove(item)` |
| `.find()` / `.filter()` / `.map()` | `.getItems().find()` etc. |
| `.length` | `.count()` or `.getItems().length` |
| `for...of` iteration | Works directly (Collection is iterable) |

### Constructor + factory compatibility

MikroORM with `forceEntityConstructor: true` calls the constructor when hydrating from DB. The constructor signature stays as-is (accepting a props object). Collections are initialized via field initializers (`= new Collection<T>(this)`); MikroORM populates them after construction during hydration.

`Experience.create()` still calls `new Experience({...})` — works identically.

## Repository Simplification

### Before (~165 lines for Experience)

- `toDomain()`: manually constructs domain entity from ORM entity
- `save()`: finds existing or creates new, copies every field, calls `syncAccomplishments()`
- `syncAccomplishments()`: diffs and persists/removes child ORM entities
- `persistNewAccomplishment()`: creates ORM accomplishment

### After (~30 lines)

```typescript
@injectable()
export class PostgresExperienceRepository implements ExperienceRepository {
  constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  async findByIdOrFail(id: string): Promise<Experience> {
    try {
      return await this.orm.em.findOneOrFail(Experience, id, { populate: ['accomplishments'] });
    } catch (e) {
      if (e instanceof NotFoundError) throw new EntityNotFoundError('Experience', id);
      throw e;
    }
  }

  async findAll(): Promise<Experience[]> {
    return this.orm.em.find(Experience, {}, {
      orderBy: { ordinal: 'ASC' }, populate: ['accomplishments']
    });
  }

  async save(experience: Experience): Promise<void> {
    this.orm.em.persist(experience);
    await this.orm.em.flush();
  }

  async delete(id: string): Promise<void> {
    const exp = await this.findByIdOrFail(id);
    this.orm.em.remove(exp);
    await this.orm.em.flush();
  }
}
```

**Key simplifications:**
- `persist()` handles both insert and update via MikroORM's Unit of Work
- `orphanRemoval: true` handles child deletion automatically on `flush()`
- Default cascade (`Cascade.PERSIST`) handles new children added to Collections

### Port interfaces

Repository port signatures in `domain/src/ports/` remain unchanged. They already return domain types — those types just happen to also be MikroORM entities now.

## DTO Simplification

### Tier 1 — Eliminate (entity shape ≈ API shape)

DTOs to remove: `ProfileDto`, `AccomplishmentDto`, `CompanyDto`, `EducationDto`, `ExperienceGenerationOverrideDto`

With `toJSON()` on ValueObject IDs, these entities serialize to the correct API shape directly. Use cases return entities; the API layer handles serialization. Mapper functions are deleted.

### Tier 2 — Simplify (minor transformations)

`ApplicationDto` — only differs by date formatting + ID unwrapping. With `toJSON()` on IDs and MikroORM's `serialize()` handling dates as ISO strings, the mapper becomes unnecessary.

### Tier 3 — Keep (cross-aggregate composition)

These DTOs assemble data from multiple aggregates and must be kept:

- **ExperienceDto** — nests Company data loaded from a separate aggregate
- **JobDescriptionDto** — complex: SalaryRange flattening, ResumeOutput composition, Company data, computed `hasCachedPdf`
- **ResumeContentDto** — joins Experience titles into resume content
- **GenerationSettingsDto** — joins ExperienceGenerationOverride from different aggregate

Mappers are simplified (no more ID unwrapping boilerplate) but retained for the cross-aggregate composition logic.

## Phased Implementation Plan

### Phase 0 — Safety Net

- Record green baseline: `typecheck`, `test`, `test:integration`, `dep:check`
- Snapshot current DB schema via `SchemaGenerator.getUpdateSchemaSQL()` for comparison

### Phase 1 — Foundation (no behavioral changes)

1. Add `@mikro-orm/core` as dependency of `domain/package.json`
2. Create `domain/src/orm-types/` with `ValueObjectIdType` base + 11 concrete ID types
3. Add `toJSON()` to all ValueObject ID classes
4. Refactor `Entity<TId>`: change `_id` → `id` (public readonly)
5. Run `typecheck + test` — verify everything passes

### Phase 2 — Merge Entities (ordered by complexity)

For each entity: add decorators to domain entity → update `orm-config.ts` → simplify repository → delete ORM entity → run `typecheck + test`.

Order:
1. Profile
2. Education
3. Company
4. ExperienceGenerationOverride
5. Accomplishment
6. Experience
7. GenerationPrompt
8. GenerationSettings
9. Application
10. JobDescription
11. ResumeContent

### Phase 3 — Cleanup

- Delete `infrastructure/src/db/BaseEntity.ts`
- Delete `infrastructure/src/db/entities/` directory
- Update seeds to use domain entities
- Update barrel exports
- Run full suite: `typecheck + test + test:integration + dep:check + knip`

### Phase 4 — DTO Simplification

- Eliminate Tier 1 DTOs and their mappers
- Simplify Tier 2 DTOs
- Reduce Tier 3 mapper boilerplate (remove ID unwrapping)

### Phase 5 — Verification & Documentation

- Schema diff verification: `SchemaGenerator.getUpdateSchemaSQL()` must produce empty diff
- Integration tests against real Postgres
- E2E tests
- Update `CLAUDE.md`, `domain/CLAUDE.md`, `infrastructure/CLAUDE.md`
- Regenerate all diagrams

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Schema drift (decorators produce different DDL) | Medium | High | Schema diff verification in Phase 5; explicit `fieldName` on all properties |
| MikroORM metadata discovery issues with domain base classes | Low | Medium | `forceEntityConstructor: true` already set; base classes are plain TS with no conflicting decorators |
| Collection<T> breaks domain unit tests | Low | Low | Collection works standalone without EntityManager; only lazy loading requires DB |
| `mapToPk` + `orphanRemoval` interaction | Low | High | Verify in integration tests before proceeding; these are both well-supported MikroORM features |
| Domain unit tests broken by decorator imports | Very Low | Low | Decorators are inert metadata without `MikroORM.init()` |

## Verification Plan

1. **After each entity merge**: `bun run typecheck && bun run test`
2. **After Phase 2 complete**: `bun run --cwd infrastructure test:integration`
3. **After Phase 3**: `bun run typecheck && bun run test && bun run --cwd infrastructure test:integration && bun run dep:check && bun run knip`
4. **Schema verification**: Run `SchemaGenerator.getUpdateSchemaSQL()` and confirm empty result
5. **E2E**: `bun e2e:test` to verify full stack behavior
6. **Manual**: Start dev server (`bun dev:up`), exercise key flows (create experience, generate resume)

## Files Changed (Critical)

### Modified
- `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/Entity.ts` — `_id` → `id`
- All 11 ID ValueObject files in `domain/src/value-objects/` — add `toJSON()` method
- `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/value-objects/SalaryRange.ts` — add `toJSON()` method
- `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/package.json` — add `@mikro-orm/core` dep
- All 11 domain entity files in `domain/src/entities/` — add MikroORM decorators
- `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/orm-config.ts` — reference domain entities
- All 9 repository files in `infrastructure/src/repositories/` — simplify
- DTO files in `application/src/dtos/` — Tier 1 deleted, Tier 2/3 simplified
- `/Users/sylvainestevez/Documents/Projects/TailoredIn/CLAUDE.md` — update architecture docs
- `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/CLAUDE.md` — reflect MikroORM dep
- `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/CLAUDE.md` — update entity section

### Created
- `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/orm-types/ValueObjectIdType.ts`
- 11 concrete ID type files in `domain/src/orm-types/`

### Deleted
- All files in `infrastructure/src/db/entities/` (11 ORM entity files)
- `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/BaseEntity.ts`
- Tier 1 DTO mapper functions
