# S5: Experience Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old 3-level experience hierarchy (ResumeCompany/Position/Bullet) with the new domain model (Experience/Bullet/BulletVariant) including manual tag assignment and variant approval workflow.

**Architecture:** Full vertical slice — domain entities (TDD) → application use cases + DTOs → infrastructure ORM entities + repository → API routes (Elysia) → web UI (React + TanStack). All work in worktree `.claude/worktrees/dr-s5-experience`. Tables already exist from S0 migration.

**Tech Stack:** Bun, TypeScript, MikroORM/PostgreSQL, Elysia, React 19 + TanStack Router/Query + shadcn/ui

**Spec:** `docs/superpowers/specs/2026-03-31-domain-rethink-design.md` (Experience/Bullet/BulletVariant) and `docs/superpowers/specs/2026-04-01-domain-rethink-vertical-slices.md` (S5 section)

---

## File Structure

### Domain Layer (`domain/src/`)

**New entities:**
- `entities/BulletVariant.ts` — entity under Bullet: alternative phrasing with TagSet, approval status, source
- `entities/Bullet.ts` — entity under Experience: canonical achievement with TagSet, manages variants
- `entities/Experience.ts` — aggregate root: role at company with bullets

**New port:**
- `ports/ExperienceRepository.ts` — CRUD interface for Experience aggregate

**New tests:**
- `test/entities/BulletVariant.test.ts`
- `test/entities/Bullet.test.ts`
- `test/entities/Experience.test.ts`

### Application Layer (`application/src/`)

**New DTOs:**
- `dtos/ExperienceDto.ts` — ExperienceDto, BulletDto, BulletVariantDto

**New use cases (in `use-cases/experience/`):**
- `CreateExperience.ts`, `UpdateExperience.ts`, `DeleteExperience.ts`, `ListExperiences.ts`
- `AddBullet2.ts`, `UpdateBullet2.ts`, `DeleteBullet2.ts`
- `AddBulletVariant.ts`, `UpdateBulletVariant.ts`, `DeleteBulletVariant.ts`, `ApproveBulletVariant.ts`

### Infrastructure Layer (`infrastructure/src/`)

**New ORM entities (in `db/entities/experience/`):**
- `Experience.ts`, `Bullet.ts`, `BulletTag.ts`, `BulletVariant.ts`, `BulletVariantTag.ts`

**New repository:**
- `repositories/PostgresExperienceRepository.ts`

### API Layer (`api/src/`)

**New routes (in `routes/experience/`):**
- `ListExperiencesRoute.ts`, `CreateExperienceRoute.ts`, `UpdateExperienceRoute.ts`, `DeleteExperienceRoute.ts`
- `AddBullet2Route.ts`, `UpdateBullet2Route.ts`, `DeleteBullet2Route.ts`
- `AddBulletVariantRoute.ts`, `UpdateBulletVariantRoute.ts`, `DeleteBulletVariantRoute.ts`
- `ApproveBulletVariantRoute.ts`, `RejectBulletVariantRoute.ts`

### Web Layer (`web/src/`)

**New/modified:**
- `hooks/use-experiences.ts` — TanStack Query hooks
- `routes/resume/experience.tsx` — full rewrite
- `lib/query-keys.ts` — add `experiences` key

**Deleted:**
- `components/resume/experience/company-card.tsx`
- `components/resume/experience/company-form-dialog.tsx`
- `components/resume/experience/position-form-dialog.tsx`
- `components/resume/experience/bullet-list.tsx`
- `components/resume/experience/location-editor.tsx`
- `hooks/use-companies.ts`

---

## Tasks

### Task 1: BulletVariant Domain Entity (TDD)

**Files:**
- Create: `domain/test/entities/BulletVariant.test.ts`
- Create: `domain/src/entities/BulletVariant.ts`

- [ ] **Step 1: Write failing test**

```typescript
// domain/test/entities/BulletVariant.test.ts
import { describe, expect, test } from 'bun:test';
import { BulletVariant } from '../../src/entities/BulletVariant.js';
import { ApprovalStatus } from '../../src/value-objects/ApprovalStatus.js';
import { TagSet } from '../../src/value-objects/TagSet.js';

describe('BulletVariant', () => {
  test('creates with pending approval status for llm source', () => {
    const variant = BulletVariant.create({
      bulletId: 'bullet-1',
      text: 'Led migration of 3 services to Kubernetes',
      angle: 'leadership',
      tags: new TagSet({ roleTags: ['leadership'], skillTags: ['kubernetes'] }),
      source: 'llm'
    });
    expect(variant.text).toBe('Led migration of 3 services to Kubernetes');
    expect(variant.angle).toBe('leadership');
    expect(variant.approvalStatus).toBe(ApprovalStatus.PENDING);
    expect(variant.tags.roleTags).toEqual(['leadership']);
    expect(variant.tags.skillTags).toEqual(['kubernetes']);
    expect(variant.source).toBe('llm');
  });

  test('manual source starts approved', () => {
    const variant = BulletVariant.create({
      bulletId: 'bullet-1',
      text: 'text',
      angle: 'ic',
      tags: TagSet.empty(),
      source: 'manual'
    });
    expect(variant.approvalStatus).toBe(ApprovalStatus.APPROVED);
  });

  test('can be approved', () => {
    const variant = BulletVariant.create({
      bulletId: 'bullet-1',
      text: 'text',
      angle: 'ic',
      tags: TagSet.empty(),
      source: 'llm'
    });
    variant.approve();
    expect(variant.approvalStatus).toBe(ApprovalStatus.APPROVED);
  });

  test('can be rejected', () => {
    const variant = BulletVariant.create({
      bulletId: 'bullet-1',
      text: 'text',
      angle: 'ic',
      tags: TagSet.empty(),
      source: 'llm'
    });
    variant.reject();
    expect(variant.approvalStatus).toBe(ApprovalStatus.REJECTED);
  });

  test('updates text and angle', () => {
    const variant = BulletVariant.create({
      bulletId: 'bullet-1',
      text: 'original',
      angle: 'ic',
      tags: TagSet.empty(),
      source: 'manual'
    });
    variant.text = 'updated';
    variant.angle = 'leadership';
    expect(variant.text).toBe('updated');
    expect(variant.angle).toBe('leadership');
  });

  test('updates tags', () => {
    const variant = BulletVariant.create({
      bulletId: 'bullet-1',
      text: 'text',
      angle: 'ic',
      tags: TagSet.empty(),
      source: 'manual'
    });
    const newTags = new TagSet({ roleTags: ['leadership'], skillTags: ['react'] });
    variant.tags = newTags;
    expect(variant.tags.roleTags).toEqual(['leadership']);
    expect(variant.tags.skillTags).toEqual(['react']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd domain && bun test test/entities/BulletVariant.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement BulletVariant**

```typescript
// domain/src/entities/BulletVariant.ts
import { Entity } from '../Entity.js';
import { ApprovalStatus } from '../value-objects/ApprovalStatus.js';
import { BulletVariantId } from '../value-objects/BulletVariantId.js';
import type { TagSet } from '../value-objects/TagSet.js';

export type BulletVariantSource = 'llm' | 'manual';

export type BulletVariantCreateProps = {
  bulletId: string;
  text: string;
  angle: string;
  tags: TagSet;
  source: BulletVariantSource;
};

export class BulletVariant extends Entity<BulletVariantId> {
  public readonly bulletId: string;
  public text: string;
  public angle: string;
  public tags: TagSet;
  public readonly source: BulletVariantSource;
  public approvalStatus: ApprovalStatus;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: BulletVariantId;
    bulletId: string;
    text: string;
    angle: string;
    tags: TagSet;
    source: BulletVariantSource;
    approvalStatus: ApprovalStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.bulletId = props.bulletId;
    this.text = props.text;
    this.angle = props.angle;
    this.tags = props.tags;
    this.source = props.source;
    this.approvalStatus = props.approvalStatus;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public approve(): void {
    this.approvalStatus = ApprovalStatus.APPROVED;
    this.updatedAt = new Date();
  }

  public reject(): void {
    this.approvalStatus = ApprovalStatus.REJECTED;
    this.updatedAt = new Date();
  }

