# Domain Rethink Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign TailoredIn's domain model to center on rich experience management with LLM-assisted enrichment, tag-based classification, archetype-driven resume curation, and intelligent job-to-archetype matching.

**Architecture:** Clean-slate domain entities following existing DDD/Onion patterns. Tags (role + skill) are the connective tissue between bullets, archetypes, and jobs. LLM (Claude CLI) acts as advisor — all outputs require engineer approval. Four subdomains: Profile, Tagging, Archetype, Job.

**Tech Stack:** Bun, TypeScript, MikroORM/PostgreSQL, Elysia, Claude CLI (JSON schema output), Typst

**Spec:** `docs/superpowers/specs/2026-03-31-domain-rethink-design.md`

---

## File Structure

### Domain Layer (`domain/src/`)

**New entities:**
- `entities/Experience.ts` — Aggregate root: role at a company with bullets (replaces ResumeCompany + ResumePosition)
- `entities/Bullet.ts` — Entity under Experience: canonical achievement statement with TagSet
- `entities/BulletVariant.ts` — Entity under Bullet: alternative phrasing with its own TagSet, approval status
- `entities/Project.ts` — Aggregate root: standalone project with TagSet
- `entities/Profile.ts` — Aggregate root: engineer identity (replaces User)
- `entities/Headline.ts` — Aggregate root: professional summary with role tags (replaces ResumeHeadline)
- `entities/Education.ts` — Aggregate root: degree info (replaces ResumeEducation)
- `entities/SkillCategory.ts` — Aggregate root: skill grouping (replaces ResumeSkillCategory)
- `entities/SkillItem.ts` — Entity under SkillCategory (replaces ResumeSkillItem)
- `entities/Archetype.ts` — Aggregate root: resume persona with TagProfile + ContentSelection
- `entities/JobPosting.ts` — Aggregate root: scraped job with requirements and archetype matches

**New value objects:**
- `value-objects/ExperienceId.ts`
- `value-objects/BulletId.ts`
- `value-objects/BulletVariantId.ts`
- `value-objects/ProjectId.ts`
- `value-objects/ProfileId.ts`
- `value-objects/HeadlineId.ts`
- `value-objects/EducationId.ts`
- `value-objects/ArchetypeId.ts`
- `value-objects/TagSet.ts` — Value object: pair of RoleTag[] + SkillTag[]
- `value-objects/TagProfile.ts` — Value object: weighted tag sets for archetype identity
- `value-objects/ContentSelection.ts` — Value object: which content an archetype includes
- `value-objects/JobRequirements.ts` — Value object: extracted tags + seniority from job description
- `value-objects/ArchetypeMatch.ts` — Value object: match result between job and archetype
- `value-objects/ApprovalStatus.ts` — Enum: PENDING, APPROVED, REJECTED

**New ports:**
- `ports/ExperienceRepository.ts`
- `ports/ProjectRepository.ts`
- `ports/ProfileRepository.ts`
- `ports/HeadlineRepository.ts`
- `ports/EducationRepository.ts`
- `ports/SkillCategoryRepository.ts`
- `ports/ArchetypeRepository.ts`
- `ports/JobPostingRepository.ts`
- `ports/TagRepository.ts`

### Application Layer (`application/src/`)

**New port:**
- `ports/ClaudeService.ts` — Interface for Claude CLI interactions

**New use cases:**
- `use-cases/experience/` — CreateExperience, UpdateExperience, DeleteExperience, ListExperiences
- `use-cases/experience/` — AddBullet, UpdateBullet, DeleteBullet
- `use-cases/experience/` — AddBulletVariant, UpdateBulletVariant, DeleteBulletVariant, ApproveBulletVariant
- `use-cases/experience/` — SuggestBulletVariants, AutoTagBullet
- `use-cases/project/` — CreateProject, UpdateProject, DeleteProject, ListProjects
- `use-cases/profile/` — GetProfile, UpdateProfile
- `use-cases/headline/` — CreateHeadline, UpdateHeadline, DeleteHeadline, ListHeadlines
- `use-cases/education/` — CreateEducation, UpdateEducation, DeleteEducation, ListEducation
- `use-cases/skill/` — CreateSkillCategory, UpdateSkillCategory, DeleteSkillCategory, ListSkillCategories, AddSkillItem, UpdateSkillItem, DeleteSkillItem
- `use-cases/tag/` — ListTags, CreateTag, DeleteTag
- `use-cases/archetype/` — CreateArchetype, UpdateArchetype, DeleteArchetype, ListArchetypes, SetArchetypeContent
- `use-cases/job/` — ImportJob, AnalyzeJob, ListJobs, GetJob

**New DTOs:**
- `dtos/ExperienceDto.ts`
- `dtos/ProjectDto.ts`
- `dtos/ProfileDto.ts`
- `dtos/TagDto.ts`
- `dtos/ArchetypeDto.ts`
- `dtos/JobPostingDto.ts`

### Infrastructure Layer (`infrastructure/src/`)

**New ORM entities:**
- `db/entities/profile/Profile.ts`
- `db/entities/experience/Experience.ts`
- `db/entities/experience/Bullet.ts`
- `db/entities/experience/BulletVariant.ts`
- `db/entities/experience/BulletTag.ts` — Join table for bullet ↔ tag
- `db/entities/experience/BulletVariantTag.ts` — Join table for variant ↔ tag
- `db/entities/project/Project.ts`
- `db/entities/project/ProjectTag.ts`
- `db/entities/headline/Headline.ts`
- `db/entities/headline/HeadlineTag.ts`
- `db/entities/education/Education.ts`
- `db/entities/skill/SkillCategory.ts`
- `db/entities/skill/SkillItem.ts`
- `db/entities/tag/Tag.ts` — Unified tag table with `dimension` column (role | skill)
- `db/entities/archetype/Archetype.ts`
- `db/entities/archetype/ArchetypeTagWeight.ts`
- `db/entities/archetype/ArchetypeContentSelection.ts`
- `db/entities/job/JobPosting.ts`

**New repositories:**
- `repositories/PostgresExperienceRepository.ts`
- `repositories/PostgresProjectRepository.ts`
- `repositories/PostgresProfileRepository.ts`
- `repositories/PostgresHeadlineRepository.ts`
- `repositories/PostgresEducationRepository.ts`
- `repositories/PostgresSkillCategoryRepository.ts`
- `repositories/PostgresTagRepository.ts`
- `repositories/PostgresArchetypeRepository.ts`
- `repositories/PostgresJobPostingRepository.ts`

**New service:**
- `services/ClaudeCliService.ts`

**New migration:**
- `db/migrations/Migration_20260404000000_domain_rethink.ts`

---

## Phase 1: Domain Foundation — Value Objects & Tags

### Task 1: Tag Value Objects and TagSet

**Files:**
- Create: `domain/src/value-objects/TagSet.ts`
- Create: `domain/src/value-objects/ApprovalStatus.ts`
- Create: `domain/test/value-objects/TagSet.test.ts`

- [ ] **Step 1: Write failing tests for TagSet**

```typescript
// domain/test/value-objects/TagSet.test.ts
import { describe, expect, test } from 'bun:test';
import { TagSet } from '../../src/value-objects/TagSet.js';

describe('TagSet', () => {
  test('creates with role and skill tags', () => {
    const tagSet = new TagSet({ roleTags: ['leadership', 'mentoring'], skillTags: ['typescript'] });
    expect(tagSet.roleTags).toEqual(['leadership', 'mentoring']);
    expect(tagSet.skillTags).toEqual(['typescript']);
  });

  test('creates empty by default', () => {
    const tagSet = TagSet.empty();
    expect(tagSet.roleTags).toEqual([]);
    expect(tagSet.skillTags).toEqual([]);
  });

  test('equality by content', () => {
    const a = new TagSet({ roleTags: ['ic'], skillTags: ['react'] });
    const b = new TagSet({ roleTags: ['ic'], skillTags: ['react'] });
    expect(a.equals(b)).toBe(true);
  });

  test('isEmpty returns true for empty TagSet', () => {
    expect(TagSet.empty().isEmpty).toBe(true);
  });

  test('isEmpty returns false for non-empty TagSet', () => {
    const tagSet = new TagSet({ roleTags: ['ic'], skillTags: [] });
    expect(tagSet.isEmpty).toBe(false);
  });

  test('merges two TagSets with deduplication', () => {
    const a = new TagSet({ roleTags: ['ic', 'hands-on'], skillTags: ['typescript'] });
    const b = new TagSet({ roleTags: ['ic', 'architecture'], skillTags: ['react'] });
    const merged = a.merge(b);
    expect(merged.roleTags).toEqual(['ic', 'hands-on', 'architecture']);
    expect(merged.skillTags).toEqual(['typescript', 'react']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd domain && bun test test/value-objects/TagSet.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement TagSet**

```typescript
// domain/src/value-objects/TagSet.ts
import { ValueObject } from '../ValueObject.js';

export class TagSet extends ValueObject<{ roleTags: string[]; skillTags: string[] }> {
  public constructor(props: { roleTags: string[]; skillTags: string[] }) {
    super({ roleTags: [...props.roleTags].sort(), skillTags: [...props.skillTags].sort() });
  }

  public get roleTags(): readonly string[] {
    return this.props.roleTags;
  }

  public get skillTags(): readonly string[] {
    return this.props.skillTags;
  }

  public get isEmpty(): boolean {
    return this.props.roleTags.length === 0 && this.props.skillTags.length === 0;
  }

  public merge(other: TagSet): TagSet {
    const roleTags = [...new Set([...this.props.roleTags, ...other.props.roleTags])];
    const skillTags = [...new Set([...this.props.skillTags, ...other.props.skillTags])];
    return new TagSet({ roleTags, skillTags });
  }

  public static empty(): TagSet {
    return new TagSet({ roleTags: [], skillTags: [] });
  }
}
```

- [ ] **Step 4: Implement ApprovalStatus**

```typescript
// domain/src/value-objects/ApprovalStatus.ts
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd domain && bun test test/value-objects/TagSet.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add domain/src/value-objects/TagSet.ts domain/src/value-objects/ApprovalStatus.ts domain/test/value-objects/TagSet.test.ts
git commit -m "feat: add TagSet value object and ApprovalStatus enum"
```

---

### Task 2: ID Value Objects

**Files:**
- Create: `domain/src/value-objects/ExperienceId.ts`
- Create: `domain/src/value-objects/BulletId.ts`
- Create: `domain/src/value-objects/BulletVariantId.ts`
- Create: `domain/src/value-objects/ProjectId.ts`
- Create: `domain/src/value-objects/ProfileId.ts`
- Create: `domain/src/value-objects/HeadlineId.ts`
- Create: `domain/src/value-objects/EducationId.ts`
- Create: `domain/src/value-objects/ArchetypeId.ts`
- Create: `domain/src/value-objects/TagId.ts`

All IDs follow the same pattern as `ResumeCompanyId`:

- [ ] **Step 1: Create all ID value objects**

Each follows this template (example for `ExperienceId`):

```typescript
// domain/src/value-objects/ExperienceId.ts
import { ValueObject } from '../ValueObject.js';

