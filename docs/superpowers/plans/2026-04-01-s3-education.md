# S3: Education Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/resume/education` with a new Education entity backed by the `educations` table (created in S0 migration), delivering a full vertical slice from domain through web UI.

**Architecture:** New `Education` aggregate root (domain) replaces `ResumeEducation`. The new entity references `profile_id` (not `user_id`) and adds `honors` (nullable text) and changes `graduationYear` to integer and `location` to nullable. API routes move from `/users/:userId/resume/education` to `/educations`. The domain entity omits `profileId` — the repository implementation resolves the single profile internally.

**Tech Stack:** Bun, MikroORM, Elysia, React 19, TanStack Router/Query, shadcn/ui, Zod, react-hook-form

---

## File Structure

### Create

| File | Responsibility |
|---|---|
| `domain/src/entities/Education.ts` | Education aggregate root |
| `domain/src/ports/EducationRepository.ts` | Repository port interface |
| `domain/test/entities/Education.test.ts` | Domain entity unit tests |
| `application/src/dtos/EducationDto.ts` | Education DTO type |
| `application/src/use-cases/education/ListEducation2.ts` | List all educations use case |
| `application/src/use-cases/education/CreateEducation2.ts` | Create education use case |
| `application/src/use-cases/education/UpdateEducation2.ts` | Update education use case |
| `application/src/use-cases/education/DeleteEducation2.ts` | Delete education use case |
| `infrastructure/src/db/entities/education/Education.ts` | MikroORM entity for `educations` table |
| `infrastructure/src/repositories/PostgresEducationRepository.ts` | Repository implementation |
| `api/src/routes/education/ListEducationsRoute.ts` | `GET /educations` |
| `api/src/routes/education/CreateEducationRoute2.ts` | `POST /educations` |
| `api/src/routes/education/UpdateEducationRoute2.ts` | `PUT /educations/:id` |
| `api/src/routes/education/DeleteEducationRoute2.ts` | `DELETE /educations/:id` |

### Modify

| File | What changes |
|---|---|
| `domain/src/index.ts` | Add Education entity + EducationRepository port exports |
| `application/src/dtos/index.ts` | Add EducationDto export |
| `application/src/use-cases/index.ts` | Add education use case exports |
| `infrastructure/src/DI.ts` | Add `Education` DI token namespace |
| `infrastructure/src/db/orm-config.ts` | Register Education ORM entity |
| `infrastructure/src/index.ts` | Export PostgresEducationRepository |
| `api/src/container.ts` | Bind Education repository + use cases |
| `api/src/index.ts` | Register education routes |
| `web/src/hooks/use-education.ts` | Rewrite to call new `/educations` endpoints |
| `web/src/lib/query-keys.ts` | Add `educations` query key namespace |
| `web/src/routes/resume/education.tsx` | Rewrite page (no userId, new fields) |
| `web/src/components/resume/education/education-card.tsx` | Update fields (location nullable, add honors) |
| `web/src/components/resume/education/education-form-dialog.tsx` | Update fields, add honors, make location optional |

---

### Task 1: Domain — Education entity (TDD)

**Files:**
- Create: `domain/test/entities/Education.test.ts`
- Create: `domain/src/entities/Education.ts`
- Modify: `domain/src/index.ts`

- [ ] **Step 1: Write failing tests for Education entity**

```typescript
// domain/test/entities/Education.test.ts
import { describe, expect, test } from 'bun:test';
import { Education } from '../../src/entities/Education.js';
import { EducationId } from '../../src/value-objects/EducationId.js';

describe('Education', () => {
  const createProps = {
    degreeTitle: 'B.S. in Computer Science',
    institutionName: 'MIT',
    graduationYear: 2020,
    location: 'Cambridge, MA',
    honors: 'Magna Cum Laude',
    ordinal: 0
  };

  test('create generates id and timestamps', () => {
    const edu = Education.create(createProps);

    expect(edu.id).toBeInstanceOf(EducationId);
    expect(edu.degreeTitle).toBe('B.S. in Computer Science');
    expect(edu.institutionName).toBe('MIT');
    expect(edu.graduationYear).toBe(2020);
    expect(edu.location).toBe('Cambridge, MA');
    expect(edu.honors).toBe('Magna Cum Laude');
    expect(edu.ordinal).toBe(0);
    expect(edu.createdAt).toBeInstanceOf(Date);
    expect(edu.updatedAt).toBeInstanceOf(Date);
  });

  test('create with nullable fields set to null', () => {
    const edu = Education.create({ ...createProps, location: null, honors: null });

    expect(edu.location).toBeNull();
    expect(edu.honors).toBeNull();
  });

  test('constructor reconstitutes from full props', () => {
    const id = new EducationId('fixed-id');
    const now = new Date('2025-01-01');
    const edu = new Education({ id, ...createProps, createdAt: now, updatedAt: now });

    expect(edu.id.value).toBe('fixed-id');
    expect(edu.degreeTitle).toBe('B.S. in Computer Science');
    expect(edu.graduationYear).toBe(2020);
  });

  test('mutable properties can be updated', () => {
    const edu = Education.create(createProps);

    edu.degreeTitle = 'M.S. in Computer Science';
    edu.institutionName = 'Stanford';
    edu.graduationYear = 2022;
    edu.location = 'Stanford, CA';
    edu.honors = 'With Distinction';
    edu.ordinal = 1;

    expect(edu.degreeTitle).toBe('M.S. in Computer Science');
    expect(edu.institutionName).toBe('Stanford');
    expect(edu.graduationYear).toBe(2022);
    expect(edu.location).toBe('Stanford, CA');
    expect(edu.honors).toBe('With Distinction');
    expect(edu.ordinal).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd domain && bun test test/entities/Education.test.ts`
