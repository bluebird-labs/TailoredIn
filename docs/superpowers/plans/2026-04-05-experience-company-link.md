# Experience-Company Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional Company FK to Experience so users can link/unlink companies from the experience form, with sync suggestions and logo display on cards.

**Architecture:** Domain gets `companyId` field + `linkCompany`/`unlinkCompany` methods. Two new use cases handle link/unlink, each needing both `ExperienceRepository` and `CompanyRepository`. The `ExperienceDto` gets an eagerly-loaded `company: CompanyDto | null`. Frontend adds a search popover in the experience form and logo display on cards.

**Tech Stack:** Bun, MikroORM (PostgreSQL), Elysia, React 19, TanStack Query, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-04-05-experience-company-link-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `domain/src/entities/Experience.ts` | Add `companyId` field, `linkCompany()`, `unlinkCompany()` |
| Modify | `domain/test/entities/Experience.test.ts` | Tests for link/unlink |
| Modify | `infrastructure/src/db/entities/experience/Experience.ts` | Add `company` ManyToOne relation |
| Create | `infrastructure/src/db/migrations/Migration_20260418000000_add_experience_company_link.ts` | Migration: add `company_id` FK |
| Modify | `infrastructure/src/repositories/PostgresExperienceRepository.ts` | Persist/load `companyId`, eagerly load company |
| Modify | `application/src/dtos/ExperienceDto.ts` | Add `companyId` + `company` fields |
| Modify | `application/src/use-cases/experience/ListExperiences.ts` | Update `toExperienceDto` for new fields |
| Create | `application/src/use-cases/experience/LinkCompanyToExperience.ts` | Link use case |
| Create | `application/src/use-cases/experience/UnlinkCompanyFromExperience.ts` | Unlink use case |
| Create | `application/test/use-cases/experience/LinkCompanyToExperience.test.ts` | Unit tests |
| Create | `application/test/use-cases/experience/UnlinkCompanyFromExperience.test.ts` | Unit tests |
| Modify | `application/src/use-cases/index.ts` | Barrel exports |
| Modify | `infrastructure/src/DI.ts` | Add DI tokens |
| Create | `api/src/routes/experience/LinkCompanyRoute.ts` | PUT /experiences/:id/company |
| Create | `api/src/routes/experience/UnlinkCompanyRoute.ts` | DELETE /experiences/:id/company |
| Modify | `api/src/container.ts` | Wire new use cases + routes |
| Modify | `api/src/index.ts` | Mount new routes |
| Modify | `web/src/hooks/use-experiences.ts` | Add `useLinkCompany`, `useUnlinkCompany`, update `Experience` type |
| Create | `web/src/components/resume/experience/CompanySearchPopover.tsx` | Search popover UI |
| Modify | `web/src/components/resume/experience/ExperienceFormModal.tsx` | Integrate popover + sync suggestions |
| Modify | `web/src/components/resume/experience/ExperienceCard.tsx` | Show logo + link icon |
| Modify | `web/src/components/companies/CompanyFormModal.tsx` | Add `onCreated` callback |

---

### Task 1: Domain — Add `companyId` to Experience

**Files:**
- Modify: `domain/src/entities/Experience.ts`
- Modify: `domain/test/entities/Experience.test.ts`

- [ ] **Step 1: Write failing tests for linkCompany/unlinkCompany**

Add to `domain/test/entities/Experience.test.ts`:

```typescript
test('starts with null companyId', () => {
  const exp = makeExperience();
  expect(exp.companyId).toBeNull();
});

test('links a company', () => {
  const exp = makeExperience();
  const before = exp.updatedAt;
  exp.linkCompany('company-123');
  expect(exp.companyId).toBe('company-123');
  expect(exp.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
});

test('unlinks a company', () => {
  const exp = makeExperience();
  exp.linkCompany('company-123');
  exp.unlinkCompany();
  expect(exp.companyId).toBeNull();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test domain/test/entities/Experience.test.ts`
Expected: FAIL — `companyId` property does not exist, `linkCompany`/`unlinkCompany` are not functions.

- [ ] **Step 3: Add `companyId` field and methods to Experience**

In `domain/src/entities/Experience.ts`:

Add to `ExperienceCreateProps`:
```typescript
export type ExperienceCreateProps = {
  profileId: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyId: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
};
```

Add field declaration after `companyWebsite`:
```typescript
public companyId: string | null;
```

Add to constructor props type:
```typescript
companyId: string | null;
```

Add to constructor body after `this.companyWebsite = props.companyWebsite;`:
```typescript
this.companyId = props.companyId;
```

Add methods before `static create`:
```typescript
public linkCompany(companyId: string): void {
  this.companyId = companyId;
  this.updatedAt = new Date();
}

public unlinkCompany(): void {
  this.companyId = null;
  this.updatedAt = new Date();
}
```