export class ExperienceId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): ExperienceId {
    return new ExperienceId(crypto.randomUUID());
  }
}
```

Create the same pattern for: `BulletId`, `BulletVariantId`, `ProjectId`, `ProfileId`, `HeadlineId`, `EducationId`, `ArchetypeId`, `TagId`, `JobPostingId`, `SkillCategoryId`, `SkillItemId`. Each class name matches its file name. Each `generate()` returns `new ClassName(crypto.randomUUID())`. Note: `SkillCategoryId` and `SkillItemId` may already exist as `ResumeSkillCategoryId`/`ResumeSkillItemId` — create new ones with the clean names.

- [ ] **Step 2: Commit**

```bash
git add domain/src/value-objects/ExperienceId.ts domain/src/value-objects/BulletId.ts domain/src/value-objects/BulletVariantId.ts domain/src/value-objects/ProjectId.ts domain/src/value-objects/ProfileId.ts domain/src/value-objects/HeadlineId.ts domain/src/value-objects/EducationId.ts domain/src/value-objects/ArchetypeId.ts domain/src/value-objects/TagId.ts
git commit -m "feat: add ID value objects for new domain model"
```

---

## Phase 2: Domain Entities — Profile Subdomain

### Task 3: BulletVariant Entity

**Files:**
- Create: `domain/src/entities/BulletVariant.ts`
- Create: `domain/test/entities/BulletVariant.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// domain/test/entities/BulletVariant.test.ts
import { describe, expect, test } from 'bun:test';
import { BulletVariant } from '../../src/entities/BulletVariant.js';
import { ApprovalStatus } from '../../src/value-objects/ApprovalStatus.js';
import { TagSet } from '../../src/value-objects/TagSet.js';

