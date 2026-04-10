# domain/ — Domain Model

Package: `@tailoredin/domain`

The pure domain layer — aggregates, entities, value objects, domain services, and repository port interfaces.

**Hard rules:**
- MikroORM decorators (`@Entity`, `@Property`, `@ManyToOne`, `@OneToMany`, `@PrimaryKey`) are allowed — they are inert metadata with no I/O
- No other framework dependencies (`@injectable`, `inject`, Elysia, etc.)
- No I/O (no database, HTTP, file system)
- No imports from `@tailoredin/application` or `@tailoredin/infrastructure`
- Only `@tailoredin/core` utilities and `@mikro-orm/core` / `@mikro-orm/decorators` are allowed as external deps

## Directory structure

```
domain/src/
├── entities/          ← Aggregate roots and entities (with MikroORM decorators)
├── value-objects/     ← Value objects, ID types, enums
├── orm-types/         ← MikroORM custom Type classes for ValueObject IDs
├── domain-services/   ← Stateless domain services
├── ports/             ← Repository interfaces (not implementations)
├── AggregateRoot.ts
├── Entity.ts
├── ValueObject.ts
└── Result.ts
```

## Keeping the diagram in sync

**`domain/DOMAIN.mmd` is the source of truth for the domain model.** Whenever you add, remove, or rename an aggregate, entity, value object, enum, domain service, or domain event — update `DOMAIN.mmd` in the same commit. The diagram must always reflect the code.

Color legend:

| Color | Type |
|-------|------|
| Indigo | Aggregate Root |
| Blue | Entity |
| Green | Value Object |
| Amber | Enumeration / Type |

## AggregateRoot vs Entity vs ValueObject

| Base class | When to use | Identity |
|---|---|---|
| `AggregateRoot<TId>` | Top-level consistency boundary; owns child entities | Identity by ID |
| `Entity<TId>` | Has lifecycle and identity but lives within an aggregate's boundary | Identity by ID |
| `ValueObject` | Immutable, no identity, compared by value | Equality by value |

## ID value objects

Each aggregate/entity gets its own ID type:

```typescript
export class ExperienceId extends ValueObject {
  public constructor(public readonly value: string) { super(); }
  public static generate(): ExperienceId {
    return new ExperienceId(crypto.randomUUID());
  }
}
```

Always use `<Entity>Id.generate()` in factories — never generate raw UUIDs in use cases.

## Repository ports

Interfaces only — no implementation here. Live in `domain/src/ports/`:

```typescript
export interface ExperienceRepository {
  findByProfileId(profileId: string): Promise<Experience[]>;
  findByIdOrFail(id: ExperienceId): Promise<Experience>;
  save(experience: Experience): Promise<void>;
  delete(id: ExperienceId): Promise<void>;
}
```

- Method names are domain-focused (`findByProfileId`, `findOrFail`) — not generic CRUD
- Methods throw for critical failures (`findByIdOrFail`)

## Domain services

Stateless classes for logic that spans multiple aggregates or doesn't belong to one. No constructor parameters (no dependencies). If you need to inject a repository, it belongs in a use case, not a domain service.

## Enums

Named in `CONSTANT_CASE`, live in `value-objects/`:

```typescript
export enum BusinessType {
  B2B = 'b2b',
  B2C = 'b2c',
  B2B2C = 'b2b2c',
}
```

## Aggregate factory pattern

All aggregates expose a `static create(props)` factory that generates the ID and sets defaults:

```typescript
public static create(props: ExperienceCreateProps): Experience {
  const now = new Date();
  return new Experience({ id: ExperienceId.generate(), ...props, createdAt: now, updatedAt: now });
}
```

Never construct aggregates with `new` directly from outside the domain layer.