The `create` factory already spreads `...props`, so `companyId` will be passed through.

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test domain/test/entities/Experience.test.ts`
Expected: PASS

- [ ] **Step 5: Fix `makeExperience` in test file**

The `makeExperience` factory in the test file calls `Experience.create()` without `companyId`. Add it:

```typescript
const makeExperience = () =>
  Experience.create({
    profileId: 'profile-1',
    title: 'Staff Engineer',
    companyName: 'Acme Corp',
    companyWebsite: 'https://acme.com',
    companyId: null,
    location: 'New York, NY',
    startDate: '2022-01',
    endDate: 'Present',
    summary: 'Led platform team',
    ordinal: 0
  });
```

- [ ] **Step 6: Run all domain tests**

Run: `bun test domain/`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add domain/src/entities/Experience.ts domain/test/entities/Experience.test.ts
git commit -m "feat(domain): add companyId field with linkCompany/unlinkCompany to Experience"
```

---

### Task 2: Database migration

**Files:**
- Create: `infrastructure/src/db/migrations/Migration_20260418000000_add_experience_company_link.ts`

- [ ] **Step 1: Create migration file**

Create `infrastructure/src/db/migrations/Migration_20260418000000_add_experience_company_link.ts`:

```typescript
import { Migration } from '@mikro-orm/migrations';

export class Migration_20260418000000_add_experience_company_link extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE experiences
        ADD COLUMN company_id UUID NULL REFERENCES companies(id) ON DELETE SET NULL;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE experiences DROP COLUMN company_id;
    `);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add infrastructure/src/db/migrations/Migration_20260418000000_add_experience_company_link.ts
git commit -m "feat(infra): add migration for experience company_id FK"
```

---

### Task 3: Infrastructure — ORM entity + repository

**Files:**
- Modify: `infrastructure/src/db/entities/experience/Experience.ts`
- Modify: `infrastructure/src/repositories/PostgresExperienceRepository.ts`

- [ ] **Step 1: Add `company` relation to ORM entity**

In `infrastructure/src/db/entities/experience/Experience.ts`:

Add import:
```typescript
import { Company } from '../companies/Company.js';
```

Add to `ExperienceProps` type:
```typescript
companyId: string | null;
```

Add property after `companyWebsite` (before `location`):
```typescript
@ManyToOne(() => Company, { lazy: true, name: 'company_id', nullable: true })
public company: Ref<Company> | Company | null;
```

Update constructor to set the field. Use a reference if `companyId` is provided:
```typescript
this.company = props.companyId ? ({ id: props.companyId } as Ref<Company>) : null;
```

Note: We pass `companyId` through props rather than a full Ref. The constructor needs to handle this — we'll set it as a plain object with `id` that MikroORM can resolve, or use `em.getReference()` in the repository.

Actually, looking at the existing pattern more carefully, the ORM entity constructor receives `Ref<Profile> | Profile` for the profile relation. For company, since it's nullable and we need to set it from the repository, let's keep it simple:

Add to `ExperienceProps`:
```typescript
company: Ref<Company> | Company | null;
```

Add field:
```typescript
@ManyToOne(() => Company, { lazy: true, name: 'company_id', nullable: true })
public company: Ref<Company> | Company | null;
```

Add to constructor body after `this.companyWebsite`:
```typescript
this.company = props.company;
```

- [ ] **Step 2: Update `PostgresExperienceRepository.toDomain()`**

In `infrastructure/src/repositories/PostgresExperienceRepository.ts`, update the raw SQL query in `toDomain()` to also fetch `company_id`:

Replace:
```typescript
const [row] = await this.orm.em
  .getConnection()
  .execute<[{ profile_id: string }]>('SELECT profile_id FROM experiences WHERE id = ?', [orm.id]);
const profileId = row.profile_id;
```

With:
```typescript
const [row] = await this.orm.em
  .getConnection()
  .execute<[{ profile_id: string; company_id: string | null }]>(
    'SELECT profile_id, company_id FROM experiences WHERE id = ?',
    [orm.id]
  );
const profileId = row.profile_id;
const companyId = row.company_id;
```

Then add `companyId` to the `DomainExperience` constructor call:
```typescript
return new DomainExperience({
  id: new ExperienceId(orm.id),
  profileId,
  title: orm.title,
  companyName: orm.companyName,
  companyWebsite: orm.companyWebsite,
  companyId,
  location: orm.location,
  // ... rest unchanged
});
```

- [ ] **Step 3: Update `save()` for existing entity**

In the `if (existing)` branch of `save()`, after `existing.companyWebsite = experience.companyWebsite;`, add:

```typescript
existing.company = experience.companyId
  ? this.orm.em.getReference(OrmCompany, experience.companyId)
  : null;