Expected: FAIL — `Cannot find module '../../src/entities/Education.js'`

- [ ] **Step 3: Implement Education entity**

```typescript
// domain/src/entities/Education.ts
import { AggregateRoot } from '../AggregateRoot.js';
import { EducationId } from '../value-objects/EducationId.js';

export type EducationCreateProps = {
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
  ordinal: number;
};

export class Education extends AggregateRoot<EducationId> {
  public degreeTitle: string;
  public institutionName: string;
  public graduationYear: number;
  public location: string | null;
  public honors: string | null;
  public ordinal: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: EducationId;
    degreeTitle: string;
    institutionName: string;
    graduationYear: number;
    location: string | null;
    honors: string | null;
    ordinal: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.degreeTitle = props.degreeTitle;
    this.institutionName = props.institutionName;
    this.graduationYear = props.graduationYear;
    this.location = props.location;
    this.honors = props.honors;
    this.ordinal = props.ordinal;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: EducationCreateProps): Education {
    const now = new Date();
    return new Education({
      id: EducationId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd domain && bun test test/entities/Education.test.ts`
Expected: All 4 tests PASS

- [ ] **Step 5: Create EducationRepository port**

```typescript
// domain/src/ports/EducationRepository.ts
import type { Education } from '../entities/Education.js';

export interface EducationRepository {
  findAll(): Promise<Education[]>;
  findByIdOrFail(id: string): Promise<Education>;
  save(education: Education): Promise<void>;
  delete(id: string): Promise<void>;
}
```

- [ ] **Step 6: Add barrel exports**

Add to `domain/src/index.ts`:
```typescript
export type { EducationCreateProps } from './entities/Education.js';
export { Education } from './entities/Education.js';
export type { EducationRepository } from './ports/EducationRepository.js';
```

- [ ] **Step 7: Commit**

```bash
git add domain/src/entities/Education.ts domain/src/ports/EducationRepository.ts domain/test/entities/Education.test.ts domain/src/index.ts
git commit -m "feat(domain): add Education aggregate root and EducationRepository port"
```

---

### Task 2: Application — EducationDto + CRUD use cases

**Files:**
- Create: `application/src/dtos/EducationDto.ts`
- Create: `application/src/use-cases/education/ListEducation2.ts`
- Create: `application/src/use-cases/education/CreateEducation2.ts`
- Create: `application/src/use-cases/education/UpdateEducation2.ts`
- Create: `application/src/use-cases/education/DeleteEducation2.ts`
- Modify: `application/src/dtos/index.ts`
- Modify: `application/src/use-cases/index.ts`

- [ ] **Step 1: Create EducationDto**

```typescript
// application/src/dtos/EducationDto.ts
export type EducationDto = {
  id: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
  ordinal: number;
};
```

- [ ] **Step 2: Create ListEducation2 use case**

```typescript
// application/src/use-cases/education/ListEducation2.ts
import type { EducationRepository } from '@tailoredin/domain';
import type { EducationDto } from '../../dtos/EducationDto.js';

export class ListEducation2 {
  public constructor(private readonly educationRepository: EducationRepository) {}

  public async execute(): Promise<EducationDto[]> {
    const entries = await this.educationRepository.findAll();

    return entries.map(e => ({
      id: e.id.value,
      degreeTitle: e.degreeTitle,
      institutionName: e.institutionName,
      graduationYear: e.graduationYear,
      location: e.location,
      honors: e.honors,
      ordinal: e.ordinal
    }));
  }
}
```