describe('BulletVariant', () => {
  test('creates with pending approval status', () => {
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd domain && bun test test/entities/BulletVariant.test.ts`
Expected: FAIL

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
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add domain/src/entities/BulletVariant.ts domain/test/entities/BulletVariant.test.ts
git commit -m "feat: add BulletVariant entity with approval workflow"
```

---

### Task 4: Bullet Entity (with variants)

**Files:**
- Create: `domain/src/entities/Bullet.ts`
- Create: `domain/test/entities/Bullet.test.ts`

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
      text: 'Led team building a thing',
      angle: 'leadership',
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
import { ApprovalStatus } from '../value-objects/ApprovalStatus.js';
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd domain && bun test test/entities/Bullet.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add domain/src/entities/Bullet.ts domain/test/entities/Bullet.test.ts
git commit -m "feat: add Bullet entity with variant management"
```

---

### Task 5: Experience Aggregate Root

**Files:**
- Create: `domain/src/entities/Experience.ts`
- Create: `domain/test/entities/Experience.test.ts`

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

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd domain && bun test test/entities/Experience.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add domain/src/entities/Experience.ts domain/test/entities/Experience.test.ts
git commit -m "feat: add Experience aggregate root with bullet management"
```

---

### Task 6: Project Entity

**Files:**
- Create: `domain/src/entities/Project.ts`
- Create: `domain/test/entities/Project.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// domain/test/entities/Project.test.ts
import { describe, expect, test } from 'bun:test';
import { Project } from '../../src/entities/Project.js';
import { TagSet } from '../../src/value-objects/TagSet.js';

describe('Project', () => {
  test('creates with empty tags', () => {
    const project = Project.create({
      profileId: 'profile-1',
      name: 'open-source-lib',
      description: 'A cool library',
      url: 'https://github.com/foo/bar',
      startDate: '2023-01',
      endDate: '2024-06',
      ordinal: 0
    });
    expect(project.name).toBe('open-source-lib');
    expect(project.tags.isEmpty).toBe(true);
  });

  test('updates tags', () => {
    const project = Project.create({
      profileId: 'profile-1',
      name: 'lib',
      description: null,
      url: null,
      startDate: '2023-01',
      endDate: null,
      ordinal: 0
    });
    project.updateTags(new TagSet({ roleTags: ['ic'], skillTags: ['rust'] }));
    expect(project.tags.skillTags).toEqual(['rust']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd domain && bun test test/entities/Project.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Project**

```typescript
// domain/src/entities/Project.ts
import { AggregateRoot } from '../AggregateRoot.js';
import { ProjectId } from '../value-objects/ProjectId.js';
import { TagSet } from '../value-objects/TagSet.js';

export type ProjectCreateProps = {
  profileId: string;
  name: string;
  description: string | null;
  url: string | null;
  startDate: string;
  endDate: string | null;
  ordinal: number;
};

export class Project extends AggregateRoot<ProjectId> {
  public readonly profileId: string;
  public name: string;
  public description: string | null;
  public url: string | null;
  public startDate: string;
  public endDate: string | null;
  public ordinal: number;
  public tags: TagSet;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ProjectId;
    profileId: string;
    name: string;
    description: string | null;
    url: string | null;
    startDate: string;
    endDate: string | null;
    ordinal: number;
    tags: TagSet;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.name = props.name;
    this.description = props.description;
    this.url = props.url;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.ordinal = props.ordinal;
    this.tags = props.tags;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public updateTags(tags: TagSet): void {
    this.tags = tags;
    this.updatedAt = new Date();
  }

  public static create(props: ProjectCreateProps): Project {
    const now = new Date();
    return new Project({
      id: ProjectId.generate(),
      ...props,
      tags: TagSet.empty(),
      createdAt: now,
      updatedAt: now
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd domain && bun test test/entities/Project.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add domain/src/entities/Project.ts domain/test/entities/Project.test.ts
git commit -m "feat: add Project aggregate root with tag support"
```

---

### Task 7: Profile, Headline, Education, SkillCategory, SkillItem Entities

These entities are close to their existing counterparts (User → Profile, ResumeHeadline → Headline, etc.) with Headline gaining role tags. Create them following the same patterns.

**Files:**
- Create: `domain/src/entities/Profile.ts`
- Create: `domain/src/entities/Headline.ts`
- Create: `domain/src/entities/Education.ts`
- Create: `domain/src/entities/SkillCategory.ts`
- Create: `domain/src/entities/SkillItem.ts`
- Create: `domain/test/entities/Headline.test.ts`

- [ ] **Step 1: Implement Profile**

```typescript
// domain/src/entities/Profile.ts
import { AggregateRoot } from '../AggregateRoot.js';
import { ProfileId } from '../value-objects/ProfileId.js';

export type ProfileCreateProps = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
};

export class Profile extends AggregateRoot<ProfileId> {
  public email: string;
  public firstName: string;
  public lastName: string;
  public phone: string | null;
  public location: string | null;
  public linkedinUrl: string | null;
  public githubUrl: string | null;
  public websiteUrl: string | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ProfileId;
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
  }) {
    super(props.id);
    this.email = props.email;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.phone = props.phone;
    this.location = props.location;
    this.linkedinUrl = props.linkedinUrl;
    this.githubUrl = props.githubUrl;
    this.websiteUrl = props.websiteUrl;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public static create(props: ProfileCreateProps): Profile {
    const now = new Date();
    return new Profile({ id: ProfileId.generate(), ...props, createdAt: now, updatedAt: now });
  }
}
```

- [ ] **Step 2: Implement Headline (with role tags)**

```typescript
// domain/src/entities/Headline.ts
import { AggregateRoot } from '../AggregateRoot.js';
import { HeadlineId } from '../value-objects/HeadlineId.js';

export type HeadlineCreateProps = {
  profileId: string;
  label: string;
  summaryText: string;
  roleTags: string[];
};

export class Headline extends AggregateRoot<HeadlineId> {
  public readonly profileId: string;
  public label: string;
  public summaryText: string;
  public roleTags: string[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: HeadlineId;
    profileId: string;
    label: string;
    summaryText: string;
    roleTags: string[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.label = props.label;
    this.summaryText = props.summaryText;
    this.roleTags = props.roleTags;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public updateRoleTags(tags: string[]): void {
    this.roleTags = tags;
    this.updatedAt = new Date();
  }

  public static create(props: HeadlineCreateProps): Headline {
    const now = new Date();
    return new Headline({ id: HeadlineId.generate(), ...props, createdAt: now, updatedAt: now });
  }
}
```

- [ ] **Step 3: Implement Education**

```typescript
// domain/src/entities/Education.ts
import { AggregateRoot } from '../AggregateRoot.js';
import { EducationId } from '../value-objects/EducationId.js';

export type EducationCreateProps = {
  profileId: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: number;
  location: string | null;
  honors: string | null;
  ordinal: number;
};

export class Education extends AggregateRoot<EducationId> {
  public readonly profileId: string;
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
    profileId: string;
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
    this.profileId = props.profileId;
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
    return new Education({ id: EducationId.generate(), ...props, createdAt: now, updatedAt: now });
  }
}
```

- [ ] **Step 4: Implement SkillCategory and SkillItem**

```typescript
// domain/src/entities/SkillItem.ts
import { Entity } from '../Entity.js';
import { SkillItemId } from '../value-objects/SkillItemId.js';

export type SkillItemCreateProps = {
  skillCategoryId: string;
  name: string;
  ordinal: number;
};

export class SkillItem extends Entity<SkillItemId> {
  public readonly skillCategoryId: string;
  public name: string;
  public ordinal: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: SkillItemId;
    skillCategoryId: string;
    name: string;
    ordinal: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.skillCategoryId = props.skillCategoryId;
    this.name = props.name;
    this.ordinal = props.ordinal;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: SkillItemCreateProps): SkillItem {
    const now = new Date();
    return new SkillItem({ id: SkillItemId.generate(), ...props, createdAt: now, updatedAt: now });
  }
}
```

Note: Reuse existing `SkillItemId` (which is `ResumeSkillItemId` renamed) and `SkillCategoryId` (which is `ResumeSkillCategoryId` renamed). If those IDs don't exist yet, create them following the pattern in Task 2.

```typescript
// domain/src/entities/SkillCategory.ts
import { AggregateRoot } from '../AggregateRoot.js';
import { SkillCategoryId } from '../value-objects/SkillCategoryId.js';
import { SkillItem } from './SkillItem.js';

export type SkillCategoryCreateProps = {
  profileId: string;
  name: string;
  ordinal: number;
};

export class SkillCategory extends AggregateRoot<SkillCategoryId> {
  public readonly profileId: string;
  public name: string;
  public ordinal: number;
  public readonly items: SkillItem[];
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: SkillCategoryId;
    profileId: string;
    name: string;
    ordinal: number;
    items: SkillItem[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.name = props.name;
    this.ordinal = props.ordinal;
    this.items = props.items;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public addItem(props: { name: string; ordinal: number }): SkillItem {
    const item = SkillItem.create({ skillCategoryId: this.id.value, ...props });
    this.items.push(item);
    this.updatedAt = new Date();
    return item;
  }

  public removeItem(itemId: string): void {
    const index = this.items.findIndex(i => i.id.value === itemId);
    if (index === -1) throw new Error(`Skill item not found: ${itemId}`);
    this.items.splice(index, 1);
    this.updatedAt = new Date();
  }

  public static create(props: SkillCategoryCreateProps): SkillCategory {
    const now = new Date();
    return new SkillCategory({
      id: SkillCategoryId.generate(),
      ...props,
      items: [],
      createdAt: now,
      updatedAt: now
    });
  }
}
```

- [ ] **Step 5: Write Headline test and run all tests**

```typescript
// domain/test/entities/Headline.test.ts
import { describe, expect, test } from 'bun:test';
import { Headline } from '../../src/entities/Headline.js';

describe('Headline', () => {
  test('creates with role tags', () => {
    const headline = Headline.create({
      profileId: 'p-1',
      label: 'Staff Engineer',
      summaryText: 'Building distributed systems at scale',
      roleTags: ['ic', 'architecture']
    });
    expect(headline.label).toBe('Staff Engineer');
    expect(headline.roleTags).toEqual(['ic', 'architecture']);
  });

  test('updates role tags', () => {
    const headline = Headline.create({
      profileId: 'p-1',
      label: 'EM',
      summaryText: 'Leading teams',
      roleTags: ['leadership']
    });
    headline.updateRoleTags(['leadership', 'strategy']);
    expect(headline.roleTags).toEqual(['leadership', 'strategy']);
  });
});
```

Run: `cd domain && bun test`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add domain/src/entities/Profile.ts domain/src/entities/Headline.ts domain/src/entities/Education.ts domain/src/entities/SkillCategory.ts domain/src/entities/SkillItem.ts domain/test/entities/Headline.test.ts
git commit -m "feat: add Profile, Headline, Education, SkillCategory, SkillItem entities"
```

---

### Task 8: Tag Entity (Persisted Vocabulary)

**Files:**
- Create: `domain/src/entities/Tag.ts`
- Create: `domain/test/entities/Tag.test.ts`

Tags need to be persisted as a controlled vocabulary. Each tag has a name, a dimension (role or skill), and is immutable once created.

- [ ] **Step 1: Write failing test**

```typescript
// domain/test/entities/Tag.test.ts
import { describe, expect, test } from 'bun:test';
import { Tag, TagDimension } from '../../src/entities/Tag.js';

describe('Tag', () => {
  test('creates a role tag', () => {
    const tag = Tag.create({ name: 'leadership', dimension: TagDimension.ROLE });
    expect(tag.name).toBe('leadership');
    expect(tag.dimension).toBe(TagDimension.ROLE);
  });

  test('creates a skill tag', () => {
    const tag = Tag.create({ name: 'typescript', dimension: TagDimension.SKILL });
    expect(tag.name).toBe('typescript');
    expect(tag.dimension).toBe(TagDimension.SKILL);
  });

  test('normalizes name to lowercase kebab-case', () => {
    const tag = Tag.create({ name: 'Distributed Systems', dimension: TagDimension.SKILL });
    expect(tag.name).toBe('distributed-systems');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd domain && bun test test/entities/Tag.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Tag**

```typescript
// domain/src/entities/Tag.ts
import { AggregateRoot } from '../AggregateRoot.js';
import { TagId } from '../value-objects/TagId.js';

export enum TagDimension {
  ROLE = 'ROLE',
  SKILL = 'SKILL'
}

export type TagCreateProps = {
  name: string;
  dimension: TagDimension;
};

export class Tag extends AggregateRoot<TagId> {
  public readonly name: string;
  public readonly dimension: TagDimension;
  public readonly createdAt: Date;

  public constructor(props: {
    id: TagId;
    name: string;
    dimension: TagDimension;
    createdAt: Date;
  }) {
    super(props.id);
    this.name = props.name;
    this.dimension = props.dimension;
    this.createdAt = props.createdAt;
  }

  private static normalize(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  public static create(props: TagCreateProps): Tag {
    return new Tag({
      id: TagId.generate(),
      name: Tag.normalize(props.name),
      dimension: props.dimension,
      createdAt: new Date()
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd domain && bun test test/entities/Tag.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add domain/src/entities/Tag.ts domain/test/entities/Tag.test.ts
git commit -m "feat: add Tag entity with dimension and name normalization"
```

---

## Phase 3: Archetype & Job Subdomain

### Task 9: TagProfile and ContentSelection Value Objects

**Files:**
- Create: `domain/src/value-objects/TagProfile.ts`
- Create: `domain/src/value-objects/ContentSelection.ts`
- Create: `domain/test/value-objects/TagProfile.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// domain/test/value-objects/TagProfile.test.ts
import { describe, expect, test } from 'bun:test';
import { TagProfile } from '../../src/value-objects/TagProfile.js';

describe('TagProfile', () => {
  test('creates with weighted tags', () => {
    const profile = new TagProfile({
      roleWeights: new Map([['leadership', 0.8], ['architecture', 0.6]]),
      skillWeights: new Map([['typescript', 0.9], ['system-design', 0.7]])
    });
    expect(profile.roleWeights.get('leadership')).toBe(0.8);
    expect(profile.skillWeights.get('typescript')).toBe(0.9);
  });

  test('overlap computes dot product', () => {
    const archetype = new TagProfile({
      roleWeights: new Map([['leadership', 0.8], ['ic', 0.2]]),
      skillWeights: new Map([['typescript', 0.9]])
    });
    const job = new TagProfile({
      roleWeights: new Map([['leadership', 1.0]]),
      skillWeights: new Map([['typescript', 1.0], ['react', 0.5]])
    });
    const score = archetype.overlapWith(job);
    // role: leadership 0.8*1.0 = 0.8, ic 0.2*0 = 0
    // skill: typescript 0.9*1.0 = 0.9, react 0*0.5 = 0
    // total = 1.7
    expect(score).toBeCloseTo(1.7, 5);
  });

  test('empty profile', () => {
    const empty = TagProfile.empty();
    expect(empty.roleWeights.size).toBe(0);
    expect(empty.skillWeights.size).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd domain && bun test test/value-objects/TagProfile.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement TagProfile**

```typescript
// domain/src/value-objects/TagProfile.ts
export class TagProfile {
  public readonly roleWeights: ReadonlyMap<string, number>;
  public readonly skillWeights: ReadonlyMap<string, number>;

  public constructor(props: {
    roleWeights: Map<string, number>;
    skillWeights: Map<string, number>;
  }) {
    this.roleWeights = new Map(props.roleWeights);
    this.skillWeights = new Map(props.skillWeights);
  }

  public overlapWith(other: TagProfile): number {
    let score = 0;
    for (const [tag, weight] of this.roleWeights) {
      score += weight * (other.roleWeights.get(tag) ?? 0);
    }
    for (const [tag, weight] of this.skillWeights) {
      score += weight * (other.skillWeights.get(tag) ?? 0);
    }
    return score;
  }

  public static empty(): TagProfile {
    return new TagProfile({ roleWeights: new Map(), skillWeights: new Map() });
  }
}
```

- [ ] **Step 4: Implement ContentSelection**

```typescript
// domain/src/value-objects/ContentSelection.ts
export type ExperienceSelection = {
  experienceId: string;
  bulletVariantIds: string[];
};

export class ContentSelection {
  public readonly experienceSelections: ExperienceSelection[];
  public readonly projectIds: string[];
  public readonly educationIds: string[];
  public readonly skillCategoryIds: string[];
  public readonly skillItemIds: string[];

  public constructor(props: {
    experienceSelections: ExperienceSelection[];
    projectIds: string[];
    educationIds: string[];
    skillCategoryIds: string[];
    skillItemIds: string[];
  }) {
    this.experienceSelections = props.experienceSelections;
    this.projectIds = props.projectIds;
    this.educationIds = props.educationIds;
    this.skillCategoryIds = props.skillCategoryIds;
    this.skillItemIds = props.skillItemIds;
  }

  public static empty(): ContentSelection {
    return new ContentSelection({
      experienceSelections: [],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd domain && bun test test/value-objects/TagProfile.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add domain/src/value-objects/TagProfile.ts domain/src/value-objects/ContentSelection.ts domain/test/value-objects/TagProfile.test.ts
git commit -m "feat: add TagProfile and ContentSelection value objects"
```

---

### Task 10: Archetype Aggregate Root (Redesigned)

**Files:**
- Create: `domain/src/entities/Archetype.ts` (new, replaces ArchetypeConfig)
- Create: `domain/test/entities/Archetype.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// domain/test/entities/Archetype.test.ts
import { describe, expect, test } from 'bun:test';
import { Archetype } from '../../src/entities/Archetype.js';
import { ContentSelection } from '../../src/value-objects/ContentSelection.js';
import { TagProfile } from '../../src/value-objects/TagProfile.js';

describe('Archetype', () => {
  test('creates with empty tag profile and content selection', () => {
    const archetype = Archetype.create({
      profileId: 'p-1',
      key: 'lead-ic',
      label: 'Lead IC / Staff Engineer',
      headlineId: 'h-1'
    });
    expect(archetype.key).toBe('lead-ic');
    expect(archetype.label).toBe('Lead IC / Staff Engineer');
    expect(archetype.tagProfile.roleWeights.size).toBe(0);
    expect(archetype.contentSelection.experienceSelections).toEqual([]);
  });

  test('updates tag profile', () => {
    const archetype = Archetype.create({
      profileId: 'p-1',
      key: 'ic',
      label: 'IC',
      headlineId: 'h-1'
    });
    const profile = new TagProfile({
      roleWeights: new Map([['ic', 0.9]]),
      skillWeights: new Map([['typescript', 0.8]])
    });
    archetype.updateTagProfile(profile);
    expect(archetype.tagProfile.roleWeights.get('ic')).toBe(0.9);
  });

  test('replaces content selection', () => {
    const archetype = Archetype.create({
      profileId: 'p-1',
      key: 'ic',
      label: 'IC',
      headlineId: 'h-1'
    });
    const selection = new ContentSelection({
      experienceSelections: [{ experienceId: 'e-1', bulletVariantIds: ['v-1', 'v-2'] }],
      projectIds: ['proj-1'],
      educationIds: ['edu-1'],
      skillCategoryIds: ['sc-1'],
      skillItemIds: ['si-1']
    });
    archetype.replaceContentSelection(selection);
    expect(archetype.contentSelection.experienceSelections).toHaveLength(1);
    expect(archetype.contentSelection.projectIds).toEqual(['proj-1']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd domain && bun test test/entities/Archetype.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Archetype**

```typescript
// domain/src/entities/Archetype.ts
import { AggregateRoot } from '../AggregateRoot.js';
import { ArchetypeId } from '../value-objects/ArchetypeId.js';
import { ContentSelection } from '../value-objects/ContentSelection.js';
import { TagProfile } from '../value-objects/TagProfile.js';

export type ArchetypeCreateProps = {
  profileId: string;
  key: string;
  label: string;
  headlineId: string;
};

export class Archetype extends AggregateRoot<ArchetypeId> {
  public readonly profileId: string;
  public key: string;
  public label: string;
  public headlineId: string;
  public tagProfile: TagProfile;
  public contentSelection: ContentSelection;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: ArchetypeId;
    profileId: string;
    key: string;
    label: string;
    headlineId: string;
    tagProfile: TagProfile;
    contentSelection: ContentSelection;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.profileId = props.profileId;
    this.key = props.key;
    this.label = props.label;
    this.headlineId = props.headlineId;
    this.tagProfile = props.tagProfile;
    this.contentSelection = props.contentSelection;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public updateTagProfile(tagProfile: TagProfile): void {
    this.tagProfile = tagProfile;
    this.updatedAt = new Date();
  }

  public replaceContentSelection(selection: ContentSelection): void {
    this.contentSelection = selection;
    this.updatedAt = new Date();
  }

  public static create(props: ArchetypeCreateProps): Archetype {
    const now = new Date();
    return new Archetype({
      id: ArchetypeId.generate(),
      ...props,
      tagProfile: TagProfile.empty(),
      contentSelection: ContentSelection.empty(),
      createdAt: now,
      updatedAt: now
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd domain && bun test test/entities/Archetype.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add domain/src/entities/Archetype.ts domain/test/entities/Archetype.test.ts
git commit -m "feat: add Archetype aggregate with TagProfile and ContentSelection"
```

---

### Task 11: JobPosting Aggregate Root + JobRequirements + ArchetypeMatch

**Files:**
- Create: `domain/src/value-objects/JobRequirements.ts`
- Create: `domain/src/value-objects/ArchetypeMatch.ts`
- Create: `domain/src/entities/JobPosting.ts` (new, simplified)
- Create: `domain/test/entities/JobPosting.test.ts`

- [ ] **Step 1: Implement JobRequirements**

```typescript
// domain/src/value-objects/JobRequirements.ts
export class JobRequirements {
  public readonly skillTags: readonly string[];
  public readonly roleTags: readonly string[];
  public readonly senioritySignal: string | null;

  public constructor(props: {
    skillTags: string[];
    roleTags: string[];
    senioritySignal: string | null;
  }) {
    this.skillTags = [...props.skillTags];
    this.roleTags = [...props.roleTags];
    this.senioritySignal = props.senioritySignal;
  }

  public static empty(): JobRequirements {
    return new JobRequirements({ skillTags: [], roleTags: [], senioritySignal: null });
  }
}
```

- [ ] **Step 2: Implement ArchetypeMatch**

```typescript
// domain/src/value-objects/ArchetypeMatch.ts
export type SuggestedTuning = {
  swapVariants: { bulletId: string; preferredVariantAngle: string }[];
  emphasize: string[];
};

export class ArchetypeMatch {
  public readonly archetypeId: string;
  public readonly archetypeKey: string;
  public readonly tagOverlap: number;
  public readonly reasoning: string;
  public readonly suggestedTuning: SuggestedTuning;

  public constructor(props: {
    archetypeId: string;
    archetypeKey: string;
    tagOverlap: number;
    reasoning: string;
    suggestedTuning: SuggestedTuning;
  }) {
    this.archetypeId = props.archetypeId;
    this.archetypeKey = props.archetypeKey;
    this.tagOverlap = props.tagOverlap;
    this.reasoning = props.reasoning;
    this.suggestedTuning = props.suggestedTuning;
  }
}
```

- [ ] **Step 3: Write failing test for JobPosting**

```typescript
// domain/test/entities/JobPosting.test.ts
import { describe, expect, test } from 'bun:test';
import { JobPosting } from '../../src/entities/JobPosting.js';
import { JobRequirements } from '../../src/value-objects/JobRequirements.js';

describe('JobPosting', () => {
  test('creates with empty requirements and no matches', () => {
    const job = JobPosting.create({
      linkedinUrl: 'https://linkedin.com/jobs/view/123',
      title: 'Staff Engineer',
      companyName: 'Acme',
      companyWebsite: 'https://acme.com',
      companyLogo: null,
      companyIndustry: null,
      companySize: null,
      location: 'New York, NY',
      salary: '$200k - $250k',
      description: 'We are looking for a staff engineer...'
    });
    expect(job.title).toBe('Staff Engineer');
    expect(job.requirements.skillTags).toEqual([]);
    expect(job.archetypeMatches).toEqual([]);
  });

  test('sets requirements', () => {
    const job = JobPosting.create({
      linkedinUrl: 'https://linkedin.com/jobs/view/123',
      title: 'Staff Engineer',
      companyName: 'Acme',
      companyWebsite: null,
      companyLogo: null,
      companyIndustry: null,
      companySize: null,
      location: 'Remote',
      salary: null,
      description: 'Full stack role'
    });
    const reqs = new JobRequirements({
      skillTags: ['typescript', 'react'],
      roleTags: ['ic'],
      senioritySignal: 'senior'
    });
    job.setRequirements(reqs);
    expect(job.requirements.skillTags).toEqual(['typescript', 'react']);
    expect(job.requirements.senioritySignal).toBe('senior');
  });
});
```

- [ ] **Step 4: Implement JobPosting**

```typescript
// domain/src/entities/JobPosting.ts
import { AggregateRoot } from '../AggregateRoot.js';
import type { ArchetypeMatch } from '../value-objects/ArchetypeMatch.js';
import { JobRequirements } from '../value-objects/JobRequirements.js';
import { ValueObject } from '../ValueObject.js';

// Note: Also create domain/src/value-objects/JobPostingId.ts following the ID pattern from Task 2.
// Imported here as:
import { JobPostingId } from '../value-objects/JobPostingId.js';

export type JobPostingCreateProps = {
  linkedinUrl: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyLogo: string | null;
  companyIndustry: string | null;
  companySize: string | null;
  location: string | null;
  salary: string | null;
  description: string;
};

export class JobPosting extends AggregateRoot<JobPostingId> {
  public readonly linkedinUrl: string;
  public title: string;
  public companyName: string;
  public companyWebsite: string | null;
  public companyLogo: string | null;
  public companyIndustry: string | null;
  public companySize: string | null;
  public location: string | null;
  public salary: string | null;
  public description: string;
  public requirements: JobRequirements;
  public archetypeMatches: ArchetypeMatch[];
  public readonly scrapedAt: Date;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: JobPostingId;
    linkedinUrl: string;
    title: string;
    companyName: string;
    companyWebsite: string | null;
    companyLogo: string | null;
    companyIndustry: string | null;
    companySize: string | null;
    location: string | null;
    salary: string | null;
    description: string;
    requirements: JobRequirements;
    archetypeMatches: ArchetypeMatch[];
    scrapedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.linkedinUrl = props.linkedinUrl;
    this.title = props.title;
    this.companyName = props.companyName;
    this.companyWebsite = props.companyWebsite;
    this.companyLogo = props.companyLogo;
    this.companyIndustry = props.companyIndustry;
    this.companySize = props.companySize;
    this.location = props.location;
    this.salary = props.salary;
    this.description = props.description;
    this.requirements = props.requirements;
    this.archetypeMatches = props.archetypeMatches;
    this.scrapedAt = props.scrapedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public setRequirements(requirements: JobRequirements): void {
    this.requirements = requirements;
    this.updatedAt = new Date();
  }

  public setArchetypeMatches(matches: ArchetypeMatch[]): void {
    this.archetypeMatches = matches;
    this.updatedAt = new Date();
  }

  public static create(props: JobPostingCreateProps): JobPosting {
    const now = new Date();
    return new JobPosting({
      id: JobPostingId.generate(),
      ...props,
      requirements: JobRequirements.empty(),
      archetypeMatches: [],
      scrapedAt: now,
      createdAt: now,
      updatedAt: now
    });
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd domain && bun test test/entities/JobPosting.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add domain/src/value-objects/JobRequirements.ts domain/src/value-objects/ArchetypeMatch.ts domain/src/entities/JobPosting.ts domain/test/entities/JobPosting.test.ts
git commit -m "feat: add JobPosting aggregate with JobRequirements and ArchetypeMatch"
```

---

### Task 12: Repository Ports

**Files:**
- Create: `domain/src/ports/ExperienceRepository.ts`
- Create: `domain/src/ports/ProjectRepository.ts`
- Create: `domain/src/ports/ProfileRepository.ts`
- Create: `domain/src/ports/HeadlineRepository.ts`
- Create: `domain/src/ports/EducationRepository.ts`
- Create: `domain/src/ports/SkillCategoryRepository.ts`
- Create: `domain/src/ports/ArchetypeRepository.ts`
- Create: `domain/src/ports/JobPostingRepository.ts`
- Create: `domain/src/ports/TagRepository.ts`

- [ ] **Step 1: Create all repository interfaces**

Each follows the pattern of the existing `ResumeCompanyRepository`:

```typescript
// domain/src/ports/ExperienceRepository.ts
import type { Experience } from '../entities/Experience.js';

export interface ExperienceRepository {
  findByIdOrFail(id: string): Promise<Experience>;
  findAllByProfileId(profileId: string): Promise<Experience[]>;
  findByBulletIdOrFail(bulletId: string): Promise<Experience>;
  save(experience: Experience): Promise<void>;
  delete(id: string): Promise<void>;
}
```

```typescript
// domain/src/ports/ProjectRepository.ts
import type { Project } from '../entities/Project.js';

export interface ProjectRepository {
  findByIdOrFail(id: string): Promise<Project>;
  findAllByProfileId(profileId: string): Promise<Project[]>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}
```

```typescript
// domain/src/ports/ProfileRepository.ts
import type { Profile } from '../entities/Profile.js';

export interface ProfileRepository {
  findByIdOrFail(id: string): Promise<Profile>;
  findFirst(): Promise<Profile | null>;
  save(profile: Profile): Promise<void>;
}
```

```typescript
// domain/src/ports/HeadlineRepository.ts
import type { Headline } from '../entities/Headline.js';

export interface HeadlineRepository {
  findByIdOrFail(id: string): Promise<Headline>;
  findAllByProfileId(profileId: string): Promise<Headline[]>;
  save(headline: Headline): Promise<void>;
  delete(id: string): Promise<void>;
}
```

```typescript
// domain/src/ports/EducationRepository.ts
import type { Education } from '../entities/Education.js';

export interface EducationRepository {
  findByIdOrFail(id: string): Promise<Education>;
  findAllByProfileId(profileId: string): Promise<Education[]>;
  save(education: Education): Promise<void>;
  delete(id: string): Promise<void>;
}
```

```typescript
// domain/src/ports/SkillCategoryRepository.ts
import type { SkillCategory } from '../entities/SkillCategory.js';

export interface SkillCategoryRepository {
  findByIdOrFail(id: string): Promise<SkillCategory>;
  findAllByProfileId(profileId: string): Promise<SkillCategory[]>;
  save(category: SkillCategory): Promise<void>;
  delete(id: string): Promise<void>;
}
```

```typescript
// domain/src/ports/TagRepository.ts
import type { Tag, TagDimension } from '../entities/Tag.js';

export interface TagRepository {
  findByIdOrFail(id: string): Promise<Tag>;
  findByNameAndDimension(name: string, dimension: TagDimension): Promise<Tag | null>;
  findAllByDimension(dimension: TagDimension): Promise<Tag[]>;
  findAll(): Promise<Tag[]>;
  save(tag: Tag): Promise<void>;
  delete(id: string): Promise<void>;
}
```

```typescript
// domain/src/ports/ArchetypeRepository.ts
import type { Archetype } from '../entities/Archetype.js';

export interface ArchetypeRepository {
  findByIdOrFail(id: string): Promise<Archetype>;
  findAllByProfileId(profileId: string): Promise<Archetype[]>;
  save(archetype: Archetype): Promise<void>;
  delete(id: string): Promise<void>;
}
```

```typescript
// domain/src/ports/JobPostingRepository.ts
import type { JobPosting } from '../entities/JobPosting.js';

export interface JobPostingRepository {
  findByIdOrFail(id: string): Promise<JobPosting>;
  findByLinkedinUrl(url: string): Promise<JobPosting | null>;
  findAll(): Promise<JobPosting[]>;
  save(jobPosting: JobPosting): Promise<void>;
  delete(id: string): Promise<void>;
}
```

- [ ] **Step 2: Update domain barrel exports (`domain/src/index.ts`)**

Add all new entities, value objects, and ports to the barrel. Keep existing exports for backward compatibility during migration.

- [ ] **Step 3: Commit**

```bash
git add domain/src/ports/ domain/src/index.ts
git commit -m "feat: add repository ports for new domain model"
```

---

## Phase 4: Application Layer — ClaudeService Port + Use Cases

### Task 13: ClaudeService Port

**Files:**
- Create: `application/src/ports/ClaudeService.ts`

- [ ] **Step 1: Define ClaudeService interface**

```typescript
// application/src/ports/ClaudeService.ts
import type { TagSet } from '@tailoredin/domain';

export type SuggestVariantsInput = {
  bullet: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
};

export type SuggestedVariantDto = {
  text: string;
  angle: string;
  roleTags: string[];
  skillTags: string[];
};

export type SuggestVariantsOutput = {
  variants: SuggestedVariantDto[];
};

export type AutoTagInput = {
  text: string;
  title: string;
  company: string;
};

export type AutoTagOutput = {
  roleTags: string[];
  skillTags: string[];
};

export type AnalyzeJobInput = {
  jobDescription: string;
  jobTitle: string;
  company: string;
  archetypes: { key: string; label: string; tagProfile: { roleWeights: Record<string, number>; skillWeights: Record<string, number> } }[];
};

export type AnalyzeJobMatchDto = {
  archetypeKey: string;
  reasoning: string;
  suggestedTuning: {
    swapVariants: { bulletId: string; preferredVariantAngle: string }[];
    emphasize: string[];
  };
};

export type AnalyzeJobOutput = {
  requirements: {
    skillTags: string[];
    roleTags: string[];
    senioritySignal: string;
  };
  archetypeMatches: AnalyzeJobMatchDto[];
};

export interface ClaudeService {
  suggestVariants(input: SuggestVariantsInput): Promise<SuggestVariantsOutput>;
  autoTag(input: AutoTagInput): Promise<AutoTagOutput>;
  analyzeJob(input: AnalyzeJobInput): Promise<AnalyzeJobOutput>;
}
```

- [ ] **Step 2: Update application barrel exports**

- [ ] **Step 3: Commit**

```bash
git add application/src/ports/ClaudeService.ts application/src/ports/index.ts application/src/index.ts
git commit -m "feat: add ClaudeService port with typed inputs/outputs"
```

---

### Task 14: Core CRUD Use Cases (Experience, Bullet, BulletVariant)

**Files:**
- Create: `application/src/use-cases/experience/CreateExperience.ts`
- Create: `application/src/use-cases/experience/ListExperiences.ts`
- Create: `application/src/use-cases/experience/UpdateExperience.ts`
- Create: `application/src/use-cases/experience/DeleteExperience.ts`
- Create: `application/src/use-cases/experience/AddBullet.ts`
- Create: `application/src/use-cases/experience/UpdateBullet.ts`
- Create: `application/src/use-cases/experience/DeleteBullet.ts`
- Create: `application/src/use-cases/experience/AddBulletVariant.ts`
- Create: `application/src/use-cases/experience/ApproveBulletVariant.ts`
- Create: `application/src/use-cases/experience/DeleteBulletVariant.ts`
- Create: `application/src/dtos/ExperienceDto.ts`

- [ ] **Step 1: Define DTOs**

```typescript
// application/src/dtos/ExperienceDto.ts
export type BulletVariantDto = {
  id: string;
  text: string;
  angle: string;
  roleTags: string[];
  skillTags: string[];
  source: 'llm' | 'manual';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
};

export type BulletDto = {
  id: string;
  content: string;
  ordinal: number;
  roleTags: string[];
  skillTags: string[];
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

- [ ] **Step 2: Implement CreateExperience**

```typescript
// application/src/use-cases/experience/CreateExperience.ts
import { Experience, ok, type ExperienceRepository, type Result } from '@tailoredin/domain';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';

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
  public constructor(private readonly repo: ExperienceRepository) {}

  public async execute(input: CreateExperienceInput): Promise<Result<ExperienceDto, Error>> {
    const experience = Experience.create(input);
    await this.repo.save(experience);
    return ok({
      id: experience.id.value,
      title: experience.title,
      companyName: experience.companyName,
      companyWebsite: experience.companyWebsite,
      location: experience.location,
      startDate: experience.startDate,
      endDate: experience.endDate,
      summary: experience.summary,
      ordinal: experience.ordinal,
      bullets: []
    });
  }
}
```

- [ ] **Step 3: Implement ListExperiences**

```typescript
// application/src/use-cases/experience/ListExperiences.ts
import { ok, type ExperienceRepository, type Result } from '@tailoredin/domain';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';

export class ListExperiences {
  public constructor(private readonly repo: ExperienceRepository) {}

  public async execute(profileId: string): Promise<Result<ExperienceDto[], Error>> {
    const experiences = await this.repo.findAllByProfileId(profileId);
    return ok(
      experiences.map(exp => ({
        id: exp.id.value,
        title: exp.title,
        companyName: exp.companyName,
        companyWebsite: exp.companyWebsite,
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate,
        summary: exp.summary,
        ordinal: exp.ordinal,
        bullets: exp.bullets.map(b => ({
          id: b.id.value,
          content: b.content,
          ordinal: b.ordinal,
          roleTags: [...b.tags.roleTags],
          skillTags: [...b.tags.skillTags],
          variants: b.variants.map(v => ({
            id: v.id.value,
            text: v.text,
            angle: v.angle,
            roleTags: [...v.tags.roleTags],
            skillTags: [...v.tags.skillTags],
            source: v.source,
            approvalStatus: v.approvalStatus
          }))
        }))
      }))
    );
  }
}
```

- [ ] **Step 4: Implement AddBullet**

```typescript
// application/src/use-cases/experience/AddBullet.ts
import { err, ok, type Experience, type ExperienceRepository, type Result } from '@tailoredin/domain';
import type { BulletDto } from '../../dtos/ExperienceDto.js';

export type AddBulletInput = {
  experienceId: string;
  content: string;
  ordinal: number;
};

export class AddBullet {
  public constructor(private readonly repo: ExperienceRepository) {}

  public async execute(input: AddBulletInput): Promise<Result<BulletDto, Error>> {
    let experience: Experience;
    try {
      experience = await this.repo.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    const bullet = experience.addBullet({ content: input.content, ordinal: input.ordinal });
    await this.repo.save(experience);

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

- [ ] **Step 5: Implement AddBulletVariant**

```typescript
// application/src/use-cases/experience/AddBulletVariant.ts
import { err, ok, TagSet, type Experience, type ExperienceRepository, type Result } from '@tailoredin/domain';
import type { BulletVariantDto } from '../../dtos/ExperienceDto.js';

export type AddBulletVariantInput = {
  experienceId: string;
  bulletId: string;
  text: string;
  angle: string;
  roleTags: string[];
  skillTags: string[];
  source: 'llm' | 'manual';
};

export class AddBulletVariant {
  public constructor(private readonly repo: ExperienceRepository) {}

  public async execute(input: AddBulletVariantInput): Promise<Result<BulletVariantDto, Error>> {
    let experience: Experience;
    try {
      experience = await this.repo.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    let bullet;
    try {
      bullet = experience.findBulletOrFail(input.bulletId);
    } catch {
      return err(new Error(`Bullet not found: ${input.bulletId}`));
    }

    const variant = bullet.addVariant({
      text: input.text,
      angle: input.angle,
      tags: new TagSet({ roleTags: input.roleTags, skillTags: input.skillTags }),
      source: input.source
    });
    await this.repo.save(experience);

    return ok({
      id: variant.id.value,
      text: variant.text,
      angle: variant.angle,
      roleTags: [...variant.tags.roleTags],
      skillTags: [...variant.tags.skillTags],
      source: variant.source,
      approvalStatus: variant.approvalStatus
    });
  }
}
```

- [ ] **Step 6: Implement ApproveBulletVariant**

```typescript
// application/src/use-cases/experience/ApproveBulletVariant.ts
import { err, ok, type ExperienceRepository, type Result } from '@tailoredin/domain';

export type ApproveBulletVariantInput = {
  bulletId: string;
  variantId: string;
};

export class ApproveBulletVariant {
  public constructor(private readonly repo: ExperienceRepository) {}

  public async execute(input: ApproveBulletVariantInput): Promise<Result<void, Error>> {
    let experience;
    try {
      experience = await this.repo.findByBulletIdOrFail(input.bulletId);
    } catch {
      return err(new Error(`Bullet not found: ${input.bulletId}`));
    }

    const bullet = experience.findBulletOrFail(input.bulletId);
    const variant = bullet.findVariantOrFail(input.variantId);
    variant.approve();
    await this.repo.save(experience);
    return ok(undefined);
  }
}
```

- [ ] **Step 7: Implement remaining CRUD use cases**

Implement `UpdateExperience`, `DeleteExperience`, `UpdateBullet`, `DeleteBullet`, `DeleteBulletVariant` following the same patterns. Each:
- Takes an input type
- Loads the aggregate via repository
- Performs the mutation
- Saves
- Returns Result

The patterns are identical to `AddBullet` and the existing `UpdateBullet`/`DeleteBullet` use cases.

- [ ] **Step 8: Commit**

```bash
git add application/src/dtos/ExperienceDto.ts application/src/use-cases/experience/
git commit -m "feat: add Experience/Bullet/BulletVariant use cases and DTOs"
```

---

### Task 15: LLM Use Cases (SuggestBulletVariants, AutoTagBullet)

**Files:**
- Create: `application/src/use-cases/experience/SuggestBulletVariants.ts`
- Create: `application/src/use-cases/experience/AutoTagBullet.ts`

- [ ] **Step 1: Implement SuggestBulletVariants**

```typescript
// application/src/use-cases/experience/SuggestBulletVariants.ts
import { err, ok, TagSet, type Experience, type ExperienceRepository, type Result } from '@tailoredin/domain';
import type { BulletVariantDto } from '../../dtos/ExperienceDto.js';
import type { ClaudeService } from '../../ports/ClaudeService.js';

export type SuggestBulletVariantsInput = {
  experienceId: string;
  bulletId: string;
};

export class SuggestBulletVariants {
  public constructor(
    private readonly repo: ExperienceRepository,
    private readonly claudeService: ClaudeService
  ) {}

  public async execute(input: SuggestBulletVariantsInput): Promise<Result<BulletVariantDto[], Error>> {
    let experience: Experience;
    try {
      experience = await this.repo.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    let bullet;
    try {
      bullet = experience.findBulletOrFail(input.bulletId);
    } catch {
      return err(new Error(`Bullet not found: ${input.bulletId}`));
    }

    const result = await this.claudeService.suggestVariants({
      bullet: bullet.content,
      title: experience.title,
      company: experience.companyName,
      startDate: experience.startDate,
      endDate: experience.endDate
    });

    const created: BulletVariantDto[] = [];
    for (const suggestion of result.variants) {
      const variant = bullet.addVariant({
        text: suggestion.text,
        angle: suggestion.angle,
        tags: new TagSet({ roleTags: suggestion.roleTags, skillTags: suggestion.skillTags }),
        source: 'llm'
      });
      created.push({
        id: variant.id.value,
        text: variant.text,
        angle: variant.angle,
        roleTags: [...variant.tags.roleTags],
        skillTags: [...variant.tags.skillTags],
        source: variant.source,
        approvalStatus: variant.approvalStatus
      });
    }

    await this.repo.save(experience);
    return ok(created);
  }
}
```

- [ ] **Step 2: Implement AutoTagBullet**

```typescript
// application/src/use-cases/experience/AutoTagBullet.ts
import { err, ok, TagSet, type ExperienceRepository, type Result } from '@tailoredin/domain';
import type { ClaudeService } from '../../ports/ClaudeService.js';

export type AutoTagBulletInput = {
  experienceId: string;
  bulletId: string;
  variantId?: string;
};

export type AutoTagBulletOutput = {
  roleTags: string[];
  skillTags: string[];
};

export class AutoTagBullet {
  public constructor(
    private readonly repo: ExperienceRepository,
    private readonly claudeService: ClaudeService
  ) {}

  public async execute(input: AutoTagBulletInput): Promise<Result<AutoTagBulletOutput, Error>> {
    let experience;
    try {
      experience = await this.repo.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    const bullet = experience.findBulletOrFail(input.bulletId);
    const text = input.variantId
      ? bullet.findVariantOrFail(input.variantId).text
      : bullet.content;

    const result = await this.claudeService.autoTag({
      text,
      title: experience.title,
      company: experience.companyName
    });

    const tags = new TagSet({ roleTags: result.roleTags, skillTags: result.skillTags });

    if (input.variantId) {
      bullet.findVariantOrFail(input.variantId).tags = tags;
    } else {
      bullet.updateTags(tags);
    }

    await this.repo.save(experience);
    return ok({ roleTags: result.roleTags, skillTags: result.skillTags });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add application/src/use-cases/experience/SuggestBulletVariants.ts application/src/use-cases/experience/AutoTagBullet.ts
git commit -m "feat: add SuggestBulletVariants and AutoTagBullet LLM use cases"
```

---

### Task 16: Job Analysis Use Case

**Files:**
- Create: `application/src/use-cases/job/ImportJob.ts`
- Create: `application/src/use-cases/job/AnalyzeJob.ts`
- Create: `application/src/dtos/JobPostingDto.ts`

- [ ] **Step 1: Define JobPosting DTOs**

```typescript
// application/src/dtos/JobPostingDto.ts
export type JobPostingDto = {
  id: string;
  linkedinUrl: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyLogo: string | null;
  companyIndustry: string | null;
  companySize: string | null;
  location: string | null;
  salary: string | null;
  description: string;
  requirements: {
    skillTags: string[];
    roleTags: string[];
    senioritySignal: string | null;
  };
  archetypeMatches: {
    archetypeId: string;
    archetypeKey: string;
    tagOverlap: number;
    reasoning: string;
    suggestedTuning: {
      swapVariants: { bulletId: string; preferredVariantAngle: string }[];
      emphasize: string[];
    };
  }[];
};
```

- [ ] **Step 2: Implement ImportJob**

```typescript
// application/src/use-cases/job/ImportJob.ts
import { err, ok, type Result } from '@tailoredin/domain';
import { JobPosting, type JobPostingRepository } from '@tailoredin/domain';
import type { JobScraper } from '../../ports/JobScraper.js';
import type { JobPostingDto } from '../../dtos/JobPostingDto.js';

export type ImportJobInput = {
  linkedinUrl: string;
};

export class ImportJob {
  public constructor(
    private readonly repo: JobPostingRepository,
    private readonly scraper: JobScraper
  ) {}

  public async execute(input: ImportJobInput): Promise<Result<JobPostingDto, Error>> {
    const existing = await this.repo.findByLinkedinUrl(input.linkedinUrl);
    if (existing) {
      return err(new Error(`Job already imported: ${input.linkedinUrl}`));
    }

    const scraped = await this.scraper.scrapeByUrl(input.linkedinUrl);
    const job = JobPosting.create({
      linkedinUrl: input.linkedinUrl,
      title: scraped.result.title,
      companyName: scraped.result.companyName,
      companyWebsite: scraped.result.companyWebsite ?? null,
      companyLogo: scraped.result.companyLogo ?? null,
      companyIndustry: scraped.result.companyIndustry ?? null,
      companySize: scraped.result.companySize ?? null,
      location: scraped.result.location ?? null,
      salary: scraped.result.salary ?? null,
      description: scraped.result.description
    });

    await this.repo.save(job);
    return ok(this.toDto(job));
  }

  private toDto(job: JobPosting): JobPostingDto {
    return {
      id: job.id.value,
      linkedinUrl: job.linkedinUrl,
      title: job.title,
      companyName: job.companyName,
      companyWebsite: job.companyWebsite,
      companyLogo: job.companyLogo,
      companyIndustry: job.companyIndustry,
      companySize: job.companySize,
      location: job.location,
      salary: job.salary,
      description: job.description,
      requirements: {
        skillTags: [...job.requirements.skillTags],
        roleTags: [...job.requirements.roleTags],
        senioritySignal: job.requirements.senioritySignal
      },
      archetypeMatches: job.archetypeMatches.map(m => ({
        archetypeId: m.archetypeId,
        archetypeKey: m.archetypeKey,
        tagOverlap: m.tagOverlap,
        reasoning: m.reasoning,
        suggestedTuning: m.suggestedTuning
      }))
    };
  }
}
```

- [ ] **Step 3: Implement AnalyzeJob**

```typescript
// application/src/use-cases/job/AnalyzeJob.ts
import {
  ArchetypeMatch,
  JobRequirements,
  TagProfile,
  err,
  ok,
  type ArchetypeRepository,
  type JobPostingRepository,
  type Result
} from '@tailoredin/domain';
import type { ClaudeService } from '../../ports/ClaudeService.js';
import type { JobPostingDto } from '../../dtos/JobPostingDto.js';

export type AnalyzeJobInput = {
  jobPostingId: string;
  profileId: string;
};

export class AnalyzeJob {
  public constructor(
    private readonly jobRepo: JobPostingRepository,
    private readonly archetypeRepo: ArchetypeRepository,
    private readonly claudeService: ClaudeService
  ) {}

  public async execute(input: AnalyzeJobInput): Promise<Result<JobPostingDto, Error>> {
    let job;
    try {
      job = await this.jobRepo.findByIdOrFail(input.jobPostingId);
    } catch {
      return err(new Error(`Job not found: ${input.jobPostingId}`));
    }

    const archetypes = await this.archetypeRepo.findAllByProfileId(input.profileId);
    if (archetypes.length === 0) {
      return err(new Error('No archetypes defined — create at least one before analyzing jobs'));
    }

    const llmResult = await this.claudeService.analyzeJob({
      jobDescription: job.description,
      jobTitle: job.title,
      company: job.companyName,
      archetypes: archetypes.map(a => ({
        key: a.key,
        label: a.label,
        tagProfile: {
          roleWeights: Object.fromEntries(a.tagProfile.roleWeights),
          skillWeights: Object.fromEntries(a.tagProfile.skillWeights)
        }
      }))
    });

    // Set requirements
    job.setRequirements(new JobRequirements({
      skillTags: llmResult.requirements.skillTags,
      roleTags: llmResult.requirements.roleTags,
      senioritySignal: llmResult.requirements.senioritySignal
    }));

    // Compute tag overlap + merge LLM reasoning
    const jobTagProfile = new TagProfile({
      roleWeights: new Map(llmResult.requirements.roleTags.map(t => [t, 1.0])),
      skillWeights: new Map(llmResult.requirements.skillTags.map(t => [t, 1.0]))
    });

    const matches = archetypes.map(archetype => {
      const tagOverlap = archetype.tagProfile.overlapWith(jobTagProfile);
      const llmMatch = llmResult.archetypeMatches.find(m => m.archetypeKey === archetype.key);
      return new ArchetypeMatch({
        archetypeId: archetype.id.value,
        archetypeKey: archetype.key,
        tagOverlap,
        reasoning: llmMatch?.reasoning ?? '',
        suggestedTuning: llmMatch?.suggestedTuning ?? { swapVariants: [], emphasize: [] }
      });
    }).sort((a, b) => b.tagOverlap - a.tagOverlap);

    job.setArchetypeMatches(matches);
    await this.jobRepo.save(job);

    return ok({
      id: job.id.value,
      linkedinUrl: job.linkedinUrl,
      title: job.title,
      companyName: job.companyName,
      companyWebsite: job.companyWebsite,
      companyLogo: job.companyLogo,
      companyIndustry: job.companyIndustry,
      companySize: job.companySize,
      location: job.location,
      salary: job.salary,
      description: job.description,
      requirements: {
        skillTags: [...job.requirements.skillTags],
        roleTags: [...job.requirements.roleTags],
        senioritySignal: job.requirements.senioritySignal
      },
      archetypeMatches: matches.map(m => ({
        archetypeId: m.archetypeId,
        archetypeKey: m.archetypeKey,
        tagOverlap: m.tagOverlap,
        reasoning: m.reasoning,
        suggestedTuning: m.suggestedTuning
      }))
    });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add application/src/use-cases/job/ application/src/dtos/JobPostingDto.ts
git commit -m "feat: add ImportJob and AnalyzeJob use cases"
```

---

## Phase 5: Infrastructure — Migration, ORM Entities, Repositories, ClaudeCliService

### Task 17: Database Migration

**Files:**
- Create: `infrastructure/src/db/migrations/Migration_20260404000000_domain_rethink.ts`

- [ ] **Step 1: Write the migration**

This migration creates the new schema alongside the old one (no destructive changes yet). A future migration will drop old tables after data migration.

```typescript
// infrastructure/src/db/migrations/Migration_20260404000000_domain_rethink.ts
import { Migration } from '@mikro-orm/migrations';

export class Migration_20260404000000_domain_rethink extends Migration {
  override async up(): Promise<void> {
    // 1. Tags vocabulary
    this.addSql(`
      CREATE TABLE "tags" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "dimension" text NOT NULL CHECK ("dimension" IN ('ROLE', 'SKILL')),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "tags_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "tags_name_dimension_unique" UNIQUE ("name", "dimension")
      );
    `);

    // 2. Profiles
    this.addSql(`
      CREATE TABLE "profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "email" text NOT NULL,
        "first_name" text NOT NULL,
        "last_name" text NOT NULL,
        "phone" text NULL,
        "location" text NULL,
        "linkedin_url" text NULL,
        "github_url" text NULL,
        "website_url" text NULL,
        CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
      );
    `);

    // 3. Experiences
    this.addSql(`
      CREATE TABLE "experiences" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "title" text NOT NULL,
        "company_name" text NOT NULL,
        "company_website" text NULL,
        "location" text NOT NULL DEFAULT '',
        "start_date" text NOT NULL,
        "end_date" text NOT NULL,
        "summary" text NULL,
        "ordinal" integer NOT NULL DEFAULT 0,
        CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "experiences_profile_id_idx" ON "experiences"("profile_id");`);

    // 4. Bullets
    this.addSql(`
      CREATE TABLE "bullets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "experience_id" uuid NOT NULL REFERENCES "experiences"("id") ON DELETE CASCADE,
        "content" text NOT NULL,
        "ordinal" integer NOT NULL DEFAULT 0,
        CONSTRAINT "bullets_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "bullets_experience_id_idx" ON "bullets"("experience_id");`);

    // 5. Bullet tags (join table)
    this.addSql(`
      CREATE TABLE "bullet_tags" (
        "bullet_id" uuid NOT NULL REFERENCES "bullets"("id") ON DELETE CASCADE,
        "tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        CONSTRAINT "bullet_tags_pkey" PRIMARY KEY ("bullet_id", "tag_id")
      );
    `);

    // 6. Bullet variants
    this.addSql(`
      CREATE TABLE "bullet_variants" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "bullet_id" uuid NOT NULL REFERENCES "bullets"("id") ON DELETE CASCADE,
        "text" text NOT NULL,
        "angle" text NOT NULL,
        "source" text NOT NULL CHECK ("source" IN ('llm', 'manual')),
        "approval_status" text NOT NULL DEFAULT 'PENDING' CHECK ("approval_status" IN ('PENDING', 'APPROVED', 'REJECTED')),
        CONSTRAINT "bullet_variants_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "bullet_variants_bullet_id_idx" ON "bullet_variants"("bullet_id");`);

    // 7. Bullet variant tags (join table)
    this.addSql(`
      CREATE TABLE "bullet_variant_tags" (
        "bullet_variant_id" uuid NOT NULL REFERENCES "bullet_variants"("id") ON DELETE CASCADE,
        "tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        CONSTRAINT "bullet_variant_tags_pkey" PRIMARY KEY ("bullet_variant_id", "tag_id")
      );
    `);

    // 8. Projects
    this.addSql(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "description" text NULL,
        "url" text NULL,
        "start_date" text NOT NULL,
        "end_date" text NULL,
        "ordinal" integer NOT NULL DEFAULT 0,
        CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "projects_profile_id_idx" ON "projects"("profile_id");`);

    // 9. Project tags (join table)
    this.addSql(`
      CREATE TABLE "project_tags" (
        "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        CONSTRAINT "project_tags_pkey" PRIMARY KEY ("project_id", "tag_id")
      );
    `);

    // 10. Headlines (new table with role tags)
    this.addSql(`
      CREATE TABLE "headlines" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "label" text NOT NULL,
        "summary_text" text NOT NULL,
        CONSTRAINT "headlines_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "headlines_profile_id_idx" ON "headlines"("profile_id");`);

    // 11. Headline tags (join table — role tags only)
    this.addSql(`
      CREATE TABLE "headline_tags" (
        "headline_id" uuid NOT NULL REFERENCES "headlines"("id") ON DELETE CASCADE,
        "tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        CONSTRAINT "headline_tags_pkey" PRIMARY KEY ("headline_id", "tag_id")
      );
    `);

    // 12. Education
    this.addSql(`
      CREATE TABLE "educations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "degree_title" text NOT NULL,
        "institution_name" text NOT NULL,
        "graduation_year" integer NOT NULL,
        "location" text NULL,
        "honors" text NULL,
        "ordinal" integer NOT NULL DEFAULT 0,
        CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "educations_profile_id_idx" ON "educations"("profile_id");`);

    // 13. Skill categories + items
    this.addSql(`
      CREATE TABLE "skill_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "ordinal" integer NOT NULL DEFAULT 0,
        CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "skill_categories_profile_id_idx" ON "skill_categories"("profile_id");`);

    this.addSql(`
      CREATE TABLE "skill_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "skill_category_id" uuid NOT NULL REFERENCES "skill_categories"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "ordinal" integer NOT NULL DEFAULT 0,
        CONSTRAINT "skill_items_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "skill_items_skill_category_id_idx" ON "skill_items"("skill_category_id");`);

    // 14. Archetypes (new model)
    this.addSql(`
      CREATE TABLE "archetypes_v2" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
        "key" text NOT NULL,
        "label" text NOT NULL,
        "headline_id" uuid NOT NULL REFERENCES "headlines"("id"),
        "content_selection" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "archetypes_v2_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "archetypes_v2_profile_id_idx" ON "archetypes_v2"("profile_id");`);

    // 15. Archetype tag weights
    this.addSql(`
      CREATE TABLE "archetype_tag_weights" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "archetype_id" uuid NOT NULL REFERENCES "archetypes_v2"("id") ON DELETE CASCADE,
        "tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        "weight" real NOT NULL CHECK ("weight" >= 0 AND "weight" <= 1),
        CONSTRAINT "archetype_tag_weights_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "archetype_tag_weights_unique" UNIQUE ("archetype_id", "tag_id")
      );
    `);

    // 16. Job postings (new simplified model)
    this.addSql(`
      CREATE TABLE "job_postings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "linkedin_url" text NOT NULL UNIQUE,
        "title" text NOT NULL,
        "company_name" text NOT NULL,
        "company_website" text NULL,
        "company_logo" text NULL,
        "company_industry" text NULL,
        "company_size" text NULL,
        "location" text NULL,
        "salary" text NULL,
        "description" text NOT NULL,
        "requirements" jsonb NOT NULL DEFAULT '{}',
        "archetype_matches" jsonb NOT NULL DEFAULT '[]',
        "scraped_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
      );
    `);
  }

  override async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS "archetype_tag_weights" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "archetypes_v2" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "job_postings" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "headline_tags" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "project_tags" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "bullet_variant_tags" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "bullet_variants" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "bullet_tags" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "bullets" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "experiences" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "projects" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "headlines" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "educations" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "skill_items" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "skill_categories" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "tags" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "profiles" CASCADE;');
  }
}
```

- [ ] **Step 2: Run migration**

Run: `cd infrastructure && bun run db:migration:up`
Expected: Migration applied successfully

- [ ] **Step 3: Commit**

```bash
git add infrastructure/src/db/migrations/Migration_20260404000000_domain_rethink.ts
git commit -m "feat: add database migration for new domain model"
```

---

### Task 18: ORM Entities

**Files:**
- Create: ORM entities for all new tables under `infrastructure/src/db/entities/`

Follow the existing ORM entity patterns (see `ResumeBullet`, `ResumePosition` for reference). Each ORM entity:
- Extends `BaseEntity`
- Uses `@Entity({ tableName: '...' })`
- Uses `@UuidPrimaryKey()` for the ID
- Uses `@ManyToOne()` for FK relationships
- Uses `@OneToMany()` for child collections
- Has a `Props` type and `CreateProps` type
- Has a static `create()` factory

- [ ] **Step 1: Create ORM entities for Profile, Experience, Bullet, BulletVariant, Tag, Project, Headline, Education, SkillCategory, SkillItem, ArchetypeV2, ArchetypeTagWeight, JobPosting**

Follow the patterns in `infrastructure/src/db/entities/resume/` exactly. Key mappings:
- `bullet_tags` and `bullet_variant_tags` join tables use `@ManyToMany` or explicit join entities
- `archetypes_v2.content_selection` is a JSONB column mapped to a plain object
- `job_postings.requirements` and `job_postings.archetype_matches` are JSONB columns

- [ ] **Step 2: Register ORM entities in `orm-config.ts`**

- [ ] **Step 3: Commit**

```bash
git add infrastructure/src/db/entities/
git commit -m "feat: add ORM entities for new domain model"
```

---

### Task 19: Repository Implementations

**Files:**
- Create: Repository implementations under `infrastructure/src/repositories/`

Follow the pattern of `PostgresResumeCompanyRepository`: load ORM entities, map to domain entities, manage child collections, flush.

- [ ] **Step 1: Implement PostgresExperienceRepository**

Key: loads Experience → Bullets → BulletVariants with their tags (via join tables). Maps between ORM and domain entities bidirectionally.

- [ ] **Step 2: Implement remaining repositories**

`PostgresProfileRepository`, `PostgresProjectRepository`, `PostgresHeadlineRepository`, `PostgresEducationRepository`, `PostgresSkillCategoryRepository`, `PostgresTagRepository`, `PostgresArchetypeRepository`, `PostgresJobPostingRepository`

Each follows the same pattern: load ORM entity, map to domain, save domain back to ORM.

- [ ] **Step 3: Commit**

```bash
git add infrastructure/src/repositories/
git commit -m "feat: add repository implementations for new domain model"
```

---

### Task 20: ClaudeCliService

**Files:**
- Create: `infrastructure/src/services/ClaudeCliService.ts`

- [ ] **Step 1: Implement ClaudeCliService**

```typescript
// infrastructure/src/services/ClaudeCliService.ts
import { injectable } from '@needle-di/core';
import type {
  AnalyzeJobInput,
  AnalyzeJobOutput,
  AutoTagInput,
  AutoTagOutput,
  ClaudeService,
  SuggestVariantsInput,
  SuggestVariantsOutput
} from '@tailoredin/application';
import { Logger } from '@tailoredin/core';

@injectable()
export class ClaudeCliService implements ClaudeService {
  private readonly logger = Logger.create(ClaudeCliService.name);

  public async suggestVariants(input: SuggestVariantsInput): Promise<SuggestVariantsOutput> {
    const prompt = [
      `You are helping a software engineer rephrase a resume bullet point.`,
      `Context: ${input.title} at ${input.company} (${input.startDate} – ${input.endDate})`,
      `Original bullet: "${input.bullet}"`,
      `Suggest 2-3 alternative phrasings, each emphasizing a different angle (e.g., leadership, technical depth, impact/metrics).`,
      `For each variant, provide role tags and skill tags.`
    ].join('\n');

    return this.prompt<SuggestVariantsOutput>(prompt, SUGGEST_VARIANTS_SCHEMA);
  }

  public async autoTag(input: AutoTagInput): Promise<AutoTagOutput> {
    const prompt = [
      `Classify this resume bullet point with role tags and skill tags.`,
      `Context: ${input.title} at ${input.company}`,
      `Bullet: "${input.text}"`,
      `Role tags describe HOW the person contributed (e.g., leadership, ic, mentoring, architecture, hands-on, strategy).`,
      `Skill tags describe WHAT technologies/domains are involved (e.g., typescript, distributed-systems, react).`
    ].join('\n');

    return this.prompt<AutoTagOutput>(prompt, AUTO_TAG_SCHEMA);
  }

  public async analyzeJob(input: AnalyzeJobInput): Promise<AnalyzeJobOutput> {
    const prompt = [
      `Analyze this job posting and match it against the engineer's archetypes.`,
      `Job: ${input.jobTitle} at ${input.company}`,
      `Description:\n${input.jobDescription}`,
      `\nArchetypes:\n${input.archetypes.map(a => `- ${a.key}: ${a.label}`).join('\n')}`,
      `\nExtract skill and role requirements, then rank which archetype fits best with reasoning.`
    ].join('\n');

    return this.prompt<AnalyzeJobOutput>(prompt, ANALYZE_JOB_SCHEMA);
  }

  private async prompt<T>(input: string, schema: object): Promise<T> {
    const schemaJson = JSON.stringify(schema);
    const proc = Bun.spawn(
      ['claude', '--output-format', 'json', '--output-schema', schemaJson, '-p', input],
      { stdout: 'pipe', stderr: 'pipe' }
    );

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      this.logger.error(`Claude CLI failed (exit ${exitCode}): ${stderr}`);
      throw new Error(`Claude CLI failed: ${stderr}`);
    }

    return JSON.parse(stdout) as T;
  }
}

const SUGGEST_VARIANTS_SCHEMA = {
  type: 'object',
  properties: {
    variants: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          angle: { type: 'string' },
          roleTags: { type: 'array', items: { type: 'string' } },
          skillTags: { type: 'array', items: { type: 'string' } }
        },
        required: ['text', 'angle', 'roleTags', 'skillTags']
      }
    }
  },
  required: ['variants']
};

const AUTO_TAG_SCHEMA = {
  type: 'object',
  properties: {
    roleTags: { type: 'array', items: { type: 'string' } },
    skillTags: { type: 'array', items: { type: 'string' } }
  },
  required: ['roleTags', 'skillTags']
};

const ANALYZE_JOB_SCHEMA = {
  type: 'object',
  properties: {
    requirements: {
      type: 'object',
      properties: {
        skillTags: { type: 'array', items: { type: 'string' } },
        roleTags: { type: 'array', items: { type: 'string' } },
        senioritySignal: { type: 'string' }
      },
      required: ['skillTags', 'roleTags', 'senioritySignal']
    },
    archetypeMatches: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          archetypeKey: { type: 'string' },
          reasoning: { type: 'string' },
          suggestedTuning: {
            type: 'object',
            properties: {
              swapVariants: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    bulletId: { type: 'string' },
                    preferredVariantAngle: { type: 'string' }
                  },
                  required: ['bulletId', 'preferredVariantAngle']
                }
              },
              emphasize: { type: 'array', items: { type: 'string' } }
            },
            required: ['swapVariants', 'emphasize']
          }
        },
        required: ['archetypeKey', 'reasoning', 'suggestedTuning']
      }
    }
  },
  required: ['requirements', 'archetypeMatches']
};
```

- [ ] **Step 2: Commit**

```bash
git add infrastructure/src/services/ClaudeCliService.ts
git commit -m "feat: add ClaudeCliService implementation using Claude CLI"
```

---

### Task 21: DI Tokens + Updated Barrel Exports

**Files:**
- Modify: `infrastructure/src/DI.ts`
- Modify: `domain/src/index.ts`
- Modify: `application/src/index.ts`

- [ ] **Step 1: Add new DI tokens**

Add a new namespace in `DI` for the new domain model alongside existing tokens (don't remove old ones yet):

```typescript
// Add to infrastructure/src/DI.ts
Profile: {
  Repository: new InjectionToken<ProfileRepository>('DI.Profile.Repository'),
  GetProfile: new InjectionToken<GetProfile>('DI.Profile.GetProfile'),
  UpdateProfile: new InjectionToken<UpdateProfile>('DI.Profile.UpdateProfile'),
},

Experience: {
  Repository: new InjectionToken<ExperienceRepository>('DI.Experience.Repository'),
  CreateExperience: new InjectionToken<CreateExperience>('DI.Experience.CreateExperience'),
  ListExperiences: new InjectionToken<ListExperiences>('DI.Experience.ListExperiences'),
  UpdateExperience: new InjectionToken<UpdateExperience>('DI.Experience.UpdateExperience'),
  DeleteExperience: new InjectionToken<DeleteExperience>('DI.Experience.DeleteExperience'),
  AddBullet: new InjectionToken<AddBullet>('DI.Experience.AddBullet'),
  UpdateBullet: new InjectionToken<UpdateBullet>('DI.Experience.UpdateBullet'),
  DeleteBullet: new InjectionToken<DeleteBullet>('DI.Experience.DeleteBullet'),
  AddBulletVariant: new InjectionToken<AddBulletVariant>('DI.Experience.AddBulletVariant'),
  ApproveBulletVariant: new InjectionToken<ApproveBulletVariant>('DI.Experience.ApproveBulletVariant'),
  DeleteBulletVariant: new InjectionToken<DeleteBulletVariant>('DI.Experience.DeleteBulletVariant'),
  SuggestBulletVariants: new InjectionToken<SuggestBulletVariants>('DI.Experience.SuggestBulletVariants'),
  AutoTagBullet: new InjectionToken<AutoTagBullet>('DI.Experience.AutoTagBullet'),
},

Tag: {
  Repository: new InjectionToken<TagRepository>('DI.Tag.Repository'),
},

Claude: {
  Service: new InjectionToken<ClaudeService | null>('DI.Claude.Service'),
},
```

- [ ] **Step 2: Update barrel exports in domain and application packages**

Add all new entities, value objects, ports, use cases, and DTOs to their respective `index.ts` barrels.

- [ ] **Step 3: Commit**

```bash
git add infrastructure/src/DI.ts domain/src/index.ts application/src/index.ts application/src/use-cases/index.ts application/src/dtos/index.ts application/src/ports/index.ts
git commit -m "feat: add DI tokens and barrel exports for new domain model"
```

---

## Phase 6: API Routes

### Task 22: Experience + Bullet + Variant API Routes

**Files:**
- Create route files under `api/src/routes/` following existing naming pattern

- [ ] **Step 1: Create routes for Experience CRUD**

Follow the `AddBulletRoute` pattern:

| Route | Method | Path | Use Case |
|---|---|---|---|
| `CreateExperienceRoute` | POST | `/experiences` | CreateExperience |
| `ListExperiencesRoute` | GET | `/experiences` | ListExperiences |
| `UpdateExperienceRoute` | PUT | `/experiences/:id` | UpdateExperience |
| `DeleteExperienceRoute` | DELETE | `/experiences/:id` | DeleteExperience |

- [ ] **Step 2: Create routes for Bullet CRUD**

| Route | Method | Path | Use Case |
|---|---|---|---|
| `AddBulletRoute` | POST | `/experiences/:experienceId/bullets` | AddBullet |
| `UpdateBulletRoute` | PUT | `/bullets/:id` | UpdateBullet |
| `DeleteBulletRoute` | DELETE | `/bullets/:id` | DeleteBullet |

- [ ] **Step 3: Create routes for BulletVariant operations**

| Route | Method | Path | Use Case |
|---|---|---|---|
| `AddBulletVariantRoute` | POST | `/bullets/:bulletId/variants` | AddBulletVariant |
| `ApproveBulletVariantRoute` | PUT | `/variants/:id/approve` | ApproveBulletVariant |
| `DeleteBulletVariantRoute` | DELETE | `/variants/:id` | DeleteBulletVariant |
| `SuggestBulletVariantsRoute` | POST | `/bullets/:bulletId/suggest-variants` | SuggestBulletVariants |
| `AutoTagBulletRoute` | POST | `/bullets/:bulletId/auto-tag` | AutoTagBullet |

- [ ] **Step 4: Create routes for Job operations**

| Route | Method | Path | Use Case |
|---|---|---|---|
| `ImportJobRoute` | POST | `/job-postings` | ImportJob |
| `AnalyzeJobRoute` | POST | `/job-postings/:id/analyze` | AnalyzeJob |

- [ ] **Step 5: Wire routes in API composition root (`api/src/index.ts`)**

- [ ] **Step 6: Commit**

```bash
git add api/src/routes/ api/src/index.ts
git commit -m "feat: add API routes for Experience, Bullet, Variant, and Job operations"
```

---

## Phase 7: Integration Testing

### Task 23: Integration Tests

**Files:**
- Create: `infrastructure/test-integration/experience-repository.test.ts`

- [ ] **Step 1: Write integration test for ExperienceRepository**

Follow the existing pattern in `infrastructure/test-integration/`:

```typescript
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { MikroORM } from '@mikro-orm/postgresql';
import { Experience, TagSet } from '@tailoredin/domain';
import { PostgresExperienceRepository } from '../src/repositories/PostgresExperienceRepository.js';
import { setupTestDatabase, teardownTestDatabase } from './support/TestDatabase.js';

describe('PostgresExperienceRepository', () => {
  let orm: MikroORM;
  let repo: PostgresExperienceRepository;

  beforeAll(async () => {
    orm = await setupTestDatabase();
    repo = new PostgresExperienceRepository(orm);
  }, 60_000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test('saves and retrieves experience with bullets and variants', async () => {
    const exp = Experience.create({
      profileId: 'test-profile-id',
      title: 'Staff Engineer',
      companyName: 'Acme',
      companyWebsite: null,
      location: 'NYC',
      startDate: '2022-01',
      endDate: 'Present',
      summary: null,
      ordinal: 0
    });

    const bullet = exp.addBullet({ content: 'Built the platform', ordinal: 0 });
    bullet.updateTags(new TagSet({ roleTags: ['ic'], skillTags: ['typescript'] }));
    bullet.addVariant({
      text: 'Led platform initiative',
      angle: 'leadership',
      tags: new TagSet({ roleTags: ['leadership'], skillTags: ['typescript'] }),
      source: 'llm'
    });

    await repo.save(exp);

    const loaded = await repo.findByIdOrFail(exp.id.value);
    expect(loaded.title).toBe('Staff Engineer');
    expect(loaded.bullets).toHaveLength(1);
    expect(loaded.bullets[0].content).toBe('Built the platform');
    expect(loaded.bullets[0].tags.roleTags).toContain('ic');
    expect(loaded.bullets[0].variants).toHaveLength(1);
    expect(loaded.bullets[0].variants[0].angle).toBe('leadership');
  });
});
```

- [ ] **Step 2: Run integration tests**

Run: `cd infrastructure && bun test test-integration/experience-repository.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add infrastructure/test-integration/experience-repository.test.ts
git commit -m "test: add integration tests for ExperienceRepository"
```

---

## Summary

This plan covers the full domain rethink in 7 phases / 23 tasks:

1. **Phase 1** (Tasks 1-2): Value objects — TagSet, ApprovalStatus, IDs
2. **Phase 2** (Tasks 3-8): Domain entities — BulletVariant, Bullet, Experience, Project, Profile, Headline, Education, SkillCategory, SkillItem, Tag
3. **Phase 3** (Tasks 9-12): Archetype + Job entities — TagProfile, ContentSelection, Archetype, JobPosting, repository ports
4. **Phase 4** (Tasks 13-16): Application layer — ClaudeService port, CRUD use cases, LLM use cases, job analysis
5. **Phase 5** (Tasks 17-21): Infrastructure — migration, ORM entities, repositories, ClaudeCliService, DI tokens
6. **Phase 6** (Task 22): API routes
7. **Phase 7** (Task 23): Integration tests

Not covered in this plan (future work):
- Data migration from old schema to new schema
- Removing old entities/tables
- Web frontend for the new domain model
- Resume generation integration with new content model