```

Add import at top:
```typescript
import { Company as OrmCompany } from '../db/entities/companies/Company.js';
```

- [ ] **Step 4: Update `save()` for new entity**

In the `else` (new) branch, update the `OrmExperience` constructor call to include `company`:

```typescript
const orm = new OrmExperience({
  id: experience.id.value,
  profile,
  title: experience.title,
  companyName: experience.companyName,
  companyWebsite: experience.companyWebsite,
  company: experience.companyId
    ? this.orm.em.getReference(OrmCompany, experience.companyId)
    : null,
  location: experience.location,
  // ... rest unchanged
});
```

- [ ] **Step 5: Run typecheck**

Run: `bun run typecheck`
Expected: PASS (no type errors)

- [ ] **Step 6: Commit**

```bash
git add infrastructure/src/db/entities/experience/Experience.ts infrastructure/src/repositories/PostgresExperienceRepository.ts
git commit -m "feat(infra): add company relation to Experience ORM entity and repository"
```

---

### Task 4: Application — Update DTO and `toExperienceDto`

**Files:**
- Modify: `application/src/dtos/ExperienceDto.ts`
- Modify: `application/src/use-cases/experience/ListExperiences.ts`

- [ ] **Step 1: Update ExperienceDto**

In `application/src/dtos/ExperienceDto.ts`, add the new fields and import:

```typescript
import type { AccomplishmentDto } from './AccomplishmentDto.js';
import type { CompanyDto } from './CompanyDto.js';

export type { AccomplishmentDto };

export type ExperienceDto = {
  id: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyId: string | null;
  company: CompanyDto | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
  accomplishments: AccomplishmentDto[];
};
```

- [ ] **Step 2: Update `toExperienceDto` in ListExperiences**

In `application/src/use-cases/experience/ListExperiences.ts`, update `toExperienceDto` to include the new fields. Since `toExperienceDto` only takes a domain `Experience` and the company data needs to come from somewhere, we need to decide how to handle it.

The simplest approach: `toExperienceDto` sets `company: null` — the eagerly-loaded company DTO is populated at the repository/use-case level for the link/unlink responses. For the list endpoint, we'll update the repository to provide company data alongside experiences.

Update `toExperienceDto`:

```typescript
export function toExperienceDto(exp: Experience, company?: CompanyDto | null): ExperienceDto {
  return {
    id: exp.id.value,
    title: exp.title,
    companyName: exp.companyName,
    companyWebsite: exp.companyWebsite,
    companyId: exp.companyId,
    company: company ?? null,
    location: exp.location,
    startDate: exp.startDate,
    endDate: exp.endDate,
    summary: exp.summary,
    ordinal: exp.ordinal,
    accomplishments: exp.accomplishments.map(toAccomplishmentDto)
  };
}
```

Add import:
```typescript
import type { Accomplishment, CompanyRepository, Experience, ExperienceRepository } from '@tailoredin/domain';
import type { AccomplishmentDto, ExperienceDto } from '../../dtos/ExperienceDto.js';
import type { CompanyDto } from '../../dtos/CompanyDto.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';
```

Update `ListExperiences` to take `CompanyRepository` and eagerly load companies:

```typescript
import { CompanyId, type Accomplishment, type CompanyRepository, type Experience, type ExperienceRepository } from '@tailoredin/domain';
import type { AccomplishmentDto, ExperienceDto } from '../../dtos/ExperienceDto.js';
import type { CompanyDto } from '../../dtos/CompanyDto.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';

export class ListExperiences {
  public constructor(
    private readonly experienceRepository: ExperienceRepository,
    private readonly companyRepository: CompanyRepository
  ) {}

  public async execute(): Promise<ExperienceDto[]> {
    const experiences = await this.experienceRepository.findAll();
    const companyIds = [...new Set(experiences.map(e => e.companyId).filter(Boolean))] as string[];
    const companies = await Promise.all(companyIds.map(id => this.companyRepository.findById(new CompanyId(id))));
    const companyMap = new Map<string, CompanyDto>();
    for (const company of companies) {
      if (company) companyMap.set(company.id.value, toCompanyDto(company));
    }
    return experiences.map(exp => toExperienceDto(exp, exp.companyId ? companyMap.get(exp.companyId) : null));
  }
}
```

- [ ] **Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: May have errors in other use cases calling `toExperienceDto` — they pass only `exp`. Since we added `company` as optional with default `null`, existing callers still work.

Also, `ListExperiences` constructor now takes two params, so `container.ts` binding will need updating (Task 7).

- [ ] **Step 4: Commit**

```bash
git add application/src/dtos/ExperienceDto.ts application/src/use-cases/experience/ListExperiences.ts
git commit -m "feat(app): add companyId and company to ExperienceDto, update ListExperiences to eagerly load companies"
```

---

### Task 5: Application — LinkCompanyToExperience use case

**Files:**
- Create: `application/src/use-cases/experience/LinkCompanyToExperience.ts`
- Create: `application/test/use-cases/experience/LinkCompanyToExperience.test.ts`
- Modify: `application/src/use-cases/index.ts`

- [ ] **Step 1: Write the test**

Create `application/test/use-cases/experience/LinkCompanyToExperience.test.ts`:

```typescript
import { describe, expect, mock, test } from 'bun:test';
import {
  Company,
  CompanyId,
  EntityNotFoundError,
  Experience,
  ExperienceId,
  type CompanyRepository,
  type ExperienceRepository
} from '@tailoredin/domain';
import { LinkCompanyToExperience } from '../../../src/use-cases/experience/LinkCompanyToExperience.js';