- [ ] **Step 3: Create CreateEducation2 use case**

```typescript
// application/src/use-cases/education/CreateEducation2.ts
import { Education, type EducationRepository } from '@tailoredin/domain';
import type { EducationDto } from '../../dtos/EducationDto.js';

export type CreateEducation2Input = {
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
  ordinal: number;
};

export class CreateEducation2 {
  public constructor(private readonly educationRepository: EducationRepository) {}

  public async execute(input: CreateEducation2Input): Promise<EducationDto> {
    const education = Education.create({
      degreeTitle: input.degreeTitle,
      institutionName: input.institutionName,
      graduationYear: input.graduationYear,
      location: input.location,
      honors: input.honors,
      ordinal: input.ordinal
    });

    await this.educationRepository.save(education);

    return {
      id: education.id.value,
      degreeTitle: education.degreeTitle,
      institutionName: education.institutionName,
      graduationYear: education.graduationYear,
      location: education.location,
      honors: education.honors,
      ordinal: education.ordinal
    };
  }
}
```

- [ ] **Step 4: Create UpdateEducation2 use case**

```typescript
// application/src/use-cases/education/UpdateEducation2.ts
import { type EducationRepository, type Result, err, ok } from '@tailoredin/domain';
import type { EducationDto } from '../../dtos/EducationDto.js';

export type UpdateEducation2Input = {
  educationId: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
  ordinal: number;
};

export class UpdateEducation2 {
  public constructor(private readonly educationRepository: EducationRepository) {}

  public async execute(input: UpdateEducation2Input): Promise<Result<EducationDto, Error>> {
    let education;
    try {
      education = await this.educationRepository.findByIdOrFail(input.educationId);
    } catch {
      return err(new Error(`Education entry not found: ${input.educationId}`));
    }

    education.degreeTitle = input.degreeTitle;
    education.institutionName = input.institutionName;
    education.graduationYear = input.graduationYear;
    education.location = input.location;
    education.honors = input.honors;
    education.ordinal = input.ordinal;
    education.updatedAt = new Date();

    await this.educationRepository.save(education);

    return ok({
      id: education.id.value,
      degreeTitle: education.degreeTitle,
      institutionName: education.institutionName,
      graduationYear: education.graduationYear,
      location: education.location,
      honors: education.honors,
      ordinal: education.ordinal
    });
  }
}
```

- [ ] **Step 5: Create DeleteEducation2 use case**

```typescript
// application/src/use-cases/education/DeleteEducation2.ts
import { type EducationRepository, type Result, err, ok } from '@tailoredin/domain';

export type DeleteEducation2Input = {
  educationId: string;
};

export class DeleteEducation2 {
  public constructor(private readonly educationRepository: EducationRepository) {}

  public async execute(input: DeleteEducation2Input): Promise<Result<void, Error>> {
    try {
      await this.educationRepository.delete(input.educationId);
      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
```

- [ ] **Step 6: Add barrel exports**

Add to `application/src/dtos/index.ts`:
```typescript
export type { EducationDto } from './EducationDto.js';
```

Add to `application/src/use-cases/index.ts`:
```typescript
export { ListEducation2 } from './education/ListEducation2.js';
export type { CreateEducation2Input } from './education/CreateEducation2.js';
export { CreateEducation2 } from './education/CreateEducation2.js';
export type { UpdateEducation2Input } from './education/UpdateEducation2.js';
export { UpdateEducation2 } from './education/UpdateEducation2.js';
export type { DeleteEducation2Input } from './education/DeleteEducation2.js';
export { DeleteEducation2 } from './education/DeleteEducation2.js';
```

- [ ] **Step 7: Commit**

```bash
git add application/src/dtos/EducationDto.ts application/src/use-cases/education/ application/src/dtos/index.ts application/src/use-cases/index.ts
git commit -m "feat(application): add Education CRUD use cases and EducationDto"
```

---

### Task 3: Infrastructure — ORM entity + repository + DI tokens

**Files:**
- Create: `infrastructure/src/db/entities/education/Education.ts`
- Create: `infrastructure/src/repositories/PostgresEducationRepository.ts`
- Modify: `infrastructure/src/DI.ts`
- Modify: `infrastructure/src/db/orm-config.ts`
- Modify: `infrastructure/src/index.ts`

- [ ] **Step 1: Create Education ORM entity**

