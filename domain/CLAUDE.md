# domain/ — Domain Model

Package: `@tailoredin/domain`

The pure domain layer — aggregates, entities, value objects, domain services, domain events, and repository port interfaces.

**Hard rules:**
- No framework dependencies (`@injectable`, `inject`, MikroORM, Elysia, etc.)
- No I/O (no database, HTTP, file system)
- No imports from `@tailoredin/application` or `@tailoredin/infrastructure`
- Only `@tailoredin/core` utilities are allowed as an external dep

## Directory structure

```
domain/src/
├── entities/          ← Aggregate roots and entities
├── value-objects/     ← Value objects, ID types, enums
├── domain-services/   ← Stateless domain services
├── events/            ← Domain events
├── ports/             ← Repository interfaces (not implementations)
├── AggregateRoot.ts
├── Entity.ts
├── ValueObject.ts
├── DomainEvent.ts
└── Result.ts
```

## AggregateRoot vs Entity vs ValueObject

| Base class | When to use | Identity |
|---|---|---|
| `AggregateRoot<TId>` | Top-level consistency boundary; owns child entities; emits domain events | Identity by ID |
| `Entity<TId>` | Has lifecycle and identity but lives within an aggregate's boundary | Identity by ID |
| `ValueObject` | Immutable, no identity, compared by value (e.g. `TagSet`, `ContentSelection`) | Equality by value |

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

## Domain events

Implement `DomainEvent`; emit from aggregate command methods via `this.addDomainEvent(...)`:

```typescript
export class JobStatusChangedEvent implements DomainEvent {
  public readonly occurredAt = new Date();
  public constructor(
    public readonly jobId: string,
    public readonly oldStatus: JobStatus,
    public readonly newStatus: JobStatus,
  ) {}
}

// In JobPosting.changeStatus():
this.addDomainEvent(new JobStatusChangedEvent(this.id.value, oldStatus, newStatus));
```

## Domain services

Stateless classes for logic that spans multiple aggregates or doesn't belong to one:

```typescript
export class JobElectionService {
  public shouldIngest(posting: ScrapedPosting): boolean { ... }
}
```

No constructor parameters (no dependencies). If you need to inject a repository, it belongs in a use case, not a domain service.

## Enums

Named in `CONSTANT_CASE`, live in `value-objects/`:

```typescript
export enum SkillAffinity {
  EXPERT = 'expert',
  INTEREST = 'interest',
  AVOID = 'avoid',
}
```

## JobStatus lifecycle

```
NEW / LATER
  ↓ (manual action)
APPLIED → RECRUITER_SCREEN → TECHNICAL_SCREEN → HM_SCREEN → ON_SITE → OFFER
  ↓ (outcome)
REJECTED / NO_NEWS

Auto-discarded (election): RETIRED, DUPLICATE, HIGH_APPLICANTS, LOCATION_UNFIT, POSTED_TOO_LONG_AGO
Manual discard: UNFIT, EXPIRED, LOW_SALARY
```

`IN_PROCESS_JOB_STATUSES` and `DISCARDED_JOB_STATUSES` are exported sets for grouping logic.

## Aggregate factory pattern

All aggregates expose a `static create(props)` factory that generates the ID and sets defaults:

```typescript
public static create(props: ExperienceCreateProps): Experience {
  const now = new Date();
  return new Experience({ id: ExperienceId.generate(), ...props, createdAt: now, updatedAt: now });
}
```

Never construct aggregates with `new` directly from outside the domain layer.