const makeExperience = () =>
  new Experience({
    id: new ExperienceId('exp-1'),
    profileId: 'profile-1',
    title: 'Engineer',
    companyName: 'Acme Corp',
    companyWebsite: null,
    companyId: null,
    location: 'NYC',
    startDate: '2022-01',
    endDate: '2023-01',
    summary: null,
    ordinal: 0,
    accomplishments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

const makeCompany = () =>
  new Company({
    id: new CompanyId('company-1'),
    name: 'Acme Corp',
    description: null,
    website: 'https://acme.com',
    logoUrl: null,
    linkedinLink: null,
    businessType: null,
    industry: null,
    stage: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });

describe('LinkCompanyToExperience', () => {
  test('links a company to an experience', async () => {
    const experience = makeExperience();
    const company = makeCompany();
    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: mock(() => Promise.resolve(experience)),
      findAll: mock(() => Promise.resolve([])),
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve())
    };
    const companyRepo: Partial<CompanyRepository> = {
      findById: mock(() => Promise.resolve(company))
    };

    const useCase = new LinkCompanyToExperience(experienceRepo, companyRepo as CompanyRepository);
    const result = await useCase.execute({ experienceId: 'exp-1', companyId: 'company-1' });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.companyId).toBe('company-1');
      expect(result.value.company).not.toBeNull();
      expect(result.value.company!.name).toBe('Acme Corp');
    }
    expect(experienceRepo.save).toHaveBeenCalled();
  });

  test('returns error when experience not found', async () => {
    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: mock(() => { throw new EntityNotFoundError('Experience', 'exp-1'); }),
      findAll: mock(() => Promise.resolve([])),
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve())
    };
    const companyRepo: Partial<CompanyRepository> = {
      findById: mock(() => Promise.resolve(null))
    };

    const useCase = new LinkCompanyToExperience(experienceRepo, companyRepo as CompanyRepository);
    const result = await useCase.execute({ experienceId: 'exp-1', companyId: 'company-1' });

    expect(result.isOk).toBe(false);
  });

  test('returns error when company not found', async () => {
    const experience = makeExperience();
    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: mock(() => Promise.resolve(experience)),
      findAll: mock(() => Promise.resolve([])),
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve())
    };
    const companyRepo: Partial<CompanyRepository> = {
      findById: mock(() => Promise.resolve(null))
    };

    const useCase = new LinkCompanyToExperience(experienceRepo, companyRepo as CompanyRepository);
    const result = await useCase.execute({ experienceId: 'exp-1', companyId: 'company-1' });

    expect(result.isOk).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test application/test/use-cases/experience/LinkCompanyToExperience.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the use case**

Create `application/src/use-cases/experience/LinkCompanyToExperience.ts`:

```typescript
import {
  CompanyId,
  EntityNotFoundError,
  type CompanyRepository,
  type Experience,
  type ExperienceRepository,
  err,
  ok,
  type Result
} from '@tailoredin/domain';
import { toCompanyDto } from '../../dtos/CompanyDto.js';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';
import { toExperienceDto } from './ListExperiences.js';

export type LinkCompanyToExperienceInput = {
  experienceId: string;
  companyId: string;
};

export class LinkCompanyToExperience {
  public constructor(
    private readonly experienceRepository: ExperienceRepository,
    private readonly companyRepository: CompanyRepository
  ) {}

  public async execute(input: LinkCompanyToExperienceInput): Promise<Result<ExperienceDto, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }

    const company = await this.companyRepository.findById(new CompanyId(input.companyId));
    if (!company) return err(new EntityNotFoundError('Company', input.companyId));

    experience.linkCompany(input.companyId);
    await this.experienceRepository.save(experience);

    return ok(toExperienceDto(experience, toCompanyDto(company)));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test application/test/use-cases/experience/LinkCompanyToExperience.test.ts`
Expected: PASS

- [ ] **Step 5: Add barrel export**

In `application/src/use-cases/index.ts`, add:

```typescript
export type { LinkCompanyToExperienceInput } from './experience/LinkCompanyToExperience.js';
export { LinkCompanyToExperience } from './experience/LinkCompanyToExperience.js';
```

- [ ] **Step 6: Commit**

```bash
git add application/src/use-cases/experience/LinkCompanyToExperience.ts application/test/use-cases/experience/LinkCompanyToExperience.test.ts application/src/use-cases/index.ts
git commit -m "feat(app): add LinkCompanyToExperience use case with tests"
```

---

### Task 6: Application — UnlinkCompanyFromExperience use case