```typescript
// infrastructure/src/db/entities/education/Education.ts
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import type { Ref } from '@mikro-orm/postgresql';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, UuidPrimaryKey } from '../../helpers.js';
import { Profile } from '../profile/Profile.js';

export type EducationProps = {
  id: string;
  profile: Ref<Profile> | Profile;
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

export type EducationCreateProps = Omit<EducationProps, 'id' | 'createdAt' | 'updatedAt'>;

@Entity({ tableName: 'educations' })
export class Education extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Profile, { lazy: true, name: 'profile_id' })
  public readonly profile: Ref<Profile> | Profile;

  @Property({ name: 'degree_title', type: 'text' })
  public degreeTitle: string;

  @Property({ name: 'institution_name', type: 'text' })
  public institutionName: string;

  @Property({ name: 'graduation_year', type: 'integer' })
  public graduationYear: number;

  @Property({ name: 'location', type: 'text', nullable: true })
  public location: string | null;

  @Property({ name: 'honors', type: 'text', nullable: true })
  public honors: string | null;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  public constructor(props: EducationProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.profile = props.profile;
    this.degreeTitle = props.degreeTitle;
    this.institutionName = props.institutionName;
    this.graduationYear = props.graduationYear;
    this.location = props.location;
    this.honors = props.honors;
    this.ordinal = props.ordinal;
  }

  public static create(props: EducationCreateProps): Education {
    const now = new Date();
    return new Education({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
```

**Note:** This references `Profile` from `../profile/Profile.js` — the S1 Profile ORM entity. If that file doesn't exist in this branch yet (S1 is being implemented in parallel), you may need to create a minimal stub. Check if `infrastructure/src/db/entities/profile/Profile.ts` exists. If not, create a minimal version matching the S0 migration's `profiles` table:

```typescript
// infrastructure/src/db/entities/profile/Profile.ts (stub if missing)
import { Entity, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, UuidPrimaryKey } from '../../helpers.js';

export type ProfileProps = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'profiles' })
export class Profile extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @Property({ name: 'email', type: 'text' })
  public email: string;

  @Property({ name: 'first_name', type: 'text' })
  public firstName: string;

  @Property({ name: 'last_name', type: 'text' })
  public lastName: string;

  @Property({ name: 'phone', type: 'text', nullable: true })
  public phone: string | null;

  @Property({ name: 'location', type: 'text', nullable: true })
  public location: string | null;

  @Property({ name: 'linkedin_url', type: 'text', nullable: true })
  public linkedinUrl: string | null;

  @Property({ name: 'github_url', type: 'text', nullable: true })
  public githubUrl: string | null;

  @Property({ name: 'website_url', type: 'text', nullable: true })
  public websiteUrl: string | null;

  public constructor(props: ProfileProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.email = props.email;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.phone = props.phone;
    this.location = props.location;
    this.linkedinUrl = props.linkedinUrl;
    this.githubUrl = props.githubUrl;
    this.websiteUrl = props.websiteUrl;
  }

  public static create(props: Omit<ProfileProps, 'id' | 'createdAt' | 'updatedAt'>): Profile {
    const now = new Date();
    return new Profile({ ...props, id: generateUuid(), createdAt: now, updatedAt: now });
  }
}
```

- [ ] **Step 2: Create PostgresEducationRepository**

```typescript
// infrastructure/src/repositories/PostgresEducationRepository.ts
import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { Education as DomainEducation, EducationId, type EducationRepository } from '@tailoredin/domain';
import { Education as OrmEducation } from '../db/entities/education/Education.js';
import { Profile as OrmProfile } from '../db/entities/profile/Profile.js';

@injectable()
export class PostgresEducationRepository implements EducationRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findAll(): Promise<DomainEducation[]> {
    const entries = await this.orm.em.findAll(OrmEducation, { orderBy: { ordinal: 'ASC' } });
    return entries.map(e => this.toDomain(e));
  }

  public async findByIdOrFail(id: string): Promise<DomainEducation> {
    const orm = await this.orm.em.findOneOrFail(OrmEducation, id);
    return this.toDomain(orm);
  }

  public async save(education: DomainEducation): Promise<void> {
    const existing = await this.orm.em.findOne(OrmEducation, education.id.value);

    if (existing) {
      existing.degreeTitle = education.degreeTitle;
      existing.institutionName = education.institutionName;
      existing.graduationYear = education.graduationYear;
      existing.location = education.location;
      existing.honors = education.honors;
      existing.ordinal = education.ordinal;
      existing.updatedAt = education.updatedAt;
      this.orm.em.persist(existing);
    } else {
      const [profile] = await this.orm.em.findAll(OrmProfile, { limit: 1 });
      if (!profile) throw new Error('No profile found — seed the database first');
      const orm = new OrmEducation({
        id: education.id.value,
        profile: this.orm.em.getReference(OrmProfile, profile.id),
        degreeTitle: education.degreeTitle,
        institutionName: education.institutionName,
        graduationYear: education.graduationYear,
        location: education.location,
        honors: education.honors,
        ordinal: education.ordinal,
        createdAt: education.createdAt,
        updatedAt: education.updatedAt
      });
      this.orm.em.persist(orm);
    }

    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmEducation, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private toDomain(orm: OrmEducation): DomainEducation {
    return new DomainEducation({
      id: new EducationId(orm.id),
      degreeTitle: orm.degreeTitle,
      institutionName: orm.institutionName,
      graduationYear: orm.graduationYear,
      location: orm.location,
      honors: orm.honors,
      ordinal: orm.ordinal,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
```