  public static create(props: BulletVariantCreateProps): BulletVariant {
    const now = new Date();
    return new BulletVariant({
      id: BulletVariantId.generate(),
      ...props,
      approvalStatus: props.source === 'manual' ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
      createdAt: now,
      updatedAt: now
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd domain && bun test test/entities/BulletVariant.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Export from domain barrel**

Add to `domain/src/index.ts`:
```typescript
export type { BulletVariantCreateProps, BulletVariantSource } from './entities/BulletVariant.js';
export { BulletVariant } from './entities/BulletVariant.js';
```

- [ ] **Step 6: Commit**

```bash
git add domain/src/entities/BulletVariant.ts domain/test/entities/BulletVariant.test.ts domain/src/index.ts
git commit -m "feat: add BulletVariant entity with approval workflow"
```

---

### Task 2: Bullet Domain Entity (TDD)

**Files:**
- Create: `domain/test/entities/Bullet.test.ts`
- Create: `domain/src/entities/Bullet.ts`

- [ ] **Step 1: Write failing test**

```typescript
// domain/test/entities/Bullet.test.ts
import { describe, expect, test } from 'bun:test';
import { Bullet } from '../../src/entities/Bullet.js';
import { ApprovalStatus } from '../../src/value-objects/ApprovalStatus.js';
import { TagSet } from '../../src/value-objects/TagSet.js';

describe('Bullet', () => {
  test('creates with canonical text and empty tags', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    expect(bullet.content).toBe('Built a thing');
    expect(bullet.tags.isEmpty).toBe(true);
    expect(bullet.variants).toEqual([]);
  });

  test('adds a variant', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    const variant = bullet.addVariant({
      text: 'Led team building a thing',
      angle: 'leadership',
      tags: new TagSet({ roleTags: ['leadership'], skillTags: [] }),
      source: 'llm'
    });
    expect(bullet.variants).toHaveLength(1);
    expect(variant.text).toBe('Led team building a thing');
    expect(variant.approvalStatus).toBe(ApprovalStatus.PENDING);
  });

  test('removes a variant', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    const variant = bullet.addVariant({
      text: 'text',
      angle: 'ic',
      tags: TagSet.empty(),
      source: 'llm'
    });
    bullet.removeVariant(variant.id.value);
    expect(bullet.variants).toHaveLength(0);
  });

  test('throws when removing non-existent variant', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    expect(() => bullet.removeVariant('nonexistent')).toThrow('Variant not found');
  });

  test('finds variant or fails', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    const variant = bullet.addVariant({
      text: 'text',
      angle: 'ic',
      tags: TagSet.empty(),
      source: 'manual'
    });
    const found = bullet.findVariantOrFail(variant.id.value);
    expect(found.id.equals(variant.id)).toBe(true);
  });

  test('approvedVariants filters correctly', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    const v1 = bullet.addVariant({ text: 'a', angle: 'ic', tags: TagSet.empty(), source: 'llm' });
    bullet.addVariant({ text: 'b', angle: 'lead', tags: TagSet.empty(), source: 'llm' });
    v1.approve();
    expect(bullet.approvedVariants).toHaveLength(1);
    expect(bullet.approvedVariants[0].text).toBe('a');
  });

  test('updates tags', () => {
    const bullet = Bullet.create({ experienceId: 'exp-1', content: 'Built a thing', ordinal: 0 });
    const tags = new TagSet({ roleTags: ['ic'], skillTags: ['typescript'] });
    bullet.updateTags(tags);
    expect(bullet.tags.roleTags).toEqual(['ic']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd domain && bun test test/entities/Bullet.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Bullet**

```typescript
// domain/src/entities/Bullet.ts
import { Entity } from '../Entity.js';
import { BulletId } from '../value-objects/BulletId.js';
import { TagSet } from '../value-objects/TagSet.js';
import type { BulletVariantSource } from './BulletVariant.js';
import { BulletVariant } from './BulletVariant.js';

export type BulletCreateProps = {
  experienceId: string;
  content: string;
  ordinal: number;
};

export class Bullet extends Entity<BulletId> {
  public readonly experienceId: string;
  public content: string;
  public ordinal: number;
  public tags: TagSet;
  public readonly variants: BulletVariant[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: BulletId;
    experienceId: string;
    content: string;
    ordinal: number;
    tags: TagSet;
    variants: BulletVariant[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.experienceId = props.experienceId;
    this.content = props.content;
    this.ordinal = props.ordinal;
    this.tags = props.tags;
    this.variants = props.variants;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public addVariant(props: {
    text: string;
    angle: string;
    tags: TagSet;
    source: BulletVariantSource;
  }): BulletVariant {
    const variant = BulletVariant.create({ bulletId: this.id.value, ...props });
    this.variants.push(variant);
    this.updatedAt = new Date();
    return variant;
  }

  public removeVariant(variantId: string): void {
    const index = this.variants.findIndex(v => v.id.value === variantId);
    if (index === -1) throw new Error(`Variant not found: ${variantId}`);
    this.variants.splice(index, 1);
    this.updatedAt = new Date();
  }

  public findVariantOrFail(variantId: string): BulletVariant {
    const variant = this.variants.find(v => v.id.value === variantId);
    if (!variant) throw new Error(`Variant not found: ${variantId}`);
    return variant;
  }

  public get approvedVariants(): BulletVariant[] {
    return this.variants.filter(v => v.approvalStatus === ApprovalStatus.APPROVED);
  }

  public updateTags(tags: TagSet): void {
    this.tags = tags;
    this.updatedAt = new Date();
  }

  public static create(props: BulletCreateProps): Bullet {
    const now = new Date();
    return new Bullet({
      id: BulletId.generate(),
      ...props,
      tags: TagSet.empty(),
      variants: [],
      createdAt: now,
      updatedAt: now
    });
  }
}

// Import needed for approvedVariants getter
import { ApprovalStatus } from '../value-objects/ApprovalStatus.js';
```

**Note:** Move the `ApprovalStatus` import to the top of the file with the other imports. It's shown at the bottom here for clarity about the dependency.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd domain && bun test test/entities/Bullet.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Export from domain barrel**

Add to `domain/src/index.ts`:
```typescript
export type { BulletCreateProps } from './entities/Bullet.js';
export { Bullet } from './entities/Bullet.js';
```

- [ ] **Step 6: Commit**

```bash
git add domain/src/entities/Bullet.ts domain/test/entities/Bullet.test.ts domain/src/index.ts
git commit -m "feat: add Bullet entity with variant management"
```

---

### Task 3: Experience Aggregate Root (TDD)

**Files:**
- Create: `domain/test/entities/Experience.test.ts`
- Create: `domain/src/entities/Experience.ts`
- Create: `domain/src/ports/ExperienceRepository.ts`

- [ ] **Step 1: Write failing test**

```typescript
// domain/test/entities/Experience.test.ts
import { describe, expect, test } from 'bun:test';
import { Experience } from '../../src/entities/Experience.js';

describe('Experience', () => {
  const makeExperience = () =>
    Experience.create({
      profileId: 'profile-1',
      title: 'Staff Engineer',
      companyName: 'Acme Corp',
      companyWebsite: 'https://acme.com',
      location: 'New York, NY',
      startDate: '2022-01',
      endDate: 'Present',
      summary: 'Led platform team',
      ordinal: 0
    });

  test('creates with empty bullets', () => {
    const exp = makeExperience();
    expect(exp.title).toBe('Staff Engineer');
    expect(exp.companyName).toBe('Acme Corp');
    expect(exp.bullets).toEqual([]);
  });

  test('adds a bullet', () => {
    const exp = makeExperience();
    const bullet = exp.addBullet({ content: 'Built the thing', ordinal: 0 });
    expect(exp.bullets).toHaveLength(1);
    expect(bullet.content).toBe('Built the thing');
    expect(bullet.experienceId).toBe(exp.id.value);
  });

  test('removes a bullet and its variants', () => {
    const exp = makeExperience();
    const bullet = exp.addBullet({ content: 'Built the thing', ordinal: 0 });
    exp.removeBullet(bullet.id.value);
    expect(exp.bullets).toHaveLength(0);
  });

  test('finds bullet or fails', () => {
    const exp = makeExperience();
    const bullet = exp.addBullet({ content: 'Built the thing', ordinal: 0 });
    const found = exp.findBulletOrFail(bullet.id.value);
    expect(found.id.equals(bullet.id)).toBe(true);
  });

  test('throws when removing non-existent bullet', () => {
    const exp = makeExperience();
    expect(() => exp.removeBullet('nonexistent')).toThrow('Bullet not found');
  });

  test('updates mutable fields', () => {
    const exp = makeExperience();
    exp.title = 'Principal Engineer';
    exp.companyName = 'NewCo';
    exp.location = 'Remote';
    expect(exp.title).toBe('Principal Engineer');
    expect(exp.companyName).toBe('NewCo');
    expect(exp.location).toBe('Remote');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd domain && bun test test/entities/Experience.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Experience**

```typescript
// domain/src/entities/Experience.ts
import { AggregateRoot } from '../AggregateRoot.js';
import { ExperienceId } from '../value-objects/ExperienceId.js';
import { Bullet } from './Bullet.js';

export type ExperienceCreateProps = {
  profileId: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
};

export class Experience extends AggregateRoot<ExperienceId> {
  public readonly profileId: string;
  public title: string;
  public companyName: string;
  public companyWebsite: string | null;
  public location: string;
  public startDate: string;
  public endDate: string;
  public summary: string | null;
  public ordinal: number;
  public readonly bullets: Bullet[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ExperienceId;
    profileId: string;
    title: string;
    companyName: string;
    companyWebsite: string | null;
    location: string;
    startDate: string;
    endDate: string;
    summary: string | null;
    ordinal: number;
    bullets: Bullet[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.title = props.title;
    this.companyName = props.companyName;
    this.companyWebsite = props.companyWebsite;
    this.location = props.location;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.summary = props.summary;
    this.ordinal = props.ordinal;
    this.bullets = props.bullets;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public addBullet(props: { content: string; ordinal: number }): Bullet {
    const bullet = Bullet.create({ experienceId: this.id.value, ...props });
    this.bullets.push(bullet);
    this.updatedAt = new Date();
    return bullet;
  }

  public removeBullet(bulletId: string): void {
    const index = this.bullets.findIndex(b => b.id.value === bulletId);
    if (index === -1) throw new Error(`Bullet not found: ${bulletId}`);
    this.bullets.splice(index, 1);
    this.updatedAt = new Date();
  }

  public findBulletOrFail(bulletId: string): Bullet {
    const bullet = this.bullets.find(b => b.id.value === bulletId);
    if (!bullet) throw new Error(`Bullet not found: ${bulletId}`);
    return bullet;
  }

  public static create(props: ExperienceCreateProps): Experience {
    const now = new Date();
    return new Experience({
      id: ExperienceId.generate(),
      ...props,
      bullets: [],
      createdAt: now,
      updatedAt: now
    });
  }
}
```

- [ ] **Step 4: Implement ExperienceRepository port**

```typescript
// domain/src/ports/ExperienceRepository.ts
import type { Experience } from '../entities/Experience.js';

export interface ExperienceRepository {
  findByIdOrFail(id: string): Promise<Experience>;
  findAll(): Promise<Experience[]>;
  save(experience: Experience): Promise<void>;
  delete(id: string): Promise<void>;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd domain && bun test test/entities/Experience.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 6: Export from domain barrel**

Add to `domain/src/index.ts`:
```typescript
export type { ExperienceCreateProps } from './entities/Experience.js';
export { Experience } from './entities/Experience.js';
export type { ExperienceRepository } from './ports/ExperienceRepository.js';
```

- [ ] **Step 7: Commit**

```bash
git add domain/src/entities/Experience.ts domain/test/entities/Experience.test.ts domain/src/ports/ExperienceRepository.ts domain/src/index.ts
git commit -m "feat: add Experience aggregate root with bullet management"
```

---

### Task 4: Application DTOs + Use Cases

**Files:**
- Create: `application/src/dtos/ExperienceDto.ts`
- Create: `application/src/use-cases/experience/ListExperiences.ts`
- Create: `application/src/use-cases/experience/CreateExperience.ts`
- Create: `application/src/use-cases/experience/UpdateExperience.ts`
- Create: `application/src/use-cases/experience/DeleteExperience.ts`
- Create: `application/src/use-cases/experience/AddBullet2.ts`
- Create: `application/src/use-cases/experience/UpdateBullet2.ts`
- Create: `application/src/use-cases/experience/DeleteBullet2.ts`
- Create: `application/src/use-cases/experience/AddBulletVariant.ts`
- Create: `application/src/use-cases/experience/UpdateBulletVariant.ts`
- Create: `application/src/use-cases/experience/DeleteBulletVariant.ts`
- Create: `application/src/use-cases/experience/ApproveBulletVariant.ts`
- Modify: `application/src/dtos/index.ts`
- Modify: `application/src/use-cases/index.ts`

- [ ] **Step 1: Create ExperienceDto**

```typescript
// application/src/dtos/ExperienceDto.ts
import type { TagDto } from './TagDto.js';

export type BulletVariantDto = {
  id: string;
  text: string;
  angle: string;
  source: string;
  approvalStatus: string;
  roleTags: TagDto[];
  skillTags: TagDto[];
};

export type BulletDto = {
  id: string;
  content: string;
  ordinal: number;
  roleTags: TagDto[];
  skillTags: TagDto[];
  variants: BulletVariantDto[];
};

export type ExperienceDto = {
  id: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
  bullets: BulletDto[];
};
```

- [ ] **Step 2: Create toExperienceDto helper and ListExperiences**

```typescript
// application/src/use-cases/experience/ListExperiences.ts
import type { Experience, ExperienceRepository } from '@tailoredin/domain';
import type { BulletDto, BulletVariantDto, ExperienceDto } from '../../dtos/ExperienceDto.js';

export class ListExperiences {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(): Promise<ExperienceDto[]> {
    const experiences = await this.experienceRepository.findAll();
    return experiences.map(toExperienceDto);
  }
}

export function toExperienceDto(exp: Experience): ExperienceDto {
  return {
    id: exp.id.value,
    title: exp.title,
    companyName: exp.companyName,
    companyWebsite: exp.companyWebsite,
    location: exp.location,
    startDate: exp.startDate,
    endDate: exp.endDate,
    summary: exp.summary,
    ordinal: exp.ordinal,
    bullets: exp.bullets.map(toBulletDto)
  };
}

function toBulletDto(bullet: { id: { value: string }; content: string; ordinal: number; tags: { roleTags: readonly string[]; skillTags: readonly string[] }; variants: readonly any[] }): BulletDto {
  return {
    id: bullet.id.value,
    content: bullet.content,
    ordinal: bullet.ordinal,
    roleTags: bullet.tags.roleTags.map(name => ({ id: '', name, dimension: 'ROLE' })),
    skillTags: bullet.tags.skillTags.map(name => ({ id: '', name, dimension: 'SKILL' })),
    variants: bullet.variants.map(toVariantDto)
  };
}

function toVariantDto(v: any): BulletVariantDto {
  return {
    id: v.id.value,
    text: v.text,
    angle: v.angle,
    source: v.source,
    approvalStatus: v.approvalStatus,
    roleTags: v.tags.roleTags.map((name: string) => ({ id: '', name, dimension: 'ROLE' })),
    skillTags: v.tags.skillTags.map((name: string) => ({ id: '', name, dimension: 'SKILL' })),
  };
}
```

- [ ] **Step 3: Create CreateExperience**

```typescript
// application/src/use-cases/experience/CreateExperience.ts
import { Experience, type ExperienceRepository } from '@tailoredin/domain';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';
import { toExperienceDto } from './ListExperiences.js';

export type CreateExperienceInput = {
  profileId: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
};

export class CreateExperience {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: CreateExperienceInput): Promise<ExperienceDto> {
    const experience = Experience.create(input);
    await this.experienceRepository.save(experience);
    return toExperienceDto(experience);
  }
}
```

- [ ] **Step 4: Create UpdateExperience**

```typescript
// application/src/use-cases/experience/UpdateExperience.ts
import { err, ok, type Result, type Experience, type ExperienceRepository } from '@tailoredin/domain';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';
import { toExperienceDto } from './ListExperiences.js';

export type UpdateExperienceInput = {
  experienceId: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
};

export class UpdateExperience {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: UpdateExperienceInput): Promise<Result<ExperienceDto, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    experience.title = input.title;
    experience.companyName = input.companyName;
    experience.companyWebsite = input.companyWebsite;
    experience.location = input.location;
    experience.startDate = input.startDate;
    experience.endDate = input.endDate;
    experience.summary = input.summary;
    experience.ordinal = input.ordinal;
    experience.updatedAt = new Date();

    await this.experienceRepository.save(experience);
    return ok(toExperienceDto(experience));
  }
}
```

- [ ] **Step 5: Create DeleteExperience**

```typescript
// application/src/use-cases/experience/DeleteExperience.ts
import { err, ok, type Result, type ExperienceRepository } from '@tailoredin/domain';

export type DeleteExperienceInput = {
  experienceId: string;
};

export class DeleteExperience {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: DeleteExperienceInput): Promise<Result<void, Error>> {
    try {
      await this.experienceRepository.delete(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }
    return ok(undefined);
  }
}
```

- [ ] **Step 6: Create AddBullet2**

```typescript
// application/src/use-cases/experience/AddBullet2.ts
import { err, ok, type Result, type Experience, type ExperienceRepository } from '@tailoredin/domain';
import type { BulletDto } from '../../dtos/ExperienceDto.js';

export type AddBullet2Input = {
  experienceId: string;
  content: string;
  ordinal: number;
};

export class AddBullet2 {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: AddBullet2Input): Promise<Result<BulletDto, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    const bullet = experience.addBullet({ content: input.content, ordinal: input.ordinal });
    await this.experienceRepository.save(experience);

    return ok({
      id: bullet.id.value,
      content: bullet.content,
      ordinal: bullet.ordinal,
      roleTags: [],
      skillTags: [],
      variants: []
    });
  }
}
```

- [ ] **Step 7: Create UpdateBullet2**

```typescript
// application/src/use-cases/experience/UpdateBullet2.ts
import { err, ok, type Result, type ExperienceRepository } from '@tailoredin/domain';

export type UpdateBullet2Input = {
  experienceId: string;
  bulletId: string;
  content: string;
  ordinal: number;
};

export class UpdateBullet2 {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: UpdateBullet2Input): Promise<Result<void, Error>> {
    let experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    const bullet = experience.findBulletOrFail(input.bulletId);
    bullet.content = input.content;
    bullet.ordinal = input.ordinal;
    bullet.updatedAt = new Date();

    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
```

- [ ] **Step 8: Create DeleteBullet2**

```typescript
// application/src/use-cases/experience/DeleteBullet2.ts
import { err, ok, type Result, type ExperienceRepository } from '@tailoredin/domain';

export type DeleteBullet2Input = {
  experienceId: string;
  bulletId: string;
};

export class DeleteBullet2 {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: DeleteBullet2Input): Promise<Result<void, Error>> {
    let experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    experience.removeBullet(input.bulletId);
    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
```

- [ ] **Step 9: Create AddBulletVariant**

```typescript
// application/src/use-cases/experience/AddBulletVariant.ts
import { err, ok, type Result, type ExperienceRepository, TagSet } from '@tailoredin/domain';
import type { BulletVariantDto } from '../../dtos/ExperienceDto.js';

export type AddBulletVariantInput = {
  experienceId: string;
  bulletId: string;
  text: string;
  angle: string;
  source: 'llm' | 'manual';
  roleTags: string[];
  skillTags: string[];
};

export class AddBulletVariant {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: AddBulletVariantInput): Promise<Result<BulletVariantDto, Error>> {
    let experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    const bullet = experience.findBulletOrFail(input.bulletId);
    const variant = bullet.addVariant({
      text: input.text,
      angle: input.angle,
      tags: new TagSet({ roleTags: input.roleTags, skillTags: input.skillTags }),
      source: input.source
    });

    await this.experienceRepository.save(experience);

    return ok({
      id: variant.id.value,
      text: variant.text,
      angle: variant.angle,
      source: variant.source,
      approvalStatus: variant.approvalStatus,
      roleTags: input.roleTags.map(name => ({ id: '', name, dimension: 'ROLE' })),
      skillTags: input.skillTags.map(name => ({ id: '', name, dimension: 'SKILL' }))
    });
  }
}
```

- [ ] **Step 10: Create UpdateBulletVariant**

```typescript
// application/src/use-cases/experience/UpdateBulletVariant.ts
import { err, ok, type Result, type ExperienceRepository, TagSet } from '@tailoredin/domain';

export type UpdateBulletVariantInput = {
  experienceId: string;
  bulletId: string;
  variantId: string;
  text: string;
  angle: string;
  roleTags: string[];
  skillTags: string[];
};

export class UpdateBulletVariant {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: UpdateBulletVariantInput): Promise<Result<void, Error>> {
    let experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    const bullet = experience.findBulletOrFail(input.bulletId);
    const variant = bullet.findVariantOrFail(input.variantId);
    variant.text = input.text;
    variant.angle = input.angle;
    variant.tags = new TagSet({ roleTags: input.roleTags, skillTags: input.skillTags });
    variant.updatedAt = new Date();

    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
```

- [ ] **Step 11: Create DeleteBulletVariant**

```typescript
// application/src/use-cases/experience/DeleteBulletVariant.ts
import { err, ok, type Result, type ExperienceRepository } from '@tailoredin/domain';

export type DeleteBulletVariantInput = {
  experienceId: string;
  bulletId: string;
  variantId: string;
};

export class DeleteBulletVariant {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: DeleteBulletVariantInput): Promise<Result<void, Error>> {
    let experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    const bullet = experience.findBulletOrFail(input.bulletId);
    bullet.removeVariant(input.variantId);
    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
```

- [ ] **Step 12: Create ApproveBulletVariant**

```typescript
// application/src/use-cases/experience/ApproveBulletVariant.ts
import { err, ok, type Result, type ExperienceRepository } from '@tailoredin/domain';

export type ApproveBulletVariantInput = {
  experienceId: string;
  bulletId: string;
  variantId: string;
  action: 'approve' | 'reject';
};

export class ApproveBulletVariant {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: ApproveBulletVariantInput): Promise<Result<void, Error>> {
    let experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    const bullet = experience.findBulletOrFail(input.bulletId);
    const variant = bullet.findVariantOrFail(input.variantId);

    if (input.action === 'approve') {
      variant.approve();
    } else {
      variant.reject();
    }

    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
```

- [ ] **Step 13: Update barrel exports**

Add to `application/src/dtos/index.ts`:
```typescript
export type { BulletDto, BulletVariantDto, ExperienceDto } from './ExperienceDto.js';
```

Add to `application/src/use-cases/index.ts`:
```typescript
export type { AddBullet2Input } from './experience/AddBullet2.js';
export { AddBullet2 } from './experience/AddBullet2.js';
export type { AddBulletVariantInput } from './experience/AddBulletVariant.js';
export { AddBulletVariant } from './experience/AddBulletVariant.js';
export type { ApproveBulletVariantInput } from './experience/ApproveBulletVariant.js';
export { ApproveBulletVariant } from './experience/ApproveBulletVariant.js';
export type { CreateExperienceInput } from './experience/CreateExperience.js';
export { CreateExperience } from './experience/CreateExperience.js';
export type { DeleteBullet2Input } from './experience/DeleteBullet2.js';
export { DeleteBullet2 } from './experience/DeleteBullet2.js';
export type { DeleteBulletVariantInput } from './experience/DeleteBulletVariant.js';
export { DeleteBulletVariant } from './experience/DeleteBulletVariant.js';
export type { DeleteExperienceInput } from './experience/DeleteExperience.js';
export { DeleteExperience } from './experience/DeleteExperience.js';
export { ListExperiences } from './experience/ListExperiences.js';
export type { UpdateBullet2Input } from './experience/UpdateBullet2.js';
export { UpdateBullet2 } from './experience/UpdateBullet2.js';
export type { UpdateBulletVariantInput } from './experience/UpdateBulletVariant.js';
export { UpdateBulletVariant } from './experience/UpdateBulletVariant.js';
export type { UpdateExperienceInput } from './experience/UpdateExperience.js';
export { UpdateExperience } from './experience/UpdateExperience.js';
```

- [ ] **Step 14: Verify**

Run: `cd application && bun run --cwd ../domain typecheck && bun run typecheck`
Expected: Clean (no type errors)

- [ ] **Step 15: Commit**

```bash
git add application/src/dtos/ExperienceDto.ts application/src/use-cases/experience/ application/src/dtos/index.ts application/src/use-cases/index.ts
git commit -m "feat: add Experience application layer — DTOs + 11 use cases"
```

---

### Task 5: Infrastructure ORM Entities

**Files:**
- Create: `infrastructure/src/db/entities/experience/Experience.ts`
- Create: `infrastructure/src/db/entities/experience/Bullet.ts`
- Create: `infrastructure/src/db/entities/experience/BulletTag.ts`
- Create: `infrastructure/src/db/entities/experience/BulletVariant.ts`
- Create: `infrastructure/src/db/entities/experience/BulletVariantTag.ts`

- [ ] **Step 1: Create Experience ORM entity**

```typescript
// infrastructure/src/db/entities/experience/Experience.ts
import { Collection, type Ref } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';
import { Profile } from '../profile/Profile.js';
import { Bullet } from './Bullet.js';

export type ExperienceOrmProps = {
  id: string;
  profile: Ref<Profile> | Profile;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'experiences' })
export class Experience extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Profile, { lazy: true, name: 'profile_id' })
  public readonly profile: Ref<Profile> | Profile;

  @Property({ name: 'title', type: 'text' })
  public title: string;

  @Property({ name: 'company_name', type: 'text' })
  public companyName: string;

  @Property({ name: 'company_website', type: 'text', nullable: true })
  public companyWebsite: string | null;

  @Property({ name: 'location', type: 'text' })
  public location: string;

  @Property({ name: 'start_date', type: 'text' })
  public startDate: string;

  @Property({ name: 'end_date', type: 'text' })
  public endDate: string;

  @Property({ name: 'summary', type: 'text', nullable: true })
  public summary: string | null;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  @OneToMany(
    () => Bullet,
    bullet => bullet.experience,
    { lazy: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly bullets: Collection<Bullet> = new Collection<Bullet>(this);

  public constructor(props: ExperienceOrmProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.profile = props.profile;
    this.title = props.title;
    this.companyName = props.companyName;
    this.companyWebsite = props.companyWebsite;
    this.location = props.location;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.summary = props.summary;
    this.ordinal = props.ordinal;
  }
}
```

- [ ] **Step 2: Create Bullet ORM entity**

```typescript
// infrastructure/src/db/entities/experience/Bullet.ts
import { Collection } from '@mikro-orm/core';
import { Entity, ManyToMany, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { Tag } from '../tag/Tag.js';
import { BulletVariant } from './BulletVariant.js';
import { Experience } from './Experience.js';

export type BulletOrmProps = {
  id: string;
  experience: RefOrEntity<Experience>;
  content: string;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'bullets' })
export class Bullet extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Experience, { lazy: true, name: 'experience_id' })
  public readonly experience: RefOrEntity<Experience>;

  @Property({ name: 'content', type: 'text' })
  public content: string;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  @ManyToMany(() => Tag, undefined, {
    pivotTable: 'bullet_tags',
    joinColumn: 'bullet_id',
    inverseJoinColumn: 'tag_id'
  })
  public tags = new Collection<Tag>(this);

  @OneToMany(
    () => BulletVariant,
    v => v.bullet,
    { lazy: true, orderBy: { createdAt: 'ASC' } }
  )
  public readonly variants: Collection<BulletVariant> = new Collection<BulletVariant>(this);

  public constructor(props: BulletOrmProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.experience = props.experience;
    this.content = props.content;
    this.ordinal = props.ordinal;
  }
}
```

- [ ] **Step 3: Create BulletVariant ORM entity**

```typescript
// infrastructure/src/db/entities/experience/BulletVariant.ts
import { Collection } from '@mikro-orm/core';
import { Entity, ManyToMany, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { Tag } from '../tag/Tag.js';
import { Bullet } from './Bullet.js';

export type BulletVariantOrmProps = {
  id: string;
  bullet: RefOrEntity<Bullet>;
  text: string;
  angle: string;
  source: string;
  approvalStatus: string;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'bullet_variants' })
export class BulletVariant extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Bullet, { lazy: true, name: 'bullet_id' })
  public readonly bullet: RefOrEntity<Bullet>;

  @Property({ name: 'text', type: 'text' })
  public text: string;

  @Property({ name: 'angle', type: 'text' })
  public angle: string;

  @Property({ name: 'source', type: 'text' })
  public source: string;

  @Property({ name: 'approval_status', type: 'text' })
  public approvalStatus: string;

  @ManyToMany(() => Tag, undefined, {
    pivotTable: 'bullet_variant_tags',
    joinColumn: 'bullet_variant_id',
    inverseJoinColumn: 'tag_id'
  })
  public tags = new Collection<Tag>(this);

  public constructor(props: BulletVariantOrmProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.bullet = props.bullet;
    this.text = props.text;
    this.angle = props.angle;
    this.source = props.source;
    this.approvalStatus = props.approvalStatus;
  }
}
```

- [ ] **Step 4: Register ORM entities in orm-config**

Check `infrastructure/src/db/orm-config.ts` for the entities array and add the three new entities. Import them and add to the array.

- [ ] **Step 5: Commit**

```bash
git add infrastructure/src/db/entities/experience/
git commit -m "feat: add Experience, Bullet, BulletVariant ORM entities"
```

---

### Task 6: PostgresExperienceRepository

**Files:**
- Create: `infrastructure/src/repositories/PostgresExperienceRepository.ts`
- Modify: `infrastructure/src/index.ts`

- [ ] **Step 1: Implement PostgresExperienceRepository**

```typescript
// infrastructure/src/repositories/PostgresExperienceRepository.ts
import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  Bullet as DomainBullet,
  BulletId,
  BulletVariant as DomainBulletVariant,
  BulletVariantId,
  Experience as DomainExperience,
  ExperienceId,
  type ExperienceRepository,
  TagSet,
  type ApprovalStatus,
  type BulletVariantSource,
  Tag as DomainTag,
  TagId,
  type TagDimension
} from '@tailoredin/domain';
import { Bullet as OrmBullet } from '../db/entities/experience/Bullet.js';
import { BulletVariant as OrmBulletVariant } from '../db/entities/experience/BulletVariant.js';
import { Experience as OrmExperience } from '../db/entities/experience/Experience.js';
import { Profile } from '../db/entities/profile/Profile.js';
import { Tag as OrmTag } from '../db/entities/tag/Tag.js';

@injectable()
export class PostgresExperienceRepository implements ExperienceRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<DomainExperience> {
    const orm = await this.orm.em.findOneOrFail(OrmExperience, id);
    return this.toDomain(orm);
  }

  public async findAll(): Promise<DomainExperience[]> {
    const ormExperiences = await this.orm.em.find(OrmExperience, {}, { orderBy: { ordinal: 'ASC' } });
    return Promise.all(ormExperiences.map(e => this.toDomain(e)));
  }

  public async save(experience: DomainExperience): Promise<void> {
    const existing = await this.orm.em.findOne(OrmExperience, experience.id.value);

    if (existing) {
      existing.title = experience.title;
      existing.companyName = experience.companyName;
      existing.companyWebsite = experience.companyWebsite;
      existing.location = experience.location;
      existing.startDate = experience.startDate;
      existing.endDate = experience.endDate;
      existing.summary = experience.summary;
      existing.ordinal = experience.ordinal;
      existing.updatedAt = experience.updatedAt;
      this.orm.em.persist(existing);
    } else {
      const profileRef = this.orm.em.getReference(Profile, experience.profileId);
      const orm = new OrmExperience({
        id: experience.id.value,
        profile: profileRef,
        title: experience.title,
        companyName: experience.companyName,
        companyWebsite: experience.companyWebsite,
        location: experience.location,
        startDate: experience.startDate,
        endDate: experience.endDate,
        summary: experience.summary,
        ordinal: experience.ordinal,
        createdAt: experience.createdAt,
        updatedAt: experience.updatedAt
      });
      this.orm.em.persist(orm);
    }

    await this.syncBullets(experience);
    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmExperience, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private async syncBullets(experience: DomainExperience): Promise<void> {
    const existingBullets = await this.orm.em.find(OrmBullet, { experience: experience.id.value });
    const domainBulletIds = new Set(experience.bullets.map(b => b.id.value));
    const existingBulletIds = new Set(existingBullets.map(b => b.id));

    // Remove deleted bullets
    for (const existing of existingBullets) {
      if (!domainBulletIds.has(existing.id)) {
        this.orm.em.remove(existing);
      }
    }

    // Upsert bullets
    for (const bullet of experience.bullets) {
      if (existingBulletIds.has(bullet.id.value)) {
        const ormBullet = existingBullets.find(b => b.id === bullet.id.value)!;
        ormBullet.content = bullet.content;
        ormBullet.ordinal = bullet.ordinal;
        ormBullet.updatedAt = bullet.updatedAt;
        this.orm.em.persist(ormBullet);
      } else {
        const expRef = this.orm.em.getReference(OrmExperience, experience.id.value);
        const ormBullet = new OrmBullet({
          id: bullet.id.value,
          experience: expRef,
          content: bullet.content,
          ordinal: bullet.ordinal,
          createdAt: bullet.createdAt,
          updatedAt: bullet.updatedAt
        });
        this.orm.em.persist(ormBullet);
      }

      // Sync bullet tags
      await this.syncBulletTags(bullet);
      // Sync variants
      await this.syncVariants(bullet);
    }
  }

  private async syncBulletTags(bullet: DomainBullet): Promise<void> {
    // Delete existing bullet_tags for this bullet
    await this.orm.em.getConnection().execute(
      `DELETE FROM bullet_tags WHERE bullet_id = '${bullet.id.value}'`
    );
    // Insert current tags by name lookup
    for (const tagName of [...bullet.tags.roleTags, ...bullet.tags.skillTags]) {
      const tag = await this.orm.em.findOne(OrmTag, { name: tagName });
      if (tag) {
        await this.orm.em.getConnection().execute(
          `INSERT INTO bullet_tags (bullet_id, tag_id) VALUES ('${bullet.id.value}', '${tag.id}') ON CONFLICT DO NOTHING`
        );
      }
    }
  }

  private async syncVariants(bullet: DomainBullet): Promise<void> {
    const existingVariants = await this.orm.em.find(OrmBulletVariant, { bullet: bullet.id.value });
    const domainVariantIds = new Set(bullet.variants.map(v => v.id.value));
    const existingVariantIds = new Set(existingVariants.map(v => v.id));

    for (const existing of existingVariants) {
      if (!domainVariantIds.has(existing.id)) {
        this.orm.em.remove(existing);
      }
    }

    for (const variant of bullet.variants) {
      if (existingVariantIds.has(variant.id.value)) {
        const ormVariant = existingVariants.find(v => v.id === variant.id.value)!;
        ormVariant.text = variant.text;
        ormVariant.angle = variant.angle;
        ormVariant.approvalStatus = variant.approvalStatus;
        ormVariant.updatedAt = variant.updatedAt;
        this.orm.em.persist(ormVariant);
      } else {
        const bulletRef = this.orm.em.getReference(OrmBullet, bullet.id.value);
        const ormVariant = new OrmBulletVariant({
          id: variant.id.value,
          bullet: bulletRef,
          text: variant.text,
          angle: variant.angle,
          source: variant.source,
          approvalStatus: variant.approvalStatus,
          createdAt: variant.createdAt,
          updatedAt: variant.updatedAt
        });
        this.orm.em.persist(ormVariant);
      }

      // Sync variant tags
      await this.syncVariantTags(variant);
    }
  }

  private async syncVariantTags(variant: DomainBulletVariant): Promise<void> {
    await this.orm.em.getConnection().execute(
      `DELETE FROM bullet_variant_tags WHERE bullet_variant_id = '${variant.id.value}'`
    );
    for (const tagName of [...variant.tags.roleTags, ...variant.tags.skillTags]) {
      const tag = await this.orm.em.findOne(OrmTag, { name: tagName });
      if (tag) {
        await this.orm.em.getConnection().execute(
          `INSERT INTO bullet_variant_tags (bullet_variant_id, tag_id) VALUES ('${variant.id.value}', '${tag.id}') ON CONFLICT DO NOTHING`
        );
      }
    }
  }

  private async toDomain(orm: OrmExperience): Promise<DomainExperience> {
    const [row] = await this.orm.em
      .getConnection()
      .execute<[{ profile_id: string }]>(`SELECT profile_id FROM experiences WHERE id = '${orm.id}'`);
    const profileId = row.profile_id;

    const ormBullets = await this.orm.em.find(OrmBullet, { experience: orm.id }, { orderBy: { ordinal: 'ASC' } });

    const bullets: DomainBullet[] = [];
    for (const ob of ormBullets) {
      // Load bullet tags
      const bulletTagRows = await this.orm.em.getConnection().execute<{ name: string; dimension: string; id: string }[]>(
        `SELECT t.id, t.name, t.dimension FROM tags t JOIN bullet_tags bt ON bt.tag_id = t.id WHERE bt.bullet_id = '${ob.id}'`
      );
      const bulletRoleTags = bulletTagRows.filter(t => t.dimension === 'ROLE').map(t => t.name);
      const bulletSkillTags = bulletTagRows.filter(t => t.dimension === 'SKILL').map(t => t.name);

      // Load variants
      const ormVariants = await this.orm.em.find(OrmBulletVariant, { bullet: ob.id }, { orderBy: { createdAt: 'ASC' } });
      const variants: DomainBulletVariant[] = [];

      for (const ov of ormVariants) {
        const variantTagRows = await this.orm.em.getConnection().execute<{ name: string; dimension: string; id: string }[]>(
          `SELECT t.id, t.name, t.dimension FROM tags t JOIN bullet_variant_tags bvt ON bvt.tag_id = t.id WHERE bvt.bullet_variant_id = '${ov.id}'`
        );
        const variantRoleTags = variantTagRows.filter(t => t.dimension === 'ROLE').map(t => t.name);
        const variantSkillTags = variantTagRows.filter(t => t.dimension === 'SKILL').map(t => t.name);

        variants.push(
          new DomainBulletVariant({
            id: new BulletVariantId(ov.id),
            bulletId: ob.id,
            text: ov.text,
            angle: ov.angle,
            source: ov.source as BulletVariantSource,
            approvalStatus: ov.approvalStatus as ApprovalStatus,
            tags: new TagSet({ roleTags: variantRoleTags, skillTags: variantSkillTags }),
            createdAt: ov.createdAt,
            updatedAt: ov.updatedAt
          })
        );
      }

      bullets.push(
        new DomainBullet({
          id: new BulletId(ob.id),
          experienceId: orm.id,
          content: ob.content,
          ordinal: ob.ordinal,
          tags: new TagSet({ roleTags: bulletRoleTags, skillTags: bulletSkillTags }),
          variants,
          createdAt: ob.createdAt,
          updatedAt: ob.updatedAt
        })
      );
    }

    return new DomainExperience({
      id: new ExperienceId(orm.id),
      profileId,
      title: orm.title,
      companyName: orm.companyName,
      companyWebsite: orm.companyWebsite,
      location: orm.location,
      startDate: orm.startDate,
      endDate: orm.endDate,
      summary: orm.summary,
      ordinal: orm.ordinal,
      bullets,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
```

- [ ] **Step 2: Export from infrastructure barrel**

Add to `infrastructure/src/index.ts`:
```typescript
export { PostgresExperienceRepository } from './repositories/PostgresExperienceRepository.js';
```

- [ ] **Step 3: Commit**

```bash
git add infrastructure/src/repositories/PostgresExperienceRepository.ts infrastructure/src/index.ts
git commit -m "feat: add PostgresExperienceRepository with nested bullet/variant sync"
```

---

### Task 7: DI Tokens + Composition Root

**Files:**
- Modify: `infrastructure/src/DI.ts`
- Modify: `api/src/container.ts`

- [ ] **Step 1: Add DI tokens**

Add to `infrastructure/src/DI.ts` — add imports for all new use case types, add `ExperienceRepository` to the domain imports, and add the Experience namespace:

```typescript
// Add to imports from @tailoredin/application:
// AddBullet2, AddBulletVariant, ApproveBulletVariant, CreateExperience,
// DeleteBullet2, DeleteBulletVariant, DeleteExperience, ListExperiences,
// UpdateBullet2, UpdateBulletVariant, UpdateExperience

// Add to imports from @tailoredin/domain:
// ExperienceRepository

// Add after SkillCategory section:
Experience: {
  Repository: new InjectionToken<ExperienceRepository>('DI.Experience.Repository'),
  List: new InjectionToken<ListExperiences>('DI.Experience.List'),
  Create: new InjectionToken<CreateExperience>('DI.Experience.Create'),
  Update: new InjectionToken<UpdateExperience>('DI.Experience.Update'),
  Delete: new InjectionToken<DeleteExperience>('DI.Experience.Delete'),
  AddBullet: new InjectionToken<AddBullet2>('DI.Experience.AddBullet'),
  UpdateBullet: new InjectionToken<UpdateBullet2>('DI.Experience.UpdateBullet'),
  DeleteBullet: new InjectionToken<DeleteBullet2>('DI.Experience.DeleteBullet'),
  AddVariant: new InjectionToken<AddBulletVariant>('DI.Experience.AddVariant'),
  UpdateVariant: new InjectionToken<UpdateBulletVariant>('DI.Experience.UpdateVariant'),
  DeleteVariant: new InjectionToken<DeleteBulletVariant>('DI.Experience.DeleteVariant'),
  ApproveVariant: new InjectionToken<ApproveBulletVariant>('DI.Experience.ApproveVariant'),
},
```

- [ ] **Step 2: Wire up in container.ts**

Add imports and bindings to `api/src/container.ts`:

```typescript
// Add to @tailoredin/application imports:
// AddBullet2, AddBulletVariant, ApproveBulletVariant, CreateExperience,
// DeleteBullet2, DeleteBulletVariant, DeleteExperience, ListExperiences,
// UpdateBullet2, UpdateBulletVariant, UpdateExperience

// Add to @tailoredin/infrastructure imports:
// PostgresExperienceRepository

// Add after SkillCategory bindings:
// Experience (new domain model)
container.bind({ provide: DI.Experience.Repository, useClass: PostgresExperienceRepository });
container.bind({
  provide: DI.Experience.List,
  useFactory: () => new ListExperiences(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.Create,
  useFactory: () => new CreateExperience(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.Update,
  useFactory: () => new UpdateExperience(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.Delete,
  useFactory: () => new DeleteExperience(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.AddBullet,
  useFactory: () => new AddBullet2(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.UpdateBullet,
  useFactory: () => new UpdateBullet2(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.DeleteBullet,
  useFactory: () => new DeleteBullet2(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.AddVariant,
  useFactory: () => new AddBulletVariant(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.UpdateVariant,
  useFactory: () => new UpdateBulletVariant(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.DeleteVariant,
  useFactory: () => new DeleteBulletVariant(container.get(DI.Experience.Repository))
});
container.bind({
  provide: DI.Experience.ApproveVariant,
  useFactory: () => new ApproveBulletVariant(container.get(DI.Experience.Repository))
});
```

- [ ] **Step 3: Commit**

```bash
git add infrastructure/src/DI.ts api/src/container.ts
git commit -m "feat: add Experience DI tokens + composition root wiring"
```

---

### Task 8: API Routes

**Files:**
- Create: `api/src/routes/experience/ListExperiencesRoute.ts`
- Create: `api/src/routes/experience/CreateExperienceRoute.ts`
- Create: `api/src/routes/experience/UpdateExperienceRoute.ts`
- Create: `api/src/routes/experience/DeleteExperienceRoute.ts`
- Create: `api/src/routes/experience/AddBullet2Route.ts`
- Create: `api/src/routes/experience/UpdateBullet2Route.ts`
- Create: `api/src/routes/experience/DeleteBullet2Route.ts`
- Create: `api/src/routes/experience/AddBulletVariantRoute.ts`
- Create: `api/src/routes/experience/UpdateBulletVariantRoute.ts`
- Create: `api/src/routes/experience/DeleteBulletVariantRoute.ts`
- Create: `api/src/routes/experience/ApproveBulletVariantRoute.ts`
- Create: `api/src/routes/experience/RejectBulletVariantRoute.ts`
- Modify: `api/src/index.ts`

- [ ] **Step 1: Create ListExperiencesRoute**

```typescript
// api/src/routes/experience/ListExperiencesRoute.ts
import { inject, injectable } from '@needle-di/core';
import type { ListExperiences } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListExperiencesRoute {
  public constructor(private readonly listExperiences: ListExperiences = inject(DI.Experience.List)) {}

  public plugin() {
    return new Elysia().get('/experiences', async () => {
      const experiences = await this.listExperiences.execute();
      return { data: experiences };
    });
  }
}
```

- [ ] **Step 2: Create CreateExperienceRoute**

```typescript
// api/src/routes/experience/CreateExperienceRoute.ts
import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import type { CreateExperience } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';
import { getProfileId } from '../../helpers/profile-id.js';

@injectable()
export class CreateExperienceRoute {
  public constructor(
    private readonly createExperience: CreateExperience = inject(DI.Experience.Create),
    private readonly orm: MikroORM = inject(MikroORM)
  ) {}

  public plugin() {
    return new Elysia().post(
      '/experiences',
      async ({ body, set }) => {
        const profileId = await getProfileId(this.orm);
        const data = await this.createExperience.execute({
          profileId,
          title: body.title,
          companyName: body.company_name,
          companyWebsite: body.company_website ?? null,
          location: body.location,
          startDate: body.start_date,
          endDate: body.end_date,
          summary: body.summary ?? null,
          ordinal: body.ordinal
        });
        set.status = 201;
        return { data };
      },
      {
        body: t.Object({
          title: t.String({ minLength: 1 }),
          company_name: t.String({ minLength: 1 }),
          company_website: t.Optional(t.String()),
          location: t.String(),
          start_date: t.String({ minLength: 1 }),
          end_date: t.String({ minLength: 1 }),
          summary: t.Optional(t.String()),
          ordinal: t.Integer({ minimum: 0 })
        })
      }
    );
  }
}
```

- [ ] **Step 3: Create UpdateExperienceRoute**

```typescript
// api/src/routes/experience/UpdateExperienceRoute.ts
import { inject, injectable } from '@needle-di/core';
import type { UpdateExperience } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateExperienceRoute {
  public constructor(private readonly updateExperience: UpdateExperience = inject(DI.Experience.Update)) {}

  public plugin() {
    return new Elysia().put(
      '/experiences/:id',
      async ({ params, body, set }) => {
        const result = await this.updateExperience.execute({
          experienceId: params.id,
          title: body.title,
          companyName: body.company_name,
          companyWebsite: body.company_website ?? null,
          location: body.location,
          startDate: body.start_date,
          endDate: body.end_date,
          summary: body.summary ?? null,
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
          title: t.String({ minLength: 1 }),
          company_name: t.String({ minLength: 1 }),
          company_website: t.Optional(t.String()),
          location: t.String(),
          start_date: t.String({ minLength: 1 }),
          end_date: t.String({ minLength: 1 }),
          summary: t.Optional(t.String()),
          ordinal: t.Integer({ minimum: 0 })
        })
      }
    );
  }
}
```

- [ ] **Step 4: Create DeleteExperienceRoute**

```typescript
// api/src/routes/experience/DeleteExperienceRoute.ts
import { inject, injectable } from '@needle-di/core';
import type { DeleteExperience } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteExperienceRoute {
  public constructor(private readonly deleteExperience: DeleteExperience = inject(DI.Experience.Delete)) {}

  public plugin() {
    return new Elysia().delete(
      '/experiences/:id',
      async ({ params, set }) => {
        const result = await this.deleteExperience.execute({ experienceId: params.id });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 204;
      },
      { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
    );
  }
}
```

- [ ] **Step 5: Create Bullet routes (AddBullet2Route, UpdateBullet2Route, DeleteBullet2Route)**

Follow the same pattern as AddSkillItemRoute. Routes:
- `POST /experiences/:id/bullets` → AddBullet2Route (body: `{ content, ordinal }`)
- `PUT /bullets/:id` → UpdateBullet2Route (body: `{ experience_id, content, ordinal }`)
- `DELETE /bullets/:id` → DeleteBullet2Route (body: `{ experience_id }`)

Note: UpdateBullet2 and DeleteBullet2 need `experience_id` because the use case loads the Experience aggregate. Pass it in the body.

- [ ] **Step 6: Create Variant routes (AddBulletVariantRoute, UpdateBulletVariantRoute, DeleteBulletVariantRoute)**

Routes:
- `POST /bullets/:id/variants` → AddBulletVariantRoute (body: `{ experience_id, text, angle, source, role_tags, skill_tags }`)
- `PUT /variants/:id` → UpdateBulletVariantRoute (body: `{ experience_id, bullet_id, text, angle, role_tags, skill_tags }`)
- `DELETE /variants/:id` → DeleteBulletVariantRoute (body: `{ experience_id, bullet_id }`)

- [ ] **Step 7: Create Approval routes (ApproveBulletVariantRoute, RejectBulletVariantRoute)**

Routes:
- `PUT /variants/:id/approve` → ApproveBulletVariantRoute (body: `{ experience_id, bullet_id }`)
- `PUT /variants/:id/reject` → RejectBulletVariantRoute (body: `{ experience_id, bullet_id }`)

Both call ApproveBulletVariant with the appropriate action.

- [ ] **Step 8: Register routes in api/src/index.ts**

Import all 12 route classes and register them with `.use(container.get(RouteClass).plugin())` in the app chain. Add them after the `// Tags` section.

- [ ] **Step 9: Verify**

Run: `cd api && bun run typecheck`
Expected: Clean

- [ ] **Step 10: Commit**

```bash
git add api/src/routes/experience/ api/src/index.ts
git commit -m "feat: add Experience API routes — CRUD + bullets + variants + approval"
```

---

### Task 9: Database Seeder

**Files:**
- Modify: `infrastructure/src/db/seeds/DatabaseSeeder.ts`
- Modify: `infrastructure/src/db/seeds/ResumeDataSeeder.ts`

- [ ] **Step 1: Add experiences table to TRUNCATE in DatabaseSeeder**

Add `experiences, bullets, bullet_tags, bullet_variants, bullet_variant_tags` to the TRUNCATE list in `DatabaseSeeder.ts` (before `headline_tags`).

- [ ] **Step 2: Seed experience data in ResumeDataSeeder**

Add after the headlines seed block — seed 2-3 experiences from the existing `companyDefs` data:

```typescript
// After headlines seed and before the old headline section
// Experiences → experiences table
const companyKeys = Object.keys(companyDefs) as CompanyKey[];
for (let ei = 0; ei < companyKeys.length; ei++) {
  const key = companyKeys[ei];
  const def = companyDefs[key];
  const pos = positions[key][0]; // use the first/most recent position
  await em.getConnection().execute(
    `INSERT INTO experiences (id, profile_id, title, company_name, company_website, location, start_date, end_date, summary, ordinal)
     VALUES (gen_random_uuid(), '${profileId}', '${(pos.title || 'Software Engineer').replace(/'/g, "''")}', '${def.companyName.replace(/'/g, "''")}', ${def.websiteUrl ? `'${def.websiteUrl}'` : 'NULL'}, '${(def.locations[0] ?? '').replace(/'/g, "''")}', '${def.joinedAt}', '${def.leftAt}', NULL, ${ei})`
  );
}
```

- [ ] **Step 3: Verify seed runs**

Run: `bun dev:up` (or manually `cd infrastructure && bun run db:seed`)
Expected: Seeds complete with no errors. Check DB for `experiences` rows.

- [ ] **Step 4: Commit**

```bash
git add infrastructure/src/db/seeds/DatabaseSeeder.ts infrastructure/src/db/seeds/ResumeDataSeeder.ts
git commit -m "feat: seed experiences table from existing company data"
```

---

### Task 10: Web Hooks + Query Keys

**Files:**
- Create: `web/src/hooks/use-experiences.ts`
- Modify: `web/src/lib/query-keys.ts`

- [ ] **Step 1: Add query key**

Add to `web/src/lib/query-keys.ts`:
```typescript
experiences: {
  all: ['experiences'] as const,
  list: () => [...queryKeys.experiences.all, 'list'] as const,
},
```

- [ ] **Step 2: Create use-experiences hook**

```typescript
// web/src/hooks/use-experiences.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useExperiences() {
  return useQuery({
    queryKey: queryKeys.experiences.list(),
    queryFn: async () => {
      const { data } = await api.experiences.get();
      return data?.data ?? [];
    }
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/hooks/use-experiences.ts web/src/lib/query-keys.ts
git commit -m "feat: add useExperiences hook + query key"
```

---

### Task 11: Rewrite Experience Page

**Files:**
- Rewrite: `web/src/routes/resume/experience.tsx`
- Delete: `web/src/components/resume/experience/company-card.tsx`
- Delete: `web/src/components/resume/experience/company-form-dialog.tsx`
- Delete: `web/src/components/resume/experience/position-form-dialog.tsx`
- Delete: `web/src/components/resume/experience/bullet-list.tsx`
- Delete: `web/src/components/resume/experience/location-editor.tsx`
- Delete: `web/src/hooks/use-companies.ts`

- [ ] **Step 1: Delete old component files**

```bash
rm web/src/components/resume/experience/company-card.tsx
rm web/src/components/resume/experience/company-form-dialog.tsx
rm web/src/components/resume/experience/position-form-dialog.tsx
rm web/src/components/resume/experience/bullet-list.tsx
rm web/src/components/resume/experience/location-editor.tsx
rm web/src/hooks/use-companies.ts
```

- [ ] **Step 2: Rewrite experience.tsx**

Full rewrite of `web/src/routes/resume/experience.tsx`. The page should:

1. **Experience cards:** Each experience shows title, companyName, dates (startDate – endDate), location, summary. Edit + Delete buttons.
2. **Bullet list per experience:** Nested under each card. Each bullet shows content text. Edit + Delete buttons. "Add Bullet" button.
3. **Variant list per bullet:** Expandable. Each variant shows text, angle badge, approval status badge (color-coded: PENDING=yellow, APPROVED=green, REJECTED=red), source badge. Approve/Reject buttons for PENDING variants. Delete button.
4. **Add Variant form:** "Add Variant" button on each bullet opens inline form with text + angle fields. Source is always 'manual'.
5. **Tag display:** Show role tags and skill tags as colored badges on bullets and variants.
6. **Create/Edit Experience dialog:** Form with title, companyName, companyWebsite, location, startDate, endDate, summary, ordinal. Uses zodResolver + react-hook-form like headlines page.
7. **Delete confirmation dialog:** For experiences, bullets, and variants.

Use the same patterns as `headlines.tsx`:
- `useExperiences()` hook for data fetching
- `useMutation` for all CRUD operations with `queryClient.invalidateQueries`
- `toast.success/error` for notifications
- shadcn/ui components: Card, Button, Badge, Dialog, Input, Label, Skeleton

The API calls use Eden Treaty via `api`:
- `api.experiences.get()` — list
- `api.experiences.post(body)` — create
- `api.experiences({ id }).put(body)` — update
- `api.experiences({ id }).delete()` — delete
- `api.experiences({ id }).bullets.post(body)` — add bullet
- `api.bullets({ id }).put(body)` — update bullet
- `api.bullets({ id }).delete(body)` — delete bullet
- `api.bullets({ id }).variants.post(body)` — add variant
- `api.variants({ id }).put(body)` — update variant
- `api.variants({ id }).delete(body)` — delete variant
- `api.variants({ id }).approve.put(body)` — approve
- `api.variants({ id }).reject.put(body)` — reject

The page should handle all CRUD inline — no separate components needed unless the file exceeds ~500 lines. The Headlines page is a good reference at 365 lines and handles similar complexity.

- [ ] **Step 3: Verify the page builds**

Run: `cd web && bun run typecheck`
Expected: Clean

- [ ] **Step 4: Commit**

```bash
git add -A web/src/routes/resume/experience.tsx web/src/components/resume/experience/ web/src/hooks/use-companies.ts
git commit -m "feat: rewrite experience page — new domain model with bullets + variants"
```

---

### Task 12: UI Testing + E2E Regression

- [ ] **Step 1: Start dev environment**

```bash
bun dev:up
```

- [ ] **Step 2: Manual UI testing**

Open `/resume/experience` and verify:
- Experience list loads with seeded data
- Create experience (title, company, dates, location) — card appears
- Add bullet to experience — appears nested under experience
- Add manual variant to bullet — appears with APPROVED badge (manual source)
- Tags display as colored badges on bullets and variants
- Delete bullet — cascades variant removal
- Delete experience — cascades everything
- Edit experience fields, save, reload — persists

- [ ] **Step 3: Run e2e tests for regression**

```bash
bun run test:e2e
```

Expected: All 10 existing tests pass (no regression)

- [ ] **Step 4: Fix any issues found**

If tests fail or UI issues are found, fix them before proceeding.

- [ ] **Step 5: Run full checks**

```bash
bun run check      # Biome
bun run knip       # dead code
bun run dep:check  # dependency boundaries
```

Expected: Clean (or pre-existing warnings only)

- [ ] **Step 6: Final commit if any fixes**

```bash
git add -A
git commit -m "fix: resolve issues from UI testing"
```

---

### Task 13: Land

- [ ] **Step 1: Use /land**

Run `/land` to rebase on main, create PR, wait for CI, then merge.