**Files:**
- Create: `application/src/use-cases/experience/UnlinkCompanyFromExperience.ts`
- Create: `application/test/use-cases/experience/UnlinkCompanyFromExperience.test.ts`
- Modify: `application/src/use-cases/index.ts`

- [ ] **Step 1: Write the test**

Create `application/test/use-cases/experience/UnlinkCompanyFromExperience.test.ts`:

```typescript
import { describe, expect, mock, test } from 'bun:test';
import {
  EntityNotFoundError,
  Experience,
  ExperienceId,
  type ExperienceRepository
} from '@tailoredin/domain';
import { UnlinkCompanyFromExperience } from '../../../src/use-cases/experience/UnlinkCompanyFromExperience.js';

const makeLinkedExperience = () =>
  new Experience({
    id: new ExperienceId('exp-1'),
    profileId: 'profile-1',
    title: 'Engineer',
    companyName: 'Acme Corp',
    companyWebsite: null,
    companyId: 'company-1',
    location: 'NYC',
    startDate: '2022-01',
    endDate: '2023-01',
    summary: null,
    ordinal: 0,
    accomplishments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

describe('UnlinkCompanyFromExperience', () => {
  test('unlinks a company from an experience', async () => {
    const experience = makeLinkedExperience();
    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: mock(() => Promise.resolve(experience)),
      findAll: mock(() => Promise.resolve([])),
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve())
    };

    const useCase = new UnlinkCompanyFromExperience(experienceRepo);
    const result = await useCase.execute({ experienceId: 'exp-1' });

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.companyId).toBeNull();
      expect(result.value.company).toBeNull();
    }
    expect(experienceRepo.save).toHaveBeenCalled();
  });

  test('returns error when experience not found', async () => {
    const experienceRepo: ExperienceRepository = {
      findByIdOrFail: mock(() => { throw new EntityNotFoundError('Experience', 'exp-1'); }),
      findAll: mock(() => Promise.resolve([])),
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve())
    };

    const useCase = new UnlinkCompanyFromExperience(experienceRepo);
    const result = await useCase.execute({ experienceId: 'exp-1' });

    expect(result.isOk).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test application/test/use-cases/experience/UnlinkCompanyFromExperience.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the use case**

Create `application/src/use-cases/experience/UnlinkCompanyFromExperience.ts`:

```typescript
import {
  EntityNotFoundError,
  type Experience,
  type ExperienceRepository,
  err,
  ok,
  type Result
} from '@tailoredin/domain';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';
import { toExperienceDto } from './ListExperiences.js';

export type UnlinkCompanyFromExperienceInput = {
  experienceId: string;
};