- [ ] **Step 3: Add DI tokens**

Add to `infrastructure/src/DI.ts` — new `Education` namespace (alongside `Profile`, `Tag`, etc.):

```typescript
// Add to imports at top of DI.ts:
import type {
  CreateEducation2,
  DeleteEducation2,
  ListEducation2,
  UpdateEducation2
} from '@tailoredin/application';
import type { EducationRepository } from '@tailoredin/domain';

// Add new namespace inside the DI object (after Tag):
Education: {
  Repository: new InjectionToken<EducationRepository>('DI.Education.Repository'),
  ListEducation: new InjectionToken<ListEducation2>('DI.Education.ListEducation'),
  CreateEducation: new InjectionToken<CreateEducation2>('DI.Education.CreateEducation'),
  UpdateEducation: new InjectionToken<UpdateEducation2>('DI.Education.UpdateEducation'),
  DeleteEducation: new InjectionToken<DeleteEducation2>('DI.Education.DeleteEducation')
},
```

- [ ] **Step 4: Register ORM entity**

Add to `infrastructure/src/db/orm-config.ts`:

```typescript
// Add import:
import { Education } from './entities/education/Education.js';
// Also add Profile import if the stub was created:
import { Profile } from './entities/profile/Profile.js';

// Add to entities array:
Education,
// Also Profile if stub was created
```

- [ ] **Step 5: Add barrel export**

Add to `infrastructure/src/index.ts`:
```typescript
export { PostgresEducationRepository } from './repositories/PostgresEducationRepository.js';
```

- [ ] **Step 6: Verify compilation**

Run: `bun run --cwd infrastructure typecheck`
Expected: No type errors

- [ ] **Step 7: Commit**

```bash
git add infrastructure/src/db/entities/education/ infrastructure/src/db/entities/profile/ infrastructure/src/repositories/PostgresEducationRepository.ts infrastructure/src/DI.ts infrastructure/src/db/orm-config.ts infrastructure/src/index.ts
git commit -m "feat(infrastructure): add Education ORM entity, PostgresEducationRepository, DI tokens"
```

---

### Task 4: API — routes + container wiring

**Files:**
- Create: `api/src/routes/education/ListEducationsRoute.ts`
- Create: `api/src/routes/education/CreateEducationRoute2.ts`
- Create: `api/src/routes/education/UpdateEducationRoute2.ts`
- Create: `api/src/routes/education/DeleteEducationRoute2.ts`
- Modify: `api/src/container.ts`
- Modify: `api/src/index.ts`

- [ ] **Step 1: Create ListEducationsRoute**

```typescript
// api/src/routes/education/ListEducationsRoute.ts
import { inject, injectable } from '@needle-di/core';
import type { ListEducation2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListEducationsRoute {
  public constructor(private readonly listEducation: ListEducation2 = inject(DI.Education.ListEducation)) {}

  public plugin() {
    return new Elysia().get('/educations', async () => {
      const entries = await this.listEducation.execute();
      return { data: entries };
    });
  }
}
```

- [ ] **Step 2: Create CreateEducationRoute2**

```typescript
// api/src/routes/education/CreateEducationRoute2.ts
import { inject, injectable } from '@needle-di/core';
import type { CreateEducation2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class CreateEducationRoute2 {
  public constructor(
    private readonly createEducation: CreateEducation2 = inject(DI.Education.CreateEducation)
  ) {}

  public plugin() {
    return new Elysia().post(
      '/educations',
      async ({ body, set }) => {
        const entry = await this.createEducation.execute({
          degreeTitle: body.degree_title,
          institutionName: body.institution_name,
          graduationYear: body.graduation_year,
          location: body.location,
          honors: body.honors,
          ordinal: body.ordinal
        });

        set.status = 201;
        return { data: entry };
      },
      {
        body: t.Object({
          degree_title: t.String({ minLength: 1 }),
          institution_name: t.String({ minLength: 1 }),
          graduation_year: t.Integer({ minimum: 1900, maximum: 2100 }),
          location: t.Union([t.String({ minLength: 1 }), t.Null()]),
          honors: t.Union([t.String({ minLength: 1 }), t.Null()]),
          ordinal: t.Integer({ minimum: 0 })
        })
      }
    );
  }
}
```

- [ ] **Step 3: Create UpdateEducationRoute2**

```typescript
// api/src/routes/education/UpdateEducationRoute2.ts
import { inject, injectable } from '@needle-di/core';
import type { UpdateEducation2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateEducationRoute2 {
  public constructor(
    private readonly updateEducation: UpdateEducation2 = inject(DI.Education.UpdateEducation)
  ) {}

  public plugin() {
    return new Elysia().put(
      '/educations/:id',
      async ({ params, body, set }) => {
        const result = await this.updateEducation.execute({
          educationId: params.id,
          degreeTitle: body.degree_title,
          institutionName: body.institution_name,
          graduationYear: body.graduation_year,
          location: body.location,
          honors: body.honors,
          ordinal: body.ordinal
        });

        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }

        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          degree_title: t.String({ minLength: 1 }),
          institution_name: t.String({ minLength: 1 }),
          graduation_year: t.Integer({ minimum: 1900, maximum: 2100 }),
          location: t.Union([t.String({ minLength: 1 }), t.Null()]),
          honors: t.Union([t.String({ minLength: 1 }), t.Null()]),
          ordinal: t.Integer({ minimum: 0 })
        })
      }
    );
  }
}
```

- [ ] **Step 4: Create DeleteEducationRoute2**

```typescript
// api/src/routes/education/DeleteEducationRoute2.ts
import { inject, injectable } from '@needle-di/core';
import type { DeleteEducation2 } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteEducationRoute2 {
  public constructor(
    private readonly deleteEducation: DeleteEducation2 = inject(DI.Education.DeleteEducation)
  ) {}

  public plugin() {
    return new Elysia().delete(
      '/educations/:id',
      async ({ params, set }) => {
        const result = await this.deleteEducation.execute({ educationId: params.id });

        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }

        set.status = 204;
        return;
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
```

- [ ] **Step 5: Wire container bindings**

Add to `api/src/container.ts`:

```typescript
// Add to imports:
import { CreateEducation2, DeleteEducation2, ListEducation2, UpdateEducation2 } from '@tailoredin/application';
import { PostgresEducationRepository } from '@tailoredin/infrastructure';

// Add bindings (in a new "Education" section):
// Education
container.bind({ provide: DI.Education.Repository, useClass: PostgresEducationRepository });
container.bind({
  provide: DI.Education.ListEducation,
  useFactory: () => new ListEducation2(container.get(DI.Education.Repository))
});
container.bind({
  provide: DI.Education.CreateEducation,
  useFactory: () => new CreateEducation2(container.get(DI.Education.Repository))
});
container.bind({
  provide: DI.Education.UpdateEducation,
  useFactory: () => new UpdateEducation2(container.get(DI.Education.Repository))
});
container.bind({
  provide: DI.Education.DeleteEducation,
  useFactory: () => new DeleteEducation2(container.get(DI.Education.Repository))
});
```

- [ ] **Step 6: Register routes in api/src/index.ts**

Add imports and route registrations:

```typescript
// Add imports:
import { CreateEducationRoute2 } from './routes/education/CreateEducationRoute2.js';
import { DeleteEducationRoute2 } from './routes/education/DeleteEducationRoute2.js';
import { ListEducationsRoute } from './routes/education/ListEducationsRoute.js';
import { UpdateEducationRoute2 } from './routes/education/UpdateEducationRoute2.js';

// Add route registrations (after the existing education routes or replacing them):
// Education (new domain model)
.use(container.get(ListEducationsRoute).plugin())
.use(container.get(CreateEducationRoute2).plugin())
.use(container.get(UpdateEducationRoute2).plugin())
.use(container.get(DeleteEducationRoute2).plugin())
```

- [ ] **Step 7: Commit**

```bash
git add api/src/routes/education/ api/src/container.ts api/src/index.ts
git commit -m "feat(api): add /educations CRUD routes with DI wiring"
```

---

### Task 5: Web — hooks + query keys

**Files:**
- Modify: `web/src/lib/query-keys.ts`
- Modify: `web/src/hooks/use-education.ts`