export class UnlinkCompanyFromExperience {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: UnlinkCompanyFromExperienceInput): Promise<Result<ExperienceDto, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch (e) {
      if (e instanceof EntityNotFoundError) return err(e);
      throw e;
    }

    experience.unlinkCompany();
    await this.experienceRepository.save(experience);

    return ok(toExperienceDto(experience));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test application/test/use-cases/experience/UnlinkCompanyFromExperience.test.ts`
Expected: PASS

- [ ] **Step 5: Add barrel export**

In `application/src/use-cases/index.ts`, add:

```typescript
export type { UnlinkCompanyFromExperienceInput } from './experience/UnlinkCompanyFromExperience.js';
export { UnlinkCompanyFromExperience } from './experience/UnlinkCompanyFromExperience.js';
```

- [ ] **Step 6: Commit**

```bash
git add application/src/use-cases/experience/UnlinkCompanyFromExperience.ts application/test/use-cases/experience/UnlinkCompanyFromExperience.test.ts application/src/use-cases/index.ts
git commit -m "feat(app): add UnlinkCompanyFromExperience use case with tests"
```

---

### Task 7: API — DI wiring + routes

**Files:**
- Modify: `infrastructure/src/DI.ts`
- Create: `api/src/routes/experience/LinkCompanyRoute.ts`
- Create: `api/src/routes/experience/UnlinkCompanyRoute.ts`
- Modify: `api/src/container.ts`
- Modify: `api/src/index.ts`

- [ ] **Step 1: Add DI tokens**

In `infrastructure/src/DI.ts`, add imports:

```typescript
import type {
  // ... existing imports ...
  LinkCompanyToExperience,
  UnlinkCompanyFromExperience
} from '@tailoredin/application';
```

Add to `Experience` namespace after `DeleteAccomplishment`:

```typescript
LinkCompany: new InjectionToken<LinkCompanyToExperience>('DI.Experience.LinkCompany'),
UnlinkCompany: new InjectionToken<UnlinkCompanyFromExperience>('DI.Experience.UnlinkCompany')
```

- [ ] **Step 2: Create LinkCompanyRoute**

Create `api/src/routes/experience/LinkCompanyRoute.ts`:

```typescript
import { inject, injectable } from '@needle-di/core';
import type { LinkCompanyToExperience } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class LinkCompanyRoute {
  public constructor(private readonly linkCompany: LinkCompanyToExperience = inject(DI.Experience.LinkCompany)) {}

  public plugin() {
    return new Elysia().put(
      '/experiences/:id/company',
      async ({ params, body, set }) => {
        const result = await this.linkCompany.execute({
          experienceId: params.id,
          companyId: body.company_id
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({ company_id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
```

- [ ] **Step 3: Create UnlinkCompanyRoute**

Create `api/src/routes/experience/UnlinkCompanyRoute.ts`:

```typescript
import { inject, injectable } from '@needle-di/core';
import type { UnlinkCompanyFromExperience } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UnlinkCompanyRoute {
  public constructor(
    private readonly unlinkCompany: UnlinkCompanyFromExperience = inject(DI.Experience.UnlinkCompany)
  ) {}

  public plugin() {
    return new Elysia().delete(
      '/experiences/:id/company',
      async ({ params, set }) => {
        const result = await this.unlinkCompany.execute({
          experienceId: params.id
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) })
      }
    );
  }
}
```

- [ ] **Step 4: Wire in container.ts**

In `api/src/container.ts`, add imports:

```typescript
import {
  // ... existing ...
  LinkCompanyToExperience,
  UnlinkCompanyFromExperience
} from '@tailoredin/application';
```

Update the existing `ListExperiences` binding (now takes two params):

```typescript
container.bind({
  provide: DI.Experience.List,
  useFactory: () => new ListExperiences(container.get(DI.Experience.Repository), container.get(DI.Company.Repository))
});
```

Add new bindings after the existing Experience section:

```typescript
container.bind({
  provide: DI.Experience.LinkCompany,
  useFactory: () => new LinkCompanyToExperience(container.get(DI.Experience.Repository), container.get(DI.Company.Repository))
});
container.bind({
  provide: DI.Experience.UnlinkCompany,
  useFactory: () => new UnlinkCompanyFromExperience(container.get(DI.Experience.Repository))
});
```

- [ ] **Step 5: Mount routes in index.ts**

In `api/src/index.ts`, add imports:

```typescript
import { LinkCompanyRoute } from './routes/experience/LinkCompanyRoute.js';
import { UnlinkCompanyRoute } from './routes/experience/UnlinkCompanyRoute.js';
```

Add after the `DeleteAccomplishmentRoute` line in the Elysia chain:

```typescript
.use(container.get(LinkCompanyRoute).plugin())
.use(container.get(UnlinkCompanyRoute).plugin())
```

- [ ] **Step 6: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add infrastructure/src/DI.ts api/src/routes/experience/LinkCompanyRoute.ts api/src/routes/experience/UnlinkCompanyRoute.ts api/src/container.ts api/src/index.ts
git commit -m "feat(api): add link/unlink company routes with DI wiring"
```

---

### Task 8: Fix callers — Update CreateExperience use case

**Files:**
- Modify: `application/src/use-cases/experience/CreateExperience.ts`

Since `ExperienceCreateProps` now requires `companyId`, the `CreateExperience` use case needs updating. Currently `execute` passes `input` directly to `Experience.create(input)`, but `CreateExperienceInput` doesn't have `companyId`.

- [ ] **Step 1: Update the factory call**

In `application/src/use-cases/experience/CreateExperience.ts`, change line 21:

```typescript
// Before:
const experience = Experience.create(input);

// After:
const experience = Experience.create({ ...input, companyId: null });
```

No change to `CreateExperienceInput` type — `companyId` is not part of creation input.

- [ ] **Step 2: Run all application tests**

Run: `bun test application/`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add application/src/use-cases/experience/CreateExperience.ts
git commit -m "fix(app): pass companyId: null when creating new experiences"
```

---

### Task 9: Frontend — Update hooks and types

**Files:**
- Modify: `web/src/hooks/use-experiences.ts`

- [ ] **Step 1: Update `Experience` type**

In `web/src/hooks/use-experiences.ts`, update the `Experience` type:

```typescript
import type { Company } from './use-companies';

export type Experience = {
  id: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyId: string | null;
  company: Company | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
  accomplishments: AccomplishmentDto[];
};
```

- [ ] **Step 2: Add `useLinkCompany` hook**

```typescript
export function useLinkCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { experienceId: string; companyId: string }) => {
      const segment = api.experiences as AnyRouteSegment;
      const { data, error } = await segment({ id: input.experienceId }).company.put({
        company_id: input.companyId
      });
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to link company');
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    }
  });
}
```

- [ ] **Step 3: Add `useUnlinkCompany` hook**

```typescript
export function useUnlinkCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (experienceId: string) => {
      const segment = api.experiences as AnyRouteSegment;
      const { data, error } = await segment({ id: experienceId }).company.delete();
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to unlink company');
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    }
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add web/src/hooks/use-experiences.ts
git commit -m "feat(web): add useLinkCompany and useUnlinkCompany hooks, update Experience type"
```

---

### Task 10: Frontend — ExperienceCard with company logo

**Files:**
- Modify: `web/src/components/resume/experience/ExperienceCard.tsx`

- [ ] **Step 1: Update ExperienceCard to show logo when linked**

In `web/src/components/resume/experience/ExperienceCard.tsx`:

Add import:
```typescript
import { Link2 } from 'lucide-react';
```

Replace the company name line:
```tsx
<p className="font-medium truncate">{experience.companyName}</p>
```

With:
```tsx
<div className="flex items-center gap-2">
  {experience.company?.logoUrl ? (
    <img
      src={experience.company.logoUrl}
      alt=""
      className="h-5 w-5 rounded object-contain shrink-0"
      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  ) : experience.company ? (
    <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-medium shrink-0">
      {experience.companyName.slice(0, 2).toUpperCase()}
    </span>
  ) : null}
  <p className="font-medium truncate">{experience.companyName}</p>
  {experience.company && <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/resume/experience/ExperienceCard.tsx
git commit -m "feat(web): show company logo and link icon on ExperienceCard"
```

---

### Task 11: Frontend — CompanyFormModal `onCreated` callback

**Files:**
- Modify: `web/src/components/companies/CompanyFormModal.tsx`

- [ ] **Step 1: Add `onCreated` prop**

In `web/src/components/companies/CompanyFormModal.tsx`, update the `Props` interface:

```typescript
interface Props {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly company?: Company;
  readonly onCreated?: (company: Company) => void;
}
```

Update the function signature:
```typescript
export function CompanyFormModal({ open, onOpenChange, company, onCreated }: Props) {
```

In `handleSave`, update the `onSuccess` callback for the create case. Replace:
```typescript
onSuccess: () => {
  resetAll();
  onOpenChange(false);
  toast.success(isEdit ? 'Company updated' : 'Company created');
},
```

With:
```typescript
onSuccess: (result) => {
  resetAll();
  onOpenChange(false);
  toast.success(isEdit ? 'Company updated' : 'Company created');
  if (!isEdit && onCreated && result) {
    onCreated(result as Company);
  }
},
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/companies/CompanyFormModal.tsx
git commit -m "feat(web): add onCreated callback to CompanyFormModal"
```

---

### Task 12: Frontend — CompanySearchPopover component

**Files:**
- Create: `web/src/components/resume/experience/CompanySearchPopover.tsx`

- [ ] **Step 1: Create the popover component**

Create `web/src/components/resume/experience/CompanySearchPopover.tsx`:

```tsx
import { Link2, Link2Off, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CompanyFormModal } from '@/components/companies/CompanyFormModal.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Company } from '@/hooks/use-companies';
import { useCompanies } from '@/hooks/use-companies';

interface Props {
  readonly linkedCompany: Company | null;
  readonly onLink: (company: Company) => void;
  readonly onUnlink: () => void;
  readonly disabled?: boolean;
}

export function CompanySearchPopover({ linkedCompany, onLink, onUnlink, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const { data: companies = [] } = useCompanies();

  const filtered = useMemo(() => {
    if (!search.trim()) return companies.slice(0, 8);
    const lower = search.toLowerCase();
    return companies.filter(c => c.name.toLowerCase().includes(lower)).slice(0, 8);
  }, [companies, search]);

  function handleSelect(company: Company) {
    onLink(company);
    setOpen(false);
    setSearch('');
  }

  function handleCreated(company: Company) {
    onLink(company);
    setCreateOpen(false);
    setOpen(false);
    setSearch('');
  }

  if (linkedCompany) {
    return (
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0"
        onClick={onUnlink}
        disabled={disabled}
        title="Unlink company"
      >
        <Link2Off className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            disabled={disabled}
            title="Link to a company"
          >
            <Link2 className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <div className="flex items-center gap-1.5 px-1 pb-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search companies..."
              className="h-7 text-sm border-0 shadow-none focus-visible:ring-0 px-0"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filtered.map(company => (
              <button
                type="button"
                key={company.id}
                onClick={() => handleSelect(company)}
                className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
              >
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt=""
                    className="h-5 w-5 rounded object-contain shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-medium shrink-0">
                    {company.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{company.name}</p>
                  {company.website && (
                    <p className="truncate text-xs text-muted-foreground">{company.website}</p>
                  )}
                </div>
              </button>
            ))}
            {filtered.length === 0 && search.trim() && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">No companies found</p>
            )}
          </div>
          <div className="border-t mt-1 pt-1">
            <button
              type="button"
              onClick={() => { setOpen(false); setCreateOpen(true); }}
              className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2 text-muted-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Create new company
            </button>
          </div>
        </PopoverContent>
      </Popover>
      <CompanyFormModal open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
    </>
  );
}
```

- [ ] **Step 2: Verify Popover component exists**

Run: `ls web/src/components/ui/popover.tsx`

If it doesn't exist, install it: `cd web && bunx shadcn@latest add popover`

- [ ] **Step 3: Commit**

```bash
git add web/src/components/resume/experience/CompanySearchPopover.tsx
git commit -m "feat(web): create CompanySearchPopover component"
```

---

### Task 13: Frontend — Integrate popover + sync suggestions into ExperienceFormModal

**Files:**
- Modify: `web/src/components/resume/experience/ExperienceFormModal.tsx`

- [ ] **Step 1: Add company link state and imports**

Add imports:
```typescript
import type { Company } from '@/hooks/use-companies';
import { useLinkCompany, useUnlinkCompany } from '@/hooks/use-experiences';
import { CompanySearchPopover } from './CompanySearchPopover.js';
```

Inside `ExperienceFormModal`, add state and mutations after the existing hooks:

```typescript
const linkCompany = useLinkCompany();
const unlinkCompany = useUnlinkCompany();

const [linkedCompany, setLinkedCompany] = useState<Company | null>(
  modalMode.mode === 'edit' ? modalMode.experience.company : null
);
```

Update `isSaving` to include link/unlink:
```typescript
const isSaving = createExperience.isPending || updateExperience.isPending || linkCompany.isPending || unlinkCompany.isPending;
```

- [ ] **Step 2: Add link/unlink handlers**

```typescript
function handleLinkCompany(company: Company) {
  if (!experience) return;
  linkCompany.mutate(
    { experienceId: experience.id, companyId: company.id },
    {
      onSuccess: () => {
        setLinkedCompany(company);
        toast.success(`Linked to ${company.name}`);
      },
      onError: () => toast.error('Failed to link company')
    }
  );
}

function handleUnlinkCompany() {
  if (!experience) return;
  unlinkCompany.mutate(experience.id, {
    onSuccess: () => {
      setLinkedCompany(null);
      toast.success('Company unlinked');
    },
    onError: () => toast.error('Failed to unlink company')
  });
}
```

- [ ] **Step 3: Replace the Company text field with compound field**

Replace the existing Company `EditableField`:
```tsx
<EditableField
  type="text"
  label="Company"
  required
  value={current.companyName}
  onChange={v => setField('companyName', v)}
  isDirty={isDirtyField('companyName')}
  error={errors.companyName}
  disabled={isSaving}
  placeholder="e.g. Acme Corp"
/>
```

With:
```tsx
<div>
  <div className="flex items-end gap-1">
    <div className="flex-1">
      <EditableField
        type="text"
        label="Company"
        required
        value={current.companyName}
        onChange={v => setField('companyName', v)}
        isDirty={isDirtyField('companyName')}
        error={errors.companyName}
        disabled={isSaving}
        placeholder="e.g. Acme Corp"
      />
    </div>
    {experience && (
      <CompanySearchPopover
        linkedCompany={linkedCompany}
        onLink={handleLinkCompany}
        onUnlink={handleUnlinkCompany}
        disabled={isSaving}
      />
    )}
  </div>
  {linkedCompany && linkedCompany.name !== current.companyName && (
    <button
      type="button"
      className="mt-1 text-xs text-primary hover:underline"
      onClick={() => setField('companyName', linkedCompany.name)}
    >
      Use "{linkedCompany.name}"?
    </button>
  )}
</div>
```

- [ ] **Step 4: Add sync suggestion for website**

After the Company Website `EditableField`, add:

```tsx
{linkedCompany?.website && linkedCompany.website !== current.companyWebsite && (
  <button
    type="button"
    className="mt-1 text-xs text-primary hover:underline"
    onClick={() => setField('companyWebsite', linkedCompany.website!)}
  >
    Use "{linkedCompany.website}"?
  </button>
)}
```

- [ ] **Step 5: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add web/src/components/resume/experience/ExperienceFormModal.tsx
git commit -m "feat(web): integrate CompanySearchPopover and sync suggestions into ExperienceFormModal"
```

---

### Task 14: Quality checks + fix any issues

**Files:** All modified files

- [ ] **Step 1: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 2: Run lint/format**

Run: `bun run check`

If issues found, fix with: `bun run check:fix`

- [ ] **Step 3: Run unit tests**

Run: `bun run test`
Expected: All PASS

- [ ] **Step 4: Run architecture boundary check**

Run: `bun run dep:check`
Expected: PASS — no dependency violations

- [ ] **Step 5: Run knip (dead code detection)**

Run: `bun run knip`
Expected: No new unused exports

- [ ] **Step 6: Fix any issues found and commit**

```bash
git add -A
git commit -m "chore: fix lint/type issues from experience-company link feature"
```

---

### Task 15: Regenerate diagrams + final commit

**Files:** Diagram files

- [ ] **Step 1: Regenerate domain and application diagrams**

Run: `bun run domain:diagram && bun run app:diagram`

- [ ] **Step 2: Commit diagram changes**

```bash
git add domain/DOMAIN.mmd application/APPLICATION.mmd
git commit -m "chore: regenerate domain and application diagrams"
```

- [ ] **Step 3: Run git status to check for unstaged files**

Run: `git status`
Expected: Clean working tree