- [ ] **Step 1: Add educations query key namespace**

Add to `web/src/lib/query-keys.ts`:

```typescript
educations: {
  all: ['educations'] as const,
  list: () => [...queryKeys.educations.all, 'list'] as const
},
```

- [ ] **Step 2: Rewrite use-education.ts hooks**

Replace the contents of `web/src/hooks/use-education.ts`:

```typescript
// web/src/hooks/use-education.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useEducations() {
  return useQuery({
    queryKey: queryKeys.educations.list(),
    queryFn: async () => {
      const { data } = await api.educations.get();
      return data;
    }
  });
}

export function useCreateEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      degree_title: string;
      institution_name: string;
      graduation_year: number;
      location: string | null;
      honors: string | null;
      ordinal: number;
    }) => {
      const { data } = await api.educations.post(input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educations.all });
    }
  });
}

export function useUpdateEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      degree_title: string;
      institution_name: string;
      graduation_year: number;
      location: string | null;
      honors: string | null;
      ordinal: number;
    }) => {
      const { data } = await api.educations({ id }).put(body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educations.all });
    }
  });
}

export function useDeleteEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.educations({ id }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educations.all });
    }
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/query-keys.ts web/src/hooks/use-education.ts
git commit -m "feat(web): rewrite education hooks for new /educations API"
```

---

### Task 6: Web — rewrite education page + components

**Files:**
- Modify: `web/src/routes/resume/education.tsx`
- Modify: `web/src/components/resume/education/education-card.tsx`
- Modify: `web/src/components/resume/education/education-form-dialog.tsx`

- [ ] **Step 1: Rewrite education page**

Replace `web/src/routes/resume/education.tsx`:

```tsx
// web/src/routes/resume/education.tsx
import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { EducationCard } from '@/components/resume/education/education-card';
import { EducationFormDialog } from '@/components/resume/education/education-form-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEducations } from '@/hooks/use-education';

export const Route = createFileRoute('/resume/education')({
  component: EducationPage
});

export type Education = {
  id: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
  ordinal: number;
};

function EducationPage() {
  const { data, isLoading } = useEducations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Education | undefined>();

  const entries = ([...(data?.data ?? [])] as Education[]).sort((a, b) => a.ordinal - b.ordinal);
  const nextOrdinal = entries.length > 0 ? Math.max(...entries.map(e => e.ordinal)) + 1 : 0;

  function handleAdd() {
    setEditingEntry(undefined);
    setDialogOpen(true);
  }

  function handleEdit(entry: Education) {
    setEditingEntry(entry);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Education</h1>
          <p className="text-muted-foreground mt-1">Degrees and certifications.</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="size-4" data-icon="inline-start" />
          Add Entry
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && entries.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-muted-foreground">No education entries yet.</p>
          <p className="text-sm text-muted-foreground">Add your first degree or certification.</p>
        </div>
      )}

      {!isLoading && entries.length > 0 && (
        <div className="flex flex-col gap-4">
          {entries.map(entry => (
            <EducationCard key={entry.id} education={entry} onEdit={() => handleEdit(entry)} />
          ))}
        </div>
      )}

      <EducationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        education={editingEntry}
        nextOrdinal={nextOrdinal}
      />
    </div>
  );
}
```

- [ ] **Step 2: Rewrite education card**

Replace `web/src/components/resume/education/education-card.tsx`:

```tsx
// web/src/components/resume/education/education-card.tsx
import { Award, GraduationCap, MapPin, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Education } from '@/routes/resume/education';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeleteEducation } from '@/hooks/use-education';

type EducationCardProps = {
  education: Education;
  onEdit: () => void;
};

export function EducationCard({ education, onEdit }: EducationCardProps) {
  const [showDelete, setShowDelete] = useState(false);
  const deleteEducation = useDeleteEducation();

  function handleDelete() {
    deleteEducation.mutate(education.id, {
      onSuccess: () => {
        toast.success(`${education.degreeTitle} deleted`);
        setShowDelete(false);
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-4 text-muted-foreground" />
              {education.degreeTitle}
            </CardTitle>
            <CardDescription>
              {education.institutionName} &middot; {education.graduationYear}
              {education.location && (
                <span className="inline-flex items-center gap-1 ml-2">
                  <MapPin className="size-3" />
                  {education.location}
                </span>
              )}
              {education.honors && (
                <span className="inline-flex items-center gap-1 ml-2">
                  <Award className="size-3" />
                  {education.honors}
                </span>
              )}
            </CardDescription>
          </div>
          <CardAction>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-xs" onClick={onEdit}>
                <Pencil className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </CardAction>
        </CardHeader>
      </Card>

      <ConfirmDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={`Delete ${education.degreeTitle}?`}
        description="This education entry will be permanently removed."
        onConfirm={handleDelete}
        isPending={deleteEducation.isPending}
      />
    </>
  );
}
```

- [ ] **Step 3: Rewrite education form dialog**

Replace `web/src/components/resume/education/education-form-dialog.tsx`:

```tsx
// web/src/components/resume/education/education-form-dialog.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import type { Education } from '@/routes/resume/education';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateEducation, useUpdateEducation } from '@/hooks/use-education';

const educationSchema = z.object({
  degreeTitle: z.string().min(1, 'Required'),
  institutionName: z.string().min(1, 'Required'),
  graduationYear: z.coerce.number().int().min(1900, 'Invalid year').max(2100, 'Invalid year'),
  location: z.string().optional().default(''),
  honors: z.string().optional().default('')
});

type EducationFormData = z.infer<typeof educationSchema>;

type EducationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  education?: Education;
  nextOrdinal: number;
};

export function EducationFormDialog({ open, onOpenChange, education, nextOrdinal }: EducationFormDialogProps) {
  const isEditing = !!education;
  const createEducation = useCreateEducation();
  const updateEducation = useUpdateEducation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      degreeTitle: '',
      institutionName: '',
      graduationYear: undefined as unknown as number,
      location: '',
      honors: ''
    }
  });

  useEffect(() => {
    if (open) {
      reset(
        education
          ? {
              degreeTitle: education.degreeTitle,
              institutionName: education.institutionName,
              graduationYear: education.graduationYear,
              location: education.location ?? '',
              honors: education.honors ?? ''
            }
          : {
              degreeTitle: '',
              institutionName: '',
              graduationYear: undefined as unknown as number,
              location: '',
              honors: ''
            }
      );
    }
  }, [open, education, reset]);

  const isPending = createEducation.isPending || updateEducation.isPending;

  function onSubmit(data: EducationFormData) {
    const payload = {
      degree_title: data.degreeTitle,
      institution_name: data.institutionName,
      graduation_year: data.graduationYear,
      location: data.location || null,
      honors: data.honors || null
    };

    if (isEditing) {
      updateEducation.mutate(
        { id: education.id, ...payload, ordinal: education.ordinal },
        {
          onSuccess: () => {
            toast.success('Education updated');
            onOpenChange(false);
          }
        }
      );
    } else {
      createEducation.mutate(
        { ...payload, ordinal: nextOrdinal },
        {
          onSuccess: () => {
            toast.success('Education added');
            onOpenChange(false);
          }
        }
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Education' : 'Add Education'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="degreeTitle">Degree</Label>
            <Input id="degreeTitle" {...register('degreeTitle')} placeholder="B.S. Computer Science" />
            {errors.degreeTitle && <p className="text-xs text-destructive">{errors.degreeTitle.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="institutionName">Institution</Label>
            <Input id="institutionName" {...register('institutionName')} placeholder="MIT" />
            {errors.institutionName && <p className="text-xs text-destructive">{errors.institutionName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="graduationYear">Graduation Year</Label>
              <Input id="graduationYear" type="number" {...register('graduationYear')} placeholder="2018" />
              {errors.graduationYear && <p className="text-xs text-destructive">{errors.graduationYear.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register('location')} placeholder="Cambridge, MA" />
              {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="honors">Honors</Label>
            <Input id="honors" {...register('honors')} placeholder="Magna Cum Laude" />
            {errors.honors && <p className="text-xs text-destructive">{errors.honors.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Education'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add web/src/routes/resume/education.tsx web/src/components/resume/education/education-card.tsx web/src/components/resume/education/education-form-dialog.tsx
git commit -m "feat(web): rewrite education page with new domain model (honors, nullable location)"
```

---

### Task 7: Verify — lint, typecheck, run

- [ ] **Step 1: Run Biome check**

Run: `bun run check`
Expected: Clean (fix any issues if found)

- [ ] **Step 2: Run domain tests**

Run: `cd domain && bun test`
Expected: All tests pass (including new Education tests)

- [ ] **Step 3: Start dev environment and test manually**

Run: `bun dev:up`

Then open the URL printed by dev:up and navigate to `/resume/education`.

**Manual checks:**
1. Page loads (cards or empty state)
2. Click "Add Entry" — fill in degree, institution, year, location, honors → save → card appears
3. Click edit — change fields, save, reload page → changes persist
4. Click delete — card removed
5. Create multiple entries — verify ordinal ordering

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address lint/type issues from education slice"
```
