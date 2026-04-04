# Resume Wardrobe + Factory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Bullet-based authoring with narrative-based Accomplishments across all layers, then build a two-space frontend (Wardrobe content library + Factory resume generator).

**Architecture:** Domain-first refactor — new `Accomplishment` entity replaces `Bullet` throughout domain → infrastructure → application → API, then a fresh frontend with `/resume` route containing Wardrobe (Headlines/Experience/Skills tabs) and Factory (2-step wizard) tabs. Jobs are removed from the nav.

**Tech Stack:** Bun + TypeScript + MikroORM + Kysely migrations + Elysia + @needle-di/core + React 19 + TanStack Query + shadcn/ui + TanStack Router + pdf-parse (new dep for PDF text extraction)

---

## Worktree Setup

Before starting, create an isolated worktree:

```bash
git worktree add .claude/worktrees/wardrobe-factory -b feat/resume-wardrobe-factory
cd .claude/worktrees/wardrobe-factory
bun install
```

All work is done inside that worktree. Run `/land` when complete.

---

## File Map

| Layer | Files Created | Files Modified |
|---|---|---|
| domain | `entities/Accomplishment.ts`, `value-objects/AccomplishmentId.ts` | `entities/Experience.ts`, `value-objects/ContentSelection.ts`, `value-objects/LlmProposal.ts`, `index.ts` |
| application | `use-cases/experience/AddAccomplishment.ts`, `UpdateAccomplishment.ts`, `DeleteAccomplishment.ts`, `dtos/AccomplishmentDto.ts` | `dtos/ExperienceDto.ts`, `dtos/ContentSelectionDto.ts`, `use-cases/experience/ListExperiences.ts`, `use-cases/tailored-resume/CreateTailoredResume.ts`, `use-cases/index.ts` |
| infrastructure | `db/entities/experience/Accomplishment.ts` | `db/entities/experience/Experience.ts`, `db/orm-config.ts`, `db/migrations/Migration_20260411000000_replace_bullets_with_accomplishments.ts`, `repositories/PostgresExperienceRepository.ts`, `services/DatabaseResumeChestQuery.ts`, `services/OpenAiResumeTailoringService.ts`, `DI.ts` |
| api | `routes/experience/AddAccomplishmentRoute.ts`, `UpdateAccomplishmentRoute.ts`, `DeleteAccomplishmentRoute.ts`, `routes/factory/ExtractTextRoute.ts` | `routes/resume/content-selection-schema.ts`, `container.ts`, `index.ts` |
| web | `routes/resume/index.tsx`, `components/wardrobe/ExperienceTab.tsx`, `AccomplishmentEditor.tsx`, `HeadlineTab.tsx`, `SkillsTab.tsx`, `components/factory/FactoryInputStep.tsx`, `FactoryReviewStep.tsx`, `hooks/use-accomplishments.ts`, `hooks/use-factory.ts` | `components/layout/sidebar.tsx`, `lib/query-keys.ts` |

---

## Task 1: AccomplishmentId value object + Accomplishment domain entity

**Files:**
- Create: `domain/src/value-objects/AccomplishmentId.ts`
- Create: `domain/src/entities/Accomplishment.ts`
- Create: `domain/test/entities/Accomplishment.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// domain/test/entities/Accomplishment.test.ts
import { describe, expect, it } from 'bun:test';
import { Accomplishment } from '../src/entities/Accomplishment.js';

describe('Accomplishment', () => {
  it('creates with required fields', () => {
    const a = Accomplishment.create({
      experienceId: 'exp-1',
      title: 'Billing sharding',
      narrative: 'Led the migration of billing engine to hash-based sharding.',
      skillTags: ['distributed-systems', 'performance'],
      ordinal: 0
    });
    expect(a.id.value).toBeString();
    expect(a.title).toBe('Billing sharding');
    expect(a.narrative).toBe('Led the migration of billing engine to hash-based sharding.');
    expect(a.skillTags).toEqual(['distributed-systems', 'performance']);
  });

  it('updates fields', () => {
    const a = Accomplishment.create({
      experienceId: 'exp-1', title: 'Old', narrative: 'Old narrative', skillTags: [], ordinal: 0
    });
    const before = a.updatedAt;
    a.update({ title: 'New', narrative: 'New narrative', skillTags: ['leadership'] });
    expect(a.title).toBe('New');
    expect(a.narrative).toBe('New narrative');
    expect(a.skillTags).toEqual(['leadership']);
    expect(a.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
bun test domain/test/entities/Accomplishment.test.ts
```

Expected: error — module not found.

- [ ] **Step 3: Create AccomplishmentId**

```typescript
// domain/src/value-objects/AccomplishmentId.ts
import { ValueObject } from '../ValueObject.js';

export class AccomplishmentId extends ValueObject<{ value: string }> {
  public constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  public static generate(): AccomplishmentId {
    return new AccomplishmentId(crypto.randomUUID());
  }
}
```

- [ ] **Step 4: Create Accomplishment entity**

```typescript
// domain/src/entities/Accomplishment.ts
import { Entity } from '../Entity.js';
import { AccomplishmentId } from '../value-objects/AccomplishmentId.js';

export type AccomplishmentCreateProps = {
  experienceId: string;
  title: string;
  narrative: string;
  skillTags: string[];
  ordinal: number;
};

export class Accomplishment extends Entity<AccomplishmentId> {
  public readonly experienceId: string;
  public title: string;
  public narrative: string;
  public skillTags: string[];
  public ordinal: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: AccomplishmentId;
    experienceId: string;
    title: string;
    narrative: string;
    skillTags: string[];
    ordinal: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.experienceId = props.experienceId;
    this.title = props.title;
    this.narrative = props.narrative;
    this.skillTags = props.skillTags;
    this.ordinal = props.ordinal;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public update(props: Partial<{ title: string; narrative: string; skillTags: string[]; ordinal: number }>): void {
    if (props.title !== undefined) this.title = props.title;
    if (props.narrative !== undefined) this.narrative = props.narrative;
    if (props.skillTags !== undefined) this.skillTags = props.skillTags;
    if (props.ordinal !== undefined) this.ordinal = props.ordinal;
    this.updatedAt = new Date();
  }

  public static create(props: AccomplishmentCreateProps): Accomplishment {
    const now = new Date();
    return new Accomplishment({
      id: AccomplishmentId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
bun test domain/test/entities/Accomplishment.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add domain/src/value-objects/AccomplishmentId.ts domain/src/entities/Accomplishment.ts domain/test/entities/Accomplishment.test.ts
git commit -m "feat(domain): add Accomplishment entity and AccomplishmentId value object"
```

---

## Task 2: Update Experience entity

**Files:**
- Modify: `domain/src/entities/Experience.ts`
- Modify: `domain/test/entities/Experience.test.ts`

- [ ] **Step 1: Read current Experience test to understand its shape**

```bash
cat domain/test/entities/Experience.test.ts
```

- [ ] **Step 2: Replace Experience.ts — swap bullets for accomplishments**

Full replacement of `domain/src/entities/Experience.ts`:

```typescript
import { AggregateRoot } from '../AggregateRoot.js';
import { ExperienceId } from '../value-objects/ExperienceId.js';
import { Accomplishment } from './Accomplishment.js';

export type ExperienceCreateProps = {
  profileId: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  narrative?: string | null;
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
  public narrative: string | null;
  public ordinal: number;
  public readonly accomplishments: Accomplishment[];
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
    narrative: string | null;
    ordinal: number;
    accomplishments: Accomplishment[];
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
    this.narrative = props.narrative;
    this.ordinal = props.ordinal;
    this.accomplishments = props.accomplishments;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public addAccomplishment(props: {
    title: string;
    narrative: string;
    skillTags: string[];
    ordinal: number;
  }): Accomplishment {
    const accomplishment = Accomplishment.create({ experienceId: this.id.value, ...props });
    this.accomplishments.push(accomplishment);
    this.updatedAt = new Date();
    return accomplishment;
  }

  public removeAccomplishment(accomplishmentId: string): void {
    const index = this.accomplishments.findIndex(a => a.id.value === accomplishmentId);
    if (index === -1) throw new Error(`Accomplishment not found: ${accomplishmentId}`);
    this.accomplishments.splice(index, 1);
    this.updatedAt = new Date();
  }

  public findAccomplishmentOrFail(accomplishmentId: string): Accomplishment {
    const acc = this.accomplishments.find(a => a.id.value === accomplishmentId);
    if (!acc) throw new Error(`Accomplishment not found: ${accomplishmentId}`);
    return acc;
  }

  public static create(props: ExperienceCreateProps): Experience {
    const now = new Date();
    return new Experience({
      id: ExperienceId.generate(),
      ...props,
      narrative: props.narrative ?? null,
      accomplishments: [],
      createdAt: now,
      updatedAt: now
    });
  }
}
```

- [ ] **Step 3: Update Experience.test.ts — replace bullet assertions with accomplishment assertions**

Open `domain/test/entities/Experience.test.ts` and replace all bullet-related test code:
- Any `addBullet` call → `addAccomplishment({ title: 'T', narrative: 'N', skillTags: [], ordinal: 0 })`
- Any `removeBullet` → `removeAccomplishment`
- Any `findBulletOrFail` → `findAccomplishmentOrFail`
- Any `exp.bullets` → `exp.accomplishments`

- [ ] **Step 4: Run domain tests**

```bash
bun test domain/test/entities/Experience.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run all domain tests to check for regressions**

```bash
bun run --cwd domain test
```

Expected: all pass. Fix any Bullet-related import errors.

- [ ] **Step 6: Commit**

```bash
git add domain/src/entities/Experience.ts domain/test/entities/Experience.test.ts
git commit -m "feat(domain): replace bullets with accomplishments in Experience entity"
```

---

## Task 3: Update ContentSelection + LlmProposal value objects

**Files:**
- Modify: `domain/src/value-objects/ContentSelection.ts`
- Modify: `domain/src/value-objects/LlmProposal.ts`

- [ ] **Step 1: Replace ContentSelection.ts**

```typescript
// domain/src/value-objects/ContentSelection.ts
export type ExperienceSelection = {
  experienceId: string;
  accomplishmentIds: string[];
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

- [ ] **Step 2: Replace LlmProposal.ts**

```typescript
// domain/src/value-objects/LlmProposal.ts
import type { GeneratedExperience } from './GeneratedContent.js';

export class LlmProposal {
  public readonly headlineOptions: string[];
  public readonly selectedExperiences: Array<{ experienceId: string; selectedAccomplishmentIds: string[] }>;
  public readonly generatedExperiences: GeneratedExperience[];
  public readonly rankedSkillIds: string[];
  public readonly assessment: string;

  public constructor(props: {
    headlineOptions: string[];
    selectedExperiences: Array<{ experienceId: string; selectedAccomplishmentIds: string[] }>;
    generatedExperiences: GeneratedExperience[];
    rankedSkillIds: string[];
    assessment: string;
  }) {
    this.headlineOptions = props.headlineOptions;
    this.selectedExperiences = props.selectedExperiences;
    this.generatedExperiences = props.generatedExperiences;
    this.rankedSkillIds = props.rankedSkillIds;
    this.assessment = props.assessment;
  }

  public static empty(): LlmProposal {
    return new LlmProposal({
      headlineOptions: [],
      selectedExperiences: [],
      generatedExperiences: [],
      rankedSkillIds: [],
      assessment: ''
    });
  }
}
```

- [ ] **Step 3: Run domain tests**

```bash
bun run --cwd domain test
```

Expected: all pass. Fix any compile errors referencing the old field names.

- [ ] **Step 4: Commit**

```bash
git add domain/src/value-objects/ContentSelection.ts domain/src/value-objects/LlmProposal.ts
git commit -m "feat(domain): rename bulletIds→accomplishmentIds, rankedBulletIds→selectedAccomplishmentIds"
```

---

## Task 4: Domain barrel + DTOs

**Files:**
- Modify: `domain/src/index.ts` — swap Bullet exports for Accomplishment
- Create: `application/src/dtos/AccomplishmentDto.ts`
- Modify: `application/src/dtos/ExperienceDto.ts`
- Modify: `application/src/dtos/ContentSelectionDto.ts`

- [ ] **Step 1: Update domain/src/index.ts**

Find and replace all Bullet-related exports. Remove:
```typescript
export type { BulletCreateProps } from './entities/Bullet.js';
export { Bullet } from './entities/Bullet.js';
```
Add:
```typescript
export type { AccomplishmentCreateProps } from './entities/Accomplishment.js';
export { Accomplishment } from './entities/Accomplishment.js';
export { AccomplishmentId } from './value-objects/AccomplishmentId.js';
```
Also remove the `BulletId`, `BulletStatus` exports if they exist.

- [ ] **Step 2: Create AccomplishmentDto**

```typescript
// application/src/dtos/AccomplishmentDto.ts
export type AccomplishmentDto = {
  id: string;
  title: string;
  narrative: string;
  skillTags: string[];
  ordinal: number;
};
```

- [ ] **Step 3: Update ExperienceDto.ts**

```typescript
// application/src/dtos/ExperienceDto.ts
import type { AccomplishmentDto } from './AccomplishmentDto.js';

export type { AccomplishmentDto };

export type ExperienceDto = {
  id: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  narrative: string | null;
  ordinal: number;
  accomplishments: AccomplishmentDto[];
};
```

- [ ] **Step 4: Update ContentSelectionDto.ts**

```typescript
// application/src/dtos/ContentSelectionDto.ts
export type ContentSelectionDto = {
  experienceSelections: { experienceId: string; accomplishmentIds: string[] }[];
  projectIds: string[];
  educationIds: string[];
  skillCategoryIds: string[];
  skillItemIds: string[];
};
```

- [ ] **Step 5: Update application/src/dtos/index.ts barrel**

Add `AccomplishmentDto` export; remove `BulletDto` export:

```typescript
export type { AccomplishmentDto } from './AccomplishmentDto.js';
```

Remove any line exporting `BulletDto`.

- [ ] **Step 6: Run typecheck to find remaining breakages**

```bash
bun run --cwd domain typecheck
bun run --cwd application typecheck
```

Fix any remaining `BulletDto` or `bullet` references in application layer.

- [ ] **Step 7: Commit**

```bash
git add domain/src/index.ts application/src/dtos/AccomplishmentDto.ts application/src/dtos/ExperienceDto.ts application/src/dtos/ContentSelectionDto.ts application/src/dtos/index.ts
git commit -m "feat(application): AccomplishmentDto, update ExperienceDto and ContentSelectionDto"
```

---

## Task 5: Accomplishment ORM entity + Experience ORM + orm-config

**Files:**
- Create: `infrastructure/src/db/entities/experience/Accomplishment.ts`
- Modify: `infrastructure/src/db/entities/experience/Experience.ts`
- Modify: `infrastructure/src/db/orm-config.ts`

- [ ] **Step 1: Create Accomplishment ORM entity**

```typescript
// infrastructure/src/db/entities/experience/Accomplishment.ts
import { Entity, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { type RefOrEntity, UuidPrimaryKey } from '../../helpers.js';
import { Experience } from './Experience.js';

type AccomplishmentProps = {
  id: string;
  experience: RefOrEntity<Experience>;
  title: string;
  narrative: string;
  skillTags: string[];
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
};

@Entity({ tableName: 'accomplishments' })
export class Accomplishment extends BaseEntity {
  @UuidPrimaryKey({ name: 'id' })
  public readonly id: string;

  @ManyToOne(() => Experience, { lazy: true, name: 'experience_id' })
  public readonly experience: RefOrEntity<Experience>;

  @Property({ name: 'title', type: 'text' })
  public title: string;

  @Property({ name: 'narrative', type: 'text' })
  public narrative: string;

  @Property({ name: 'skill_tags', type: 'json' })
  public skillTags: string[];

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  public constructor(props: AccomplishmentProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.experience = props.experience;
    this.title = props.title;
    this.narrative = props.narrative;
    this.skillTags = props.skillTags;
    this.ordinal = props.ordinal;
  }
}
```

- [ ] **Step 2: Update Experience ORM entity — replace Bullet relation with Accomplishment**

```typescript
// infrastructure/src/db/entities/experience/Experience.ts
import { Collection, type Ref } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { UuidPrimaryKey } from '../../helpers.js';
import { Profile } from '../profile/Profile.js';
import { Accomplishment } from './Accomplishment.js';

type ExperienceProps = {
  id: string;
  profile: Ref<Profile> | Profile;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  narrative: string | null;
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

  @Property({ name: 'narrative', type: 'text', nullable: true })
  public narrative: string | null;

  @Property({ name: 'ordinal', type: 'integer' })
  public ordinal: number;

  @OneToMany(
    () => Accomplishment,
    acc => acc.experience,
    { lazy: true, orderBy: { ordinal: 'ASC' } }
  )
  public readonly accomplishments: Collection<Accomplishment> = new Collection<Accomplishment>(this);

  public constructor(props: ExperienceProps) {
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
    this.narrative = props.narrative;
    this.ordinal = props.ordinal;
  }
}
```

- [ ] **Step 3: Update orm-config.ts — swap OrmBullet for OrmAccomplishment**

In `infrastructure/src/db/orm-config.ts`, replace:
```typescript
import { Bullet as OrmBullet } from './entities/experience/Bullet.js';
```
with:
```typescript
import { Accomplishment as OrmAccomplishment } from './entities/experience/Accomplishment.js';
```

In the `entities` array, replace `OrmBullet` with `OrmAccomplishment`.

- [ ] **Step 4: Run infrastructure typecheck**

```bash
bun run --cwd infrastructure typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add infrastructure/src/db/entities/experience/Accomplishment.ts infrastructure/src/db/entities/experience/Experience.ts infrastructure/src/db/orm-config.ts
git commit -m "feat(infra): Accomplishment ORM entity, update Experience ORM, swap in orm-config"
```

---

## Task 6: Database migration

**Files:**
- Create: `infrastructure/src/db/migrations/Migration_20260411000000_replace_bullets_with_accomplishments.ts`

- [ ] **Step 1: Create migration file**

```typescript
// infrastructure/src/db/migrations/Migration_20260411000000_replace_bullets_with_accomplishments.ts
import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Drop bullet pivot and bullet tables
  await db.schema.dropTable('bullet_tags').execute();
  await db.schema.dropTable('bullets').execute();

  // 2. Create accomplishments table
  await db.schema
    .createTable('accomplishments')
    .addColumn('id', 'uuid', col => col.primaryKey().notNull())
    .addColumn('experience_id', 'uuid', col =>
      col.notNull().references('experiences.id').onDelete('cascade')
    )
    .addColumn('title', 'text', col => col.notNull().defaultTo(''))
    .addColumn('narrative', 'text', col => col.notNull().defaultTo(''))
    .addColumn('skill_tags', sql`jsonb`, col => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('ordinal', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamp(3)', col =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn('updated_at', 'timestamp(3)', col =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  // 3. Migrate tailored_resumes.content_selection: rename bulletIds → accomplishmentIds
  //    Old accomplishmentIds are gone (bullet IDs don't map to anything), so set to [].
  await sql`
    UPDATE tailored_resumes
    SET content_selection = jsonb_set(
      content_selection,
      '{experienceSelections}',
      COALESCE(
        (
          SELECT jsonb_agg(
            (exp - 'bulletIds') || jsonb_build_object('accomplishmentIds', '[]'::jsonb)
          )
          FROM jsonb_array_elements(content_selection->'experienceSelections') AS exp
        ),
        '[]'::jsonb
      )
    )
  `.execute(db);

  // 4. Migrate tailored_resumes.llm_proposals: rename rankedExperiences[].rankedBulletIds
  //    → selectedExperiences[].selectedAccomplishmentIds
  await sql`
    UPDATE tailored_resumes
    SET llm_proposals = llm_proposals
      - 'rankedExperiences'
      || jsonb_build_object(
           'selectedExperiences',
           COALESCE(
             (
               SELECT jsonb_agg(
                 (exp - 'rankedBulletIds') || jsonb_build_object('selectedAccomplishmentIds', '[]'::jsonb)
               )
               FROM jsonb_array_elements(llm_proposals->'rankedExperiences') AS exp
             ),
             '[]'::jsonb
           )
         )
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('accomplishments').execute();

  await db.schema
    .createTable('bullets')
    .addColumn('id', 'uuid', col => col.primaryKey().notNull())
    .addColumn('experience_id', 'uuid', col =>
      col.notNull().references('experiences.id').onDelete('cascade')
    )
    .addColumn('content', 'text', col => col.notNull().defaultTo(''))
    .addColumn('verbose_description', 'text')
    .addColumn('status', 'text', col => col.notNull().defaultTo('active'))
    .addColumn('ordinal', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamp(3)', col =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn('updated_at', 'timestamp(3)', col =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  await db.schema
    .createTable('bullet_tags')
    .addColumn('bullet_id', 'uuid', col =>
      col.notNull().references('bullets.id').onDelete('cascade')
    )
    .addColumn('tag_id', 'uuid', col =>
      col.notNull().references('tags.id').onDelete('cascade')
    )
    .addPrimaryKeyConstraint('bullet_tags_pkey', ['bullet_id', 'tag_id'])
    .execute();
}
```

- [ ] **Step 2: Start dev environment and run migration**

```bash
bun up &   # starts Docker + runs existing migrations
bun run db:migration:up
```

Expected: Migration applied successfully, `accomplishments` table created.

- [ ] **Step 3: Verify schema**

```bash
psql $DATABASE_URL -c "\d accomplishments"
```

Expected: table with id, experience_id, title, narrative, skill_tags, ordinal, created_at, updated_at columns.

- [ ] **Step 4: Commit**

```bash
git add infrastructure/src/db/migrations/Migration_20260411000000_replace_bullets_with_accomplishments.ts
git commit -m "feat(infra): migration — replace bullets table with accomplishments"
```

---

## Task 7: Update PostgresExperienceRepository

**Files:**
- Modify: `infrastructure/src/repositories/PostgresExperienceRepository.ts`

- [ ] **Step 1: Write full replacement**

```typescript
// infrastructure/src/repositories/PostgresExperienceRepository.ts
import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import {
  Accomplishment as DomainAccomplishment,
  AccomplishmentId,
  Experience as DomainExperience,
  ExperienceId,
  type ExperienceRepository
} from '@tailoredin/domain';
import { Accomplishment as OrmAccomplishment } from '../db/entities/experience/Accomplishment.js';
import { Experience as OrmExperience } from '../db/entities/experience/Experience.js';
import { Profile } from '../db/entities/profile/Profile.js';
import { DI } from '../DI.js';

@injectable()
export class PostgresExperienceRepository implements ExperienceRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIdOrFail(id: string): Promise<DomainExperience> {
    const orm = await this.orm.em.findOneOrFail(OrmExperience, id);
    return this.toDomain(orm);
  }

  public async findAll(): Promise<DomainExperience[]> {
    const ormEntities = await this.orm.em.find(OrmExperience, {}, { orderBy: { ordinal: 'ASC' } });
    return Promise.all(ormEntities.map(e => this.toDomain(e)));
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
      existing.narrative = experience.narrative;
      existing.ordinal = experience.ordinal;
      existing.updatedAt = experience.updatedAt;
      this.orm.em.persist(existing);
      await this.syncAccomplishments(experience);
    } else {
      const profile = await this.orm.em.findOneOrFail(Profile, experience.profileId);
      const orm = new OrmExperience({
        id: experience.id.value,
        profile,
        title: experience.title,
        companyName: experience.companyName,
        companyWebsite: experience.companyWebsite,
        location: experience.location,
        startDate: experience.startDate,
        endDate: experience.endDate,
        summary: experience.summary,
        narrative: experience.narrative,
        ordinal: experience.ordinal,
        createdAt: experience.createdAt,
        updatedAt: experience.updatedAt
      });
      this.orm.em.persist(orm);

      for (const acc of experience.accomplishments) {
        await this.persistNewAccomplishment(acc, orm);
      }
    }

    await this.orm.em.flush();
  }

  public async delete(id: string): Promise<void> {
    const orm = await this.orm.em.findOneOrFail(OrmExperience, id);
    this.orm.em.remove(orm);
    await this.orm.em.flush();
  }

  private async syncAccomplishments(domain: DomainExperience): Promise<void> {
    const existing = await this.orm.em.find(OrmAccomplishment, { experience: domain.id.value });
    const domainIds = new Set(domain.accomplishments.map(a => a.id.value));
    const existingIds = new Set(existing.map(a => a.id));

    for (const orm of existing) {
      if (!domainIds.has(orm.id)) {
        this.orm.em.remove(orm);
      }
    }

    for (const acc of domain.accomplishments) {
      if (existingIds.has(acc.id.value)) {
        const ormAcc = existing.find(a => a.id === acc.id.value)!;
        ormAcc.title = acc.title;
        ormAcc.narrative = acc.narrative;
        ormAcc.skillTags = acc.skillTags;
        ormAcc.ordinal = acc.ordinal;
        ormAcc.updatedAt = acc.updatedAt;
        this.orm.em.persist(ormAcc);
      } else {
        const expRef = this.orm.em.getReference(OrmExperience, domain.id.value);
        await this.persistNewAccomplishment(acc, expRef);
      }
    }
  }

  private async persistNewAccomplishment(
    acc: DomainAccomplishment,
    experience: OrmExperience
  ): Promise<void> {
    const ormAcc = new OrmAccomplishment({
      id: acc.id.value,
      experience,
      title: acc.title,
      narrative: acc.narrative,
      skillTags: acc.skillTags,
      ordinal: acc.ordinal,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt
    });
    this.orm.em.persist(ormAcc);
  }

  private async toDomain(orm: OrmExperience): Promise<DomainExperience> {
    const [row] = await this.orm.em
      .getConnection()
      .execute<[{ profile_id: string }]>(
        `SELECT profile_id FROM experiences WHERE id = '${orm.id}'`
      );
    const profileId = row.profile_id;

    const ormAccomplishments = await this.orm.em.find(
      OrmAccomplishment,
      { experience: orm.id },
      { orderBy: { ordinal: 'ASC' } }
    );

    const accomplishments: DomainAccomplishment[] = ormAccomplishments.map(a =>
      new DomainAccomplishment({
        id: new AccomplishmentId(a.id),
        experienceId: orm.id,
        title: a.title,
        narrative: a.narrative,
        skillTags: a.skillTags,
        ordinal: a.ordinal,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      })
    );

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
      narrative: orm.narrative,
      ordinal: orm.ordinal,
      accomplishments,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
```

- [ ] **Step 2: Run infrastructure typecheck**

```bash
bun run --cwd infrastructure typecheck
```

Expected: no errors.

- [ ] **Step 3: Run integration test (if experience-repository test exists)**

```bash
bun run --cwd infrastructure test:integration
```

Expected: all pass. If a test references bullets, update it to use accomplishments.

- [ ] **Step 4: Commit**

```bash
git add infrastructure/src/repositories/PostgresExperienceRepository.ts
git commit -m "feat(infra): rewrite ExperienceRepository — sync accomplishments instead of bullets"
```

---

## Task 8: Update chest query + LLM tailoring service

**Files:**
- Modify: `infrastructure/src/services/DatabaseResumeChestQuery.ts`
- Modify: `infrastructure/src/services/OpenAiResumeTailoringService.ts`

- [ ] **Step 1: Rewrite DatabaseResumeChestQuery**

```typescript
// infrastructure/src/services/DatabaseResumeChestQuery.ts
import { inject, injectable } from '@needle-di/core';
import type { ResumeChestQuery } from '@tailoredin/application';
import type { ExperienceRepository } from '@tailoredin/domain';
import { DI } from '../DI.js';
import { formatDateRange } from '../resume/dateFormatter.js';

/**
 * Builds a rich markdown document of all experiences and their accomplishment narratives
 * for use as LLM input. The LLM reads these narratives and generates resume bullets.
 */
@injectable()
export class DatabaseResumeChestQuery implements ResumeChestQuery {
  public constructor(
    private readonly experienceRepo: ExperienceRepository = inject(DI.Experience.Repository)
  ) {}

  public async makeChestMarkdown(_profileId: string): Promise<string> {
    const allExperiences = await this.experienceRepo.findAll();
    const lines: string[] = [];

    for (const exp of allExperiences) {
      lines.push(`## ${exp.title} @ ${exp.companyName}`);
      lines.push(`*${formatDateRange(exp.startDate, exp.endDate)} | ${exp.location}*`);
      lines.push(`experience_id: ${exp.id.value}`);

      if (exp.narrative) {
        lines.push('');
        lines.push('**Role Narrative:**');
        lines.push(exp.narrative);
      }

      if (exp.accomplishments.length > 0) {
        lines.push('');
        lines.push('**Accomplishments:**');
        for (const acc of exp.accomplishments) {
          lines.push(`### [${acc.id.value}] ${acc.title}`);
          if (acc.skillTags.length > 0) {
            lines.push(`*Tags: ${acc.skillTags.join(', ')}*`);
          }
          lines.push(acc.narrative);
        }
      }

      lines.push('');
    }

    return lines.join('\n');
  }
}
```

- [ ] **Step 2: Update OpenAiResumeTailoringService — new JSON schema + prompt**

```typescript
// infrastructure/src/services/OpenAiResumeTailoringService.ts
import { inject, injectable } from '@needle-di/core';
import type { ResumeTailoringService } from '@tailoredin/application';
import { LlmProposal } from '@tailoredin/domain';
import OpenAI from 'openai';
import { OPENAI_CONFIG, type OpenAiConfig } from './OpenAiLlmService.js';

const TAILOR_JSON_SCHEMA = {
  type: 'object',
  properties: {
    headlineOptions: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 },
    selectedExperiences: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          experienceId: { type: 'string' },
          selectedAccomplishmentIds: { type: 'array', items: { type: 'string' } }
        },
        required: ['experienceId', 'selectedAccomplishmentIds'],
        additionalProperties: false
      }
    },
    generatedExperiences: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          experienceId: { type: 'string' },
          bulletTexts: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 6 }
        },
        required: ['experienceId', 'bulletTexts'],
        additionalProperties: false
      }
    },
    rankedSkillIds: { type: 'array', items: { type: 'string' } },
    assessment: { type: 'string' }
  },
  required: ['headlineOptions', 'selectedExperiences', 'generatedExperiences', 'rankedSkillIds', 'assessment'],
  additionalProperties: false
} as const;

@injectable()
export class OpenAiResumeTailoringService implements ResumeTailoringService {
  private readonly client: OpenAI;

  public constructor(config = inject(OPENAI_CONFIG) as OpenAiConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey, project: config.project });
  }

  public async tailorFromJd(jdContent: string, rawMarkdown: string): Promise<LlmProposal> {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            "You are a professional resume tailoring assistant. You receive a job description and a candidate's resume wardrobe — a collection of experiences, each with accomplishment narratives written in the candidate's own words.\n\nYour task:\n1. Select the most relevant accomplishments for each experience (return their IDs in selectedAccomplishmentIds).\n2. For each experience, write 2–4 concise resume bullet points (starting with an action verb) that directly address the job requirements. Draw from the selected accomplishment narratives — do not copy verbatim, synthesize and quantify.\n3. Suggest 1–3 headline options tailored to the role.\n4. Rank relevant skill IDs.\n5. Provide a brief fit assessment."
        },
        {
          role: 'user',
          content: `## Job Description\n\n${jdContent}\n\n## Resume Wardrobe\n\n${rawMarkdown}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'resume_tailoring',
          strict: true,
          schema: TAILOR_JSON_SCHEMA
        }
      }
    });

    const raw = completion.choices[0].message.content;
    if (!raw) throw new Error('Empty response from OpenAI resume tailoring');

    const parsed = JSON.parse(raw) as {
      headlineOptions: string[];
      selectedExperiences: Array<{ experienceId: string; selectedAccomplishmentIds: string[] }>;
      generatedExperiences: Array<{ experienceId: string; bulletTexts: string[] }>;
      rankedSkillIds: string[];
      assessment: string;
    };

    return new LlmProposal({
      headlineOptions: parsed.headlineOptions,
      selectedExperiences: parsed.selectedExperiences,
      generatedExperiences: parsed.generatedExperiences,
      rankedSkillIds: parsed.rankedSkillIds,
      assessment: parsed.assessment
    });
  }
}
```

- [ ] **Step 3: Run infrastructure typecheck**

```bash
bun run --cwd infrastructure typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add infrastructure/src/services/DatabaseResumeChestQuery.ts infrastructure/src/services/OpenAiResumeTailoringService.ts
git commit -m "feat(infra): update chest query (narratives) and LLM prompt for accomplishment-based tailoring"
```

---

## Task 9: Accomplishment use cases + update ListExperiences

**Files:**
- Create: `application/src/use-cases/experience/AddAccomplishment.ts`
- Create: `application/src/use-cases/experience/UpdateAccomplishment.ts`
- Create: `application/src/use-cases/experience/DeleteAccomplishment.ts`
- Modify: `application/src/use-cases/experience/ListExperiences.ts`
- Modify: `application/src/use-cases/index.ts`

- [ ] **Step 1: Write tests for the three use cases**

```typescript
// application/test/use-cases/experience/AddAccomplishment.test.ts
import { describe, expect, it, mock } from 'bun:test';
import { Experience, ExperienceId } from '@tailoredin/domain';
import { AddAccomplishment } from '../../../src/use-cases/experience/AddAccomplishment.js';

const fakeExperience = Experience.create({
  profileId: 'p1', title: 'Eng', companyName: 'ACME', companyWebsite: null,
  location: 'Remote', startDate: '2020', endDate: '2023', summary: null, ordinal: 0
});

const mockRepo = {
  findByIdOrFail: mock(async () => fakeExperience),
  findAll: mock(async () => []),
  save: mock(async () => {}),
  delete: mock(async () => {})
};

describe('AddAccomplishment', () => {
  it('adds accomplishment and returns dto', async () => {
    const useCase = new AddAccomplishment(mockRepo as any);
    const result = await useCase.execute({
      experienceId: fakeExperience.id.value,
      title: 'Billing sharding',
      narrative: 'Led hash-based sharding project.',
      skillTags: ['performance'],
      ordinal: 0
    });
    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.title).toBe('Billing sharding');
      expect(result.value.skillTags).toEqual(['performance']);
    }
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
bun test application/test/use-cases/experience/AddAccomplishment.test.ts
```

Expected: error — module not found.

- [ ] **Step 3: Create AddAccomplishment.ts**

```typescript
// application/src/use-cases/experience/AddAccomplishment.ts
import { type Experience, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';
import type { AccomplishmentDto } from '../../dtos/AccomplishmentDto.js';

export type AddAccomplishmentInput = {
  experienceId: string;
  title: string;
  narrative: string;
  skillTags: string[];
  ordinal: number;
};

export class AddAccomplishment {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: AddAccomplishmentInput): Promise<Result<AccomplishmentDto, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    const acc = experience.addAccomplishment({
      title: input.title,
      narrative: input.narrative,
      skillTags: input.skillTags,
      ordinal: input.ordinal
    });
    await this.experienceRepository.save(experience);

    return ok({ id: acc.id.value, title: acc.title, narrative: acc.narrative, skillTags: acc.skillTags, ordinal: acc.ordinal });
  }
}
```

- [ ] **Step 4: Create UpdateAccomplishment.ts**

```typescript
// application/src/use-cases/experience/UpdateAccomplishment.ts
import { type Experience, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';

export type UpdateAccomplishmentInput = {
  experienceId: string;
  accomplishmentId: string;
  title?: string;
  narrative?: string;
  skillTags?: string[];
  ordinal?: number;
};

export class UpdateAccomplishment {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: UpdateAccomplishmentInput): Promise<Result<void, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    let acc: ReturnType<Experience['findAccomplishmentOrFail']>;
    try {
      acc = experience.findAccomplishmentOrFail(input.accomplishmentId);
    } catch {
      return err(new Error(`Accomplishment not found: ${input.accomplishmentId}`));
    }

    acc.update({ title: input.title, narrative: input.narrative, skillTags: input.skillTags, ordinal: input.ordinal });
    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
```

- [ ] **Step 5: Create DeleteAccomplishment.ts**

```typescript
// application/src/use-cases/experience/DeleteAccomplishment.ts
import { type Experience, type ExperienceRepository, err, ok, type Result } from '@tailoredin/domain';

export type DeleteAccomplishmentInput = {
  experienceId: string;
  accomplishmentId: string;
};

export class DeleteAccomplishment {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(input: DeleteAccomplishmentInput): Promise<Result<void, Error>> {
    let experience: Experience;
    try {
      experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    } catch {
      return err(new Error(`Experience not found: ${input.experienceId}`));
    }

    try {
      experience.removeAccomplishment(input.accomplishmentId);
    } catch {
      return err(new Error(`Accomplishment not found: ${input.accomplishmentId}`));
    }

    await this.experienceRepository.save(experience);
    return ok(undefined);
  }
}
```

- [ ] **Step 6: Update ListExperiences.ts**

```typescript
// application/src/use-cases/experience/ListExperiences.ts
import type { Accomplishment, Experience, ExperienceRepository } from '@tailoredin/domain';
import type { AccomplishmentDto } from '../../dtos/AccomplishmentDto.js';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';

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
    narrative: exp.narrative,
    ordinal: exp.ordinal,
    accomplishments: exp.accomplishments.map(toAccomplishmentDto)
  };
}

function toAccomplishmentDto(acc: Accomplishment): AccomplishmentDto {
  return {
    id: acc.id.value,
    title: acc.title,
    narrative: acc.narrative,
    skillTags: acc.skillTags,
    ordinal: acc.ordinal
  };
}
```

- [ ] **Step 7: Update application/src/use-cases/index.ts**

Add exports for new use cases; remove AddBullet/UpdateBullet/DeleteBullet exports:

```typescript
// Add these lines:
export type { AddAccomplishmentInput } from './experience/AddAccomplishment.js';
export { AddAccomplishment } from './experience/AddAccomplishment.js';
export type { UpdateAccomplishmentInput } from './experience/UpdateAccomplishment.js';
export { UpdateAccomplishment } from './experience/UpdateAccomplishment.js';
export type { DeleteAccomplishmentInput } from './experience/DeleteAccomplishment.js';
export { DeleteAccomplishment } from './experience/DeleteAccomplishment.js';
```

Remove:
```typescript
export type { AddBulletInput } from './experience/AddBullet.js';
export { AddBullet } from './experience/AddBullet.js';
export type { DeleteBulletInput } from './experience/DeleteBullet.js';
export { DeleteBullet } from './experience/DeleteBullet.js';
export type { UpdateBulletInput } from './experience/UpdateBullet.js';
export { UpdateBullet } from './experience/UpdateBullet.js';
```

- [ ] **Step 8: Run tests**

```bash
bun test application/test/use-cases/experience/AddAccomplishment.test.ts
bun run --cwd application typecheck
```

Expected: AddAccomplishment test passes; typecheck clean.

- [ ] **Step 9: Commit**

```bash
git add application/src/use-cases/experience/AddAccomplishment.ts application/src/use-cases/experience/UpdateAccomplishment.ts application/src/use-cases/experience/DeleteAccomplishment.ts application/src/use-cases/experience/ListExperiences.ts application/src/use-cases/index.ts application/test/use-cases/experience/AddAccomplishment.test.ts
git commit -m "feat(application): AddAccomplishment, UpdateAccomplishment, DeleteAccomplishment use cases"
```

---

## Task 10: Update CreateTailoredResume use case

**Files:**
- Modify: `application/src/use-cases/tailored-resume/CreateTailoredResume.ts`

- [ ] **Step 1: Update CreateTailoredResume to use new LlmProposal fields**

```typescript
// application/src/use-cases/tailored-resume/CreateTailoredResume.ts
import { ContentSelection, GeneratedContent, TailoredResume } from '@tailoredin/domain';
import type { ResumeChestQuery } from '../../ports/ResumeChestQuery.js';
import type { ResumeProfileRepository } from '../../ports/ResumeProfileRepository.js';
import type { ResumeTailoringService } from '../../ports/ResumeTailoringService.js';
import type { TailoredResumeRepository } from '../../ports/TailoredResumeRepository.js';

export type CreateTailoredResumeInput = {
  profileId: string;
  jdContent: string;
};

export class CreateTailoredResume {
  public constructor(
    private readonly resumeProfileRepository: ResumeProfileRepository,
    private readonly tailoredResumeRepository: TailoredResumeRepository,
    private readonly resumeTailoringService: ResumeTailoringService,
    private readonly resumeChestQuery: ResumeChestQuery
  ) {}

  public async execute(input: CreateTailoredResumeInput): Promise<TailoredResume> {
    const profile = await this.resumeProfileRepository.findByProfileId(input.profileId);

    if (!profile) {
      throw new Error(`ResumeProfile not found: ${input.profileId}`);
    }

    const chestMarkdown = await this.resumeChestQuery.makeChestMarkdown(input.profileId);
    const llmProposal = await this.resumeTailoringService.tailorFromJd(input.jdContent, chestMarkdown);

    const generatedContent = new GeneratedContent(
      llmProposal.generatedExperiences.map(exp => ({
        experienceId: exp.experienceId,
        bulletTexts: exp.bulletTexts
      }))
    );

    const contentSelection = new ContentSelection({
      experienceSelections: llmProposal.selectedExperiences.map(exp => ({
        experienceId: exp.experienceId,
        accomplishmentIds: exp.selectedAccomplishmentIds
      })),
      projectIds: [],
      educationIds: profile.contentSelection.educationIds,
      skillCategoryIds: profile.contentSelection.skillCategoryIds,
      skillItemIds: llmProposal.rankedSkillIds
    });

    const headlineText = llmProposal.headlineOptions[0] ?? profile.headlineText;

    const resume = TailoredResume.create({
      profileId: input.profileId,
      jdContent: input.jdContent
    });

    resume.updateProposals(llmProposal);
    resume.replaceContentSelection(contentSelection);
    resume.updateGeneratedContent(generatedContent);
    resume.updateHeadline(headlineText);

    await this.tailoredResumeRepository.save(resume);
    return resume;
  }
}
```

- [ ] **Step 2: Run typecheck**

```bash
bun run --cwd application typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add application/src/use-cases/tailored-resume/CreateTailoredResume.ts
git commit -m "feat(application): update CreateTailoredResume to use selectedAccomplishmentIds"
```

---

## Task 11: Update DI tokens + container

**Files:**
- Modify: `infrastructure/src/DI.ts`
- Modify: `api/src/container.ts`

- [ ] **Step 1: Update DI.ts — swap bullet tokens for accomplishment tokens**

In `infrastructure/src/DI.ts`:

1. In the imports, replace:
```typescript
  AddBullet, DeleteBullet, UpdateBullet,
```
with:
```typescript
  AddAccomplishment, DeleteAccomplishment, UpdateAccomplishment,
```

2. In the `Experience` block, replace:
```typescript
    AddBullet: new InjectionToken<AddBullet>('DI.Experience.AddBullet'),
    UpdateBullet: new InjectionToken<UpdateBullet>('DI.Experience.UpdateBullet'),
    DeleteBullet: new InjectionToken<DeleteBullet>('DI.Experience.DeleteBullet')
```
with:
```typescript
    AddAccomplishment: new InjectionToken<AddAccomplishment>('DI.Experience.AddAccomplishment'),
    UpdateAccomplishment: new InjectionToken<UpdateAccomplishment>('DI.Experience.UpdateAccomplishment'),
    DeleteAccomplishment: new InjectionToken<DeleteAccomplishment>('DI.Experience.DeleteAccomplishment')
```

- [ ] **Step 2: Update container.ts — rewire Experience bindings**

In `api/src/container.ts`:

1. In imports from `@tailoredin/application`, replace `AddBullet, DeleteBullet, UpdateBullet` with `AddAccomplishment, DeleteAccomplishment, UpdateAccomplishment`.

2. Replace the three bullet bindings:
```typescript
// OLD — remove these three
container.bind({ provide: DI.Experience.AddBullet, useFactory: () => new AddBullet(container.get(DI.Experience.Repository)) });
container.bind({ provide: DI.Experience.UpdateBullet, useFactory: () => new UpdateBullet(container.get(DI.Experience.Repository)) });
container.bind({ provide: DI.Experience.DeleteBullet, useFactory: () => new DeleteBullet(container.get(DI.Experience.Repository)) });

// NEW — add these three
container.bind({ provide: DI.Experience.AddAccomplishment, useFactory: () => new AddAccomplishment(container.get(DI.Experience.Repository)) });
container.bind({ provide: DI.Experience.UpdateAccomplishment, useFactory: () => new UpdateAccomplishment(container.get(DI.Experience.Repository)) });
container.bind({ provide: DI.Experience.DeleteAccomplishment, useFactory: () => new DeleteAccomplishment(container.get(DI.Experience.Repository)) });
```

- [ ] **Step 3: Run typecheck across all packages**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add infrastructure/src/DI.ts api/src/container.ts
git commit -m "feat(infra,api): swap bullet DI tokens for accomplishment tokens"
```

---

## Task 12: New API routes for accomplishments

**Files:**
- Create: `api/src/routes/experience/AddAccomplishmentRoute.ts`
- Create: `api/src/routes/experience/UpdateAccomplishmentRoute.ts`
- Create: `api/src/routes/experience/DeleteAccomplishmentRoute.ts`
- Modify: `api/src/routes/resume/content-selection-schema.ts`
- Modify: `api/src/index.ts`

- [ ] **Step 1: Create AddAccomplishmentRoute.ts**

```typescript
// api/src/routes/experience/AddAccomplishmentRoute.ts
import { inject, injectable } from '@needle-di/core';
import type { AddAccomplishment } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class AddAccomplishmentRoute {
  public constructor(
    private readonly addAccomplishment: AddAccomplishment = inject(DI.Experience.AddAccomplishment)
  ) {}

  public plugin() {
    return new Elysia().post(
      '/experiences/:id/accomplishments',
      async ({ params, body, set }) => {
        const result = await this.addAccomplishment.execute({
          experienceId: params.id,
          title: body.title,
          narrative: body.narrative,
          skillTags: body.skill_tags,
          ordinal: body.ordinal
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 201;
        return { data: result.value };
      },
      {
        params: t.Object({ id: t.String({ format: 'uuid' }) }),
        body: t.Object({
          title: t.String({ minLength: 1 }),
          narrative: t.String({ minLength: 1 }),
          skill_tags: t.Array(t.String()),
          ordinal: t.Integer({ minimum: 0 })
        })
      }
    );
  }
}
```

- [ ] **Step 2: Create UpdateAccomplishmentRoute.ts**

```typescript
// api/src/routes/experience/UpdateAccomplishmentRoute.ts
import { inject, injectable } from '@needle-di/core';
import type { UpdateAccomplishment } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class UpdateAccomplishmentRoute {
  public constructor(
    private readonly updateAccomplishment: UpdateAccomplishment = inject(DI.Experience.UpdateAccomplishment)
  ) {}

  public plugin() {
    return new Elysia().put(
      '/experiences/:experienceId/accomplishments/:accomplishmentId',
      async ({ params, body, set }) => {
        const result = await this.updateAccomplishment.execute({
          experienceId: params.experienceId,
          accomplishmentId: params.accomplishmentId,
          title: body.title,
          narrative: body.narrative,
          skillTags: body.skill_tags,
          ordinal: body.ordinal
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        return { data: null };
      },
      {
        params: t.Object({
          experienceId: t.String({ format: 'uuid' }),
          accomplishmentId: t.String({ format: 'uuid' })
        }),
        body: t.Object({
          title: t.Optional(t.String({ minLength: 1 })),
          narrative: t.Optional(t.String({ minLength: 1 })),
          skill_tags: t.Optional(t.Array(t.String())),
          ordinal: t.Optional(t.Integer({ minimum: 0 }))
        })
      }
    );
  }
}
```

- [ ] **Step 3: Create DeleteAccomplishmentRoute.ts**

```typescript
// api/src/routes/experience/DeleteAccomplishmentRoute.ts
import { inject, injectable } from '@needle-di/core';
import type { DeleteAccomplishment } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia, t } from 'elysia';

@injectable()
export class DeleteAccomplishmentRoute {
  public constructor(
    private readonly deleteAccomplishment: DeleteAccomplishment = inject(DI.Experience.DeleteAccomplishment)
  ) {}

  public plugin() {
    return new Elysia().delete(
      '/experiences/:experienceId/accomplishments/:accomplishmentId',
      async ({ params, set }) => {
        const result = await this.deleteAccomplishment.execute({
          experienceId: params.experienceId,
          accomplishmentId: params.accomplishmentId
        });
        if (!result.isOk) {
          set.status = 404;
          return { error: { code: 'NOT_FOUND', message: result.error.message } };
        }
        set.status = 204;
        return null;
      },
      {
        params: t.Object({
          experienceId: t.String({ format: 'uuid' }),
          accomplishmentId: t.String({ format: 'uuid' })
        })
      }
    );
  }
}
```

- [ ] **Step 4: Update content-selection-schema.ts**

```typescript
// api/src/routes/resume/content-selection-schema.ts
import type { ContentSelectionDto } from '@tailoredin/application';
import { t } from 'elysia';

export const contentSelectionSchema = t.Object({
  experience_selections: t.Array(
    t.Object({
      experience_id: t.String({ format: 'uuid' }),
      accomplishment_ids: t.Array(t.String({ format: 'uuid' }))
    })
  ),
  project_ids: t.Array(t.String({ format: 'uuid' })),
  education_ids: t.Array(t.String({ format: 'uuid' })),
  skill_category_ids: t.Array(t.String({ format: 'uuid' })),
  skill_item_ids: t.Array(t.String({ format: 'uuid' }))
});

export function bodyToContentSelectionDto(body: {
  experience_selections: Array<{ experience_id: string; accomplishment_ids: string[] }>;
  project_ids: string[];
  education_ids: string[];
  skill_category_ids: string[];
  skill_item_ids: string[];
}): ContentSelectionDto {
  return {
    experienceSelections: body.experience_selections.map(s => ({
      experienceId: s.experience_id,
      accomplishmentIds: s.accomplishment_ids
    })),
    projectIds: body.project_ids,
    educationIds: body.education_ids,
    skillCategoryIds: body.skill_category_ids,
    skillItemIds: body.skill_item_ids
  };
}
```

- [ ] **Step 5: Update api/src/index.ts — swap bullet routes for accomplishment routes**

In `api/src/index.ts`:

1. Replace the three bullet route imports:
```typescript
// Remove:
import { AddBulletRoute } from './routes/experience/AddBulletRoute.js';
import { DeleteBulletRoute } from './routes/experience/DeleteBulletRoute.js';
import { UpdateBulletRoute } from './routes/experience/UpdateBulletRoute.js';

// Add:
import { AddAccomplishmentRoute } from './routes/experience/AddAccomplishmentRoute.js';
import { UpdateAccomplishmentRoute } from './routes/experience/UpdateAccomplishmentRoute.js';
import { DeleteAccomplishmentRoute } from './routes/experience/DeleteAccomplishmentRoute.js';
```

2. Replace the three `.use(...)` lines:
```typescript
// Remove:
.use(container.get(AddBulletRoute).plugin())
.use(container.get(UpdateBulletRoute).plugin())
.use(container.get(DeleteBulletRoute).plugin())

// Add:
.use(container.get(AddAccomplishmentRoute).plugin())
.use(container.get(UpdateAccomplishmentRoute).plugin())
.use(container.get(DeleteAccomplishmentRoute).plugin())
```

- [ ] **Step 6: Run API typecheck**

```bash
bun run --cwd api typecheck
```

Expected: no errors.

- [ ] **Step 7: Smoke test the API**

```bash
bun run api &
curl -s http://localhost:8000/experiences | jq '.data[0]'
```

Expected: experience object with `accomplishments: []` array (no `bullets` field).

- [ ] **Step 8: Commit**

```bash
git add api/src/routes/experience/AddAccomplishmentRoute.ts api/src/routes/experience/UpdateAccomplishmentRoute.ts api/src/routes/experience/DeleteAccomplishmentRoute.ts api/src/routes/resume/content-selection-schema.ts api/src/index.ts
git commit -m "feat(api): accomplishment routes, update content-selection-schema"
```

---

## Task 13: File upload endpoint (PDF text extraction)

**Files:**
- Create: `api/src/routes/factory/ExtractTextRoute.ts`
- Modify: `api/src/index.ts`

- [ ] **Step 1: Install pdf-parse**

```bash
bun add pdf-parse --cwd api
bun add -d @types/pdf-parse --cwd api
```

- [ ] **Step 2: Create ExtractTextRoute.ts**

```typescript
// api/src/routes/factory/ExtractTextRoute.ts
import { injectable } from '@needle-di/core';
import { Elysia, t } from 'elysia';
import pdfParse from 'pdf-parse';

@injectable()
export class ExtractTextRoute {
  public plugin() {
    return new Elysia().post(
      '/factory/extract-text',
      async ({ body, set }) => {
        const file = body.file as File;
        const buffer = Buffer.from(await file.arrayBuffer());
        const name = file.name.toLowerCase();

        let text: string;
        if (name.endsWith('.pdf')) {
          const result = await pdfParse(buffer);
          text = result.text;
        } else {
          // Plain text fallback for .txt files
          text = buffer.toString('utf-8');
        }

        return { data: { text: text.trim() } };
      },
      {
        body: t.Object({ file: t.File() })
      }
    );
  }
}
```

- [ ] **Step 3: Register route in api/src/index.ts**

Add import:
```typescript
import { ExtractTextRoute } from './routes/factory/ExtractTextRoute.js';
```

Add use after the resume routes section:
```typescript
// Factory
.use(container.get(ExtractTextRoute).plugin())
```

Also add binding in `api/src/container.ts`:
```typescript
container.bind({ provide: ExtractTextRoute, useClass: ExtractTextRoute });
```

- [ ] **Step 4: Run API typecheck**

```bash
bun run --cwd api typecheck
```

Expected: no errors.

- [ ] **Step 5: Test PDF extraction**

```bash
curl -s -F "file=@/path/to/sample.pdf" http://localhost:8000/factory/extract-text | jq '.data.text' | head -c 200
```

Expected: extracted text from the PDF.

- [ ] **Step 6: Commit**

```bash
git add api/src/routes/factory/ExtractTextRoute.ts api/src/index.ts api/src/container.ts
git commit -m "feat(api): add /factory/extract-text endpoint for PDF text extraction"
```

---

## Task 14: Frontend — nav + query keys + hooks

**Files:**
- Modify: `web/src/components/layout/sidebar.tsx`
- Modify: `web/src/lib/query-keys.ts`
- Create: `web/src/hooks/use-accomplishments.ts`
- Create: `web/src/hooks/use-factory.ts`

- [ ] **Step 1: Update sidebar.tsx — remove Jobs, update Resume nav**

```typescript
// web/src/components/layout/sidebar.tsx
import { Link, useMatchRoute } from '@tanstack/react-router';
import { BookOpen, FileText, type LucideIcon, Sparkles, Wand2, Wrench } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

interface NavItem {
  label: string;
  to: string;
  search?: Record<string, unknown>;
  icon: LucideIcon;
}

const resumeNav: NavItem[] = [
  { label: 'Wardrobe', to: '/resume', search: { tab: 'wardrobe' }, icon: BookOpen },
  { label: 'Factory', to: '/resume', search: { tab: 'factory' }, icon: Wand2 },
  { label: 'Skills', to: '/resume/skills', icon: Wrench }
];

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const matchRoute = useMatchRoute();

  function isActive(item: NavItem) {
    if (!item.search) return !!matchRoute({ to: item.to, fuzzy: true });
    return !!matchRoute({ to: item.to, fuzzy: true, search: item.search });
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={`${item.to}-${item.label}`}>
              <SidebarMenuButton render={<Link to={item.to} search={item.search ?? {}} />} isActive={isActive(item)}>
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <Sparkles className="h-5 w-5" />
          <span className="text-lg font-semibold">TailoredIn</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Resume" items={resumeNav} />
      </SidebarContent>
    </Sidebar>
  );
}
```

- [ ] **Step 2: Update query-keys.ts — add accomplishments**

Add to `web/src/lib/query-keys.ts`:
```typescript
  accomplishments: {
    all: ['accomplishments'] as const,
    byExperience: (experienceId: string) => ['accomplishments', 'experience', experienceId] as const
  },
  factory: {
    all: ['factory'] as const,
    tailoredResumes: () => [...queryKeys.factory.all, 'tailored-resumes'] as const
  }
```

- [ ] **Step 3: Create use-accomplishments.ts**

```typescript
// web/src/hooks/use-accomplishments.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useAddAccomplishment(experienceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      narrative: string;
      skill_tags: string[];
      ordinal: number;
    }) => {
      const { data, error } = await api.experiences[experienceId].accomplishments.post(input);
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to add accomplishment');
      return data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    }
  });
}

export function useUpdateAccomplishment(experienceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      accomplishmentId: string;
      title?: string;
      narrative?: string;
      skill_tags?: string[];
      ordinal?: number;
    }) => {
      const { accomplishmentId, ...body } = input;
      const { error } = await api.experiences[experienceId].accomplishments[accomplishmentId].put(body);
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to update accomplishment');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    }
  });
}

export function useDeleteAccomplishment(experienceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accomplishmentId: string) => {
      const { error } = await api.experiences[experienceId].accomplishments[accomplishmentId].delete();
      if (error) throw new Error(error.value?.error?.message ?? 'Failed to delete accomplishment');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    }
  });
}
```

- [ ] **Step 4: Create use-factory.ts**

```typescript
// web/src/hooks/use-factory.ts
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCreateTailoredResumeFromText() {
  return useMutation({
    mutationFn: async (jdContent: string) => {
      const { data, error } = await api.resumes.tailored.post({ jd_content: jdContent });
      if (error) throw new Error('Failed to generate resume');
      return data?.data;
    }
  });
}

export function useExtractTextFromFile() {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/factory/extract-text', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Failed to extract text from file');
      const json = await res.json() as { data: { text: string } };
      return json.data.text;
    }
  });
}
```

- [ ] **Step 5: Run frontend typecheck**

```bash
bun run --cwd web typecheck
```

Fix any type errors. Eden Treaty types regenerate automatically from the API type.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/layout/sidebar.tsx web/src/lib/query-keys.ts web/src/hooks/use-accomplishments.ts web/src/hooks/use-factory.ts
git commit -m "feat(web): update nav (no jobs), add accomplishment + factory hooks"
```

---

## Task 15: /resume/index.tsx route

**Files:**
- Create: `web/src/routes/resume/index.tsx`

- [ ] **Step 1: Create the route file with Wardrobe | Factory tab layout**

```typescript
// web/src/routes/resume/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExperienceTab } from '@/components/wardrobe/ExperienceTab';
import { HeadlineTab } from '@/components/wardrobe/HeadlineTab';
import { SkillsTab } from '@/components/wardrobe/SkillsTab';
import { FactoryInputStep } from '@/components/factory/FactoryInputStep';
import { FactoryReviewStep } from '@/components/factory/FactoryReviewStep';
import { useState } from 'react';

const searchSchema = z.object({
  tab: z.enum(['wardrobe', 'factory']).optional().catch('wardrobe')
});

export const Route = createFileRoute('/resume/')({
  validateSearch: searchSchema.parse,
  component: ResumePage
});

function ResumePage() {
  const { tab } = Route.useSearch();
  const [factoryResumeId, setFactoryResumeId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resume</h1>
        <p className="text-muted-foreground text-sm">Build your wardrobe, then generate tailored resumes.</p>
      </div>

      <Tabs defaultValue={tab ?? 'wardrobe'}>
        <TabsList>
          <TabsTrigger value="wardrobe">Wardrobe</TabsTrigger>
          <TabsTrigger value="factory">Factory</TabsTrigger>
        </TabsList>

        <TabsContent value="wardrobe" className="space-y-4 pt-4">
          <Tabs defaultValue="experience">
            <TabsList>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="headlines">Headlines</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
            </TabsList>
            <TabsContent value="experience" className="pt-4">
              <ExperienceTab />
            </TabsContent>
            <TabsContent value="headlines" className="pt-4">
              <HeadlineTab />
            </TabsContent>
            <TabsContent value="skills" className="pt-4">
              <SkillsTab />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="factory" className="pt-4">
          {factoryResumeId ? (
            <FactoryReviewStep
              resumeId={factoryResumeId}
              onReset={() => setFactoryResumeId(null)}
            />
          ) : (
            <FactoryInputStep onGenerated={setFactoryResumeId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Delete old builder route (or redirect)**

The old `/resume/builder` route is now replaced by `/resume`. Delete the file:

```bash
rm web/src/routes/resume/builder.tsx
```

Or if you want a redirect, replace its content with:
```typescript
// web/src/routes/resume/builder.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route = createFileRoute('/resume/builder')({
  beforeLoad: () => { throw redirect({ to: '/resume', search: { tab: 'factory' } }); }
});
```

- [ ] **Step 3: Commit**

```bash
git add web/src/routes/resume/index.tsx
git commit -m "feat(web): /resume route with Wardrobe | Factory tabs"
```

---

## Task 16: Wardrobe — ExperienceTab + AccomplishmentEditor

**Files:**
- Create: `web/src/components/wardrobe/ExperienceTab.tsx`
- Create: `web/src/components/wardrobe/AccomplishmentEditor.tsx`

- [ ] **Step 1: Create AccomplishmentEditor.tsx**

```typescript
// web/src/components/wardrobe/AccomplishmentEditor.tsx
import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDeleteAccomplishment, useUpdateAccomplishment } from '@/hooks/use-accomplishments';

type Accomplishment = {
  id: string;
  title: string;
  narrative: string;
  skillTags: string[];
  ordinal: number;
};

type Props = {
  experienceId: string;
  accomplishment: Accomplishment;
};

export function AccomplishmentEditor({ experienceId, accomplishment }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(accomplishment.title);
  const [narrative, setNarrative] = useState(accomplishment.narrative);
  const [tagInput, setTagInput] = useState(accomplishment.skillTags.join(', '));

  const update = useUpdateAccomplishment(experienceId);
  const del = useDeleteAccomplishment(experienceId);

  function handleSave() {
    update.mutate(
      {
        accomplishmentId: accomplishment.id,
        title,
        narrative,
        skill_tags: tagInput.split(',').map(t => t.trim()).filter(Boolean)
      },
      { onSuccess: () => setEditing(false) }
    );
  }

  if (editing) {
    return (
      <div className="border border-indigo-300 rounded-lg overflow-hidden">
        <div className="bg-indigo-50 px-3 py-2 border-b border-indigo-200 flex gap-2">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="font-medium text-sm h-7"
            placeholder="Accomplishment title"
          />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="p-3 space-y-2">
          <Textarea
            value={narrative}
            onChange={e => setNarrative(e.target.value)}
            className="text-sm min-h-24 resize-none"
            placeholder="Describe what you did, why, and the outcome in detail..."
          />
          <Input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            className="text-xs h-7"
            placeholder="Skill tags (comma-separated): distributed-systems, performance"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden group">
      <div className="bg-muted/30 px-3 py-2 border-b flex items-center justify-between">
        <span className="font-medium text-sm">{accomplishment.title || 'Untitled'}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {accomplishment.skillTags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(true)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-destructive"
            onClick={() => del.mutate(accomplishment.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="p-3 text-sm text-muted-foreground leading-relaxed">
        {accomplishment.narrative || <span className="italic">No narrative yet. Click edit to add one.</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ExperienceTab.tsx**

```typescript
// web/src/components/wardrobe/ExperienceTab.tsx
import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useExperiences } from '@/hooks/use-experiences';
import { useAddAccomplishment, useUpdateAccomplishment } from '@/hooks/use-accomplishments';
import { AccomplishmentEditor } from './AccomplishmentEditor';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export function ExperienceTab() {
  const { data: experiences = [], isLoading } = useExperiences();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-3">
      {experiences.map(exp => (
        <ExperienceCard
          key={exp.id}
          experience={exp}
          expanded={expandedId === exp.id}
          onToggle={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
        />
      ))}
    </div>
  );
}

type Experience = {
  id: string;
  title: string;
  companyName: string;
  startDate: string;
  endDate: string;
  narrative: string | null;
  accomplishments: Array<{ id: string; title: string; narrative: string; skillTags: string[]; ordinal: number }>;
};

function ExperienceCard({
  experience,
  expanded,
  onToggle
}: {
  experience: Experience;
  expanded: boolean;
  onToggle: () => void;
}) {
  const queryClient = useQueryClient();
  const [narrative, setNarrative] = useState(experience.narrative ?? '');
  const [addingNew, setAddingNew] = useState(false);
  const addAccomplishment = useAddAccomplishment(experience.id);

  async function saveNarrative() {
    await api.experiences[experience.id].put({ narrative });
    queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    toast.success('Narrative saved');
  }

  function handleAddAccomplishment() {
    addAccomplishment.mutate(
      { title: '', narrative: '', skill_tags: [], ordinal: experience.accomplishments.length },
      {
        onSuccess: () => setAddingNew(false),
        onError: () => toast.error('Failed to add accomplishment')
      }
    );
  }

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
        onClick={onToggle}
      >
        <div>
          <span className="font-semibold">{experience.companyName}</span>
          <span className="text-muted-foreground text-sm ml-2">· {experience.title}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span>{experience.accomplishments.length} accomplishments</span>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t pt-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Role Narrative
            </p>
            <Textarea
              value={narrative}
              onChange={e => setNarrative(e.target.value)}
              onBlur={saveNarrative}
              className="text-sm min-h-20 resize-none"
              placeholder="Overall context for this role — scope, team, why it mattered..."
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Accomplishments
            </p>
            <div className="space-y-2">
              {experience.accomplishments.map(acc => (
                <AccomplishmentEditor
                  key={acc.id}
                  experienceId={experience.id}
                  accomplishment={acc}
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={handleAddAccomplishment}
                disabled={addAccomplishment.isPending}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add accomplishment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/wardrobe/ExperienceTab.tsx web/src/components/wardrobe/AccomplishmentEditor.tsx
git commit -m "feat(web): Wardrobe ExperienceTab with accomplishment editor"
```

---

## Task 17: Wardrobe — HeadlineTab + SkillsTab

**Files:**
- Create: `web/src/components/wardrobe/HeadlineTab.tsx`
- Create: `web/src/components/wardrobe/SkillsTab.tsx`

- [ ] **Step 1: Check existing headline components**

```bash
ls web/src/components/resume/
ls web/src/hooks/ | grep headline
ls web/src/hooks/ | grep skill
```

Note which hooks and components already exist for headlines and skills.

- [ ] **Step 2: Create HeadlineTab.tsx — thin wrapper over existing headline UI**

```typescript
// web/src/components/wardrobe/HeadlineTab.tsx
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useHeadlines, useCreateHeadline, useDeleteHeadline, useUpdateHeadline } from '@/hooks/use-headlines';

export function HeadlineTab() {
  const { data: headlines = [], isLoading } = useHeadlines();
  const createHeadline = useCreateHeadline();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');

  function handleAdd() {
    if (!newTitle.trim()) { toast.error('Title is required'); return; }
    createHeadline.mutate(
      { title: newTitle.trim(), body: newBody.trim() },
      {
        onSuccess: () => { setAdding(false); setNewTitle(''); setNewBody(''); },
        onError: () => toast.error('Failed to create headline')
      }
    );
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-3">
      {headlines.map(h => (
        <HeadlineCard key={h.id} headline={h} />
      ))}

      {adding ? (
        <div className="border border-indigo-300 rounded-lg p-3 space-y-2">
          <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Headline title (e.g. Staff Engineer)" className="text-sm" />
          <Textarea value={newBody} onChange={e => setNewBody(e.target.value)} placeholder="1–3 sentence professional summary..." className="text-sm min-h-16 resize-none" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={createHeadline.isPending}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setAdding(true)}>
          <Plus className="h-3 w-3 mr-1" />
          Add headline variant
        </Button>
      )}
    </div>
  );
}

function HeadlineCard({ headline }: { headline: { id: string; title: string; body: string; status?: string } }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(headline.title);
  const [body, setBody] = useState(headline.body ?? '');
  const update = useUpdateHeadline();
  const del = useDeleteHeadline();

  function handleSave() {
    update.mutate({ id: headline.id, title, body }, { onSuccess: () => setEditing(false) });
  }

  if (editing) {
    return (
      <div className="border border-indigo-300 rounded-lg p-3 space-y-2">
        <Input value={title} onChange={e => setTitle(e.target.value)} className="font-medium text-sm" />
        <Textarea value={body} onChange={e => setBody(e.target.value)} className="text-sm min-h-16 resize-none" />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={update.isPending}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 flex items-start justify-between gap-2 group">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{headline.title}</span>
          {headline.status && <Badge variant="outline" className="text-xs">{headline.status}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{headline.body}</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => del.mutate(headline.id)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Check if use-headlines hook and use-skill-categories hook exist**

```bash
ls web/src/hooks/
```

If `use-headlines.ts` doesn't exist, check `web/src/components/resume/builder/` for headline mutation code and extract the patterns needed. If `useHeadlines`, `useCreateHeadline`, `useDeleteHeadline`, `useUpdateHeadline` hooks don't exist, create them following the same pattern as `use-experiences.ts`.

- [ ] **Step 4: Create SkillsTab.tsx — import existing skills component**

```typescript
// web/src/components/wardrobe/SkillsTab.tsx
// The skills UI already exists on /resume/skills. Re-export or inline the same component.
// Check web/src/routes/resume/skills.tsx and extract/reuse its content.
export { default } from '@/routes/resume/skills';

// OR if the skills page is a full route component, just inline the skill categories list:
// import { SkillCategoryList } from '@/components/resume/skills/SkillCategoryList';
// export function SkillsTab() { return <SkillCategoryList />; }
```

Inspect `web/src/routes/resume/skills.tsx` to determine the right approach — reuse its inner component rather than duplicating.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/wardrobe/HeadlineTab.tsx web/src/components/wardrobe/SkillsTab.tsx
git commit -m "feat(web): Wardrobe HeadlineTab and SkillsTab components"
```

---

## Task 18: Factory — FactoryInputStep + FactoryReviewStep

**Files:**
- Create: `web/src/components/factory/FactoryInputStep.tsx`
- Create: `web/src/components/factory/FactoryReviewStep.tsx`

- [ ] **Step 1: Create FactoryInputStep.tsx**

```typescript
// web/src/components/factory/FactoryInputStep.tsx
import { useRef, useState } from 'react';
import { Upload, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTailoredResumeFromText, useExtractTextFromFile } from '@/hooks/use-factory';

type Props = {
  onGenerated: (resumeId: string) => void;
};

export function FactoryInputStep({ onGenerated }: Props) {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extract = useExtractTextFromFile();
  const generate = useCreateTailoredResumeFromText();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    extract.mutate(file, {
      onSuccess: extracted => setText(extracted),
      onError: () => toast.error('Could not extract text from file')
    });
  }

  function handleGenerate() {
    const trimmed = text.trim();
    if (!trimmed) { toast.error('Enter a job description or describe your target role'); return; }
    generate.mutate(trimmed, {
      onSuccess: resume => {
        if (resume?.id) onGenerated(resume.id);
      },
      onError: () => toast.error('Failed to generate resume')
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Generate a tailored resume</h2>
        <p className="text-sm text-muted-foreground">
          Paste a job description, a URL description, or just describe the role you're targeting.
          The factory reads your wardrobe and writes a resume.
        </p>
      </div>

      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste a job description here, or write: 'Focus on my infrastructure and distributed systems work for a senior SRE role at a fintech company.'"
        className="min-h-48 resize-none text-sm"
      />

      <div className="flex items-center gap-3">
        <Button
          onClick={handleGenerate}
          disabled={generate.isPending || !text.trim()}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          {generate.isPending ? (
            <>Generating...</>
          ) : (
            <><Wand2 className="h-4 w-4 mr-2" />Generate Resume</>
          )}
        </Button>

        <span className="text-muted-foreground text-xs">or</span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={extract.isPending}
        >
          <Upload className="h-3 w-3 mr-1" />
          {extract.isPending ? 'Extracting...' : 'Upload JD (PDF)'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create FactoryReviewStep.tsx**

```typescript
// web/src/components/factory/FactoryReviewStep.tsx
import { useState } from 'react';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTailoredResume, useUpdateTailoredResume, useGenerateTailoredResumePdf } from '@/hooks/use-tailored-resume';

type Props = {
  resumeId: string;
  onReset: () => void;
};

export function FactoryReviewStep({ resumeId, onReset }: Props) {
  const { data: resume, isLoading } = useTailoredResume(resumeId);
  const updateResume = useUpdateTailoredResume();
  const generatePdf = useGenerateTailoredResumePdf();
  const [editedBullets, setEditedBullets] = useState<Record<string, string[]>>({});

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading generated resume...</div>;
  if (!resume) return <div className="text-sm text-destructive">Resume not found.</div>;

  const generatedExperiences = resume.generatedContent?.experiences ?? [];
  const assessment = resume.llmProposals?.assessment;

  function getBullets(experienceId: string, original: string[]): string[] {
    return editedBullets[experienceId] ?? original;
  }

  function updateBullet(experienceId: string, index: number, value: string, original: string[]) {
    const current = getBullets(experienceId, original);
    const updated = [...current];
    updated[index] = value;
    setEditedBullets(prev => ({ ...prev, [experienceId]: updated }));
  }

  async function handleDownload() {
    // Save any edits first
    if (Object.keys(editedBullets).length > 0) {
      const updatedContent = {
        ...resume.generatedContent,
        experiences: generatedExperiences.map(exp => ({
          experienceId: exp.experienceId,
          bulletTexts: getBullets(exp.experienceId, exp.bulletTexts)
        }))
      };
      await updateResume.mutateAsync({ id: resumeId, generated_content: updatedContent });
    }

    generatePdf.mutate(resumeId, {
      onSuccess: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      onError: () => toast.error('Failed to generate PDF')
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Review Generated Resume</h2>
          <p className="text-sm text-muted-foreground">Edit bullets inline, then download your PDF.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            <ArrowLeft className="h-3 w-3 mr-1" />
            New Resume
          </Button>
          <Button onClick={handleDownload} disabled={generatePdf.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {generatePdf.isPending ? 'Generating PDF...' : <><Download className="h-4 w-4 mr-1" />Download PDF</>}
          </Button>
        </div>
      </div>

      {resume.headlineText && (
        <div className="border rounded-lg p-3 bg-indigo-50 dark:bg-indigo-950/20">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Headline</p>
          <p className="font-medium">{resume.headlineText}</p>
        </div>
      )}

      {assessment && (
        <div className="border rounded-lg p-3 bg-amber-50 dark:bg-amber-950/20">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Fit Assessment</p>
          <p className="text-sm text-muted-foreground">{assessment}</p>
        </div>
      )}

      {generatedExperiences.map(exp => (
        <div key={exp.experienceId} className="border rounded-lg overflow-hidden">
          <div className="bg-muted/30 px-3 py-2 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Experience · {exp.experienceId.slice(0, 8)}…
            </p>
          </div>
          <div className="p-3 space-y-2">
            {getBullets(exp.experienceId, exp.bulletTexts).map((bullet, i) => (
              <Textarea
                key={i}
                value={bullet}
                onChange={e => updateBullet(exp.experienceId, i, e.target.value, exp.bulletTexts)}
                className="text-sm min-h-0 resize-none"
                rows={2}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Run frontend typecheck**

```bash
bun run --cwd web typecheck
```

Fix any type errors, especially around `useTailoredResume`, `useUpdateTailoredResume`, `useGenerateTailoredResumePdf` hooks. These should exist in `web/src/hooks/use-tailored-resume.ts` — check their signatures.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/factory/FactoryInputStep.tsx web/src/components/factory/FactoryReviewStep.tsx
git commit -m "feat(web): Factory FactoryInputStep + FactoryReviewStep components"
```

---

## Task 19: Integration test for ExperienceRepository

**Files:**
- Create: `infrastructure/test-integration/repositories/experience-accomplishment.test.ts`

- [ ] **Step 1: Write the integration test**

```typescript
// infrastructure/test-integration/repositories/experience-accomplishment.test.ts
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Experience, ExperienceId } from '@tailoredin/domain';
import { PostgresExperienceRepository } from '../../src/repositories/PostgresExperienceRepository.js';
import { TestDatabase } from '../support/TestDatabase.js';

describe('PostgresExperienceRepository — accomplishments', () => {
  const db = new TestDatabase();
  let repo: PostgresExperienceRepository;

  beforeAll(async () => {
    await db.setup();
    repo = new PostgresExperienceRepository(db.orm);
  });

  afterAll(async () => {
    await db.teardown();
  });

  it('persists and retrieves accomplishments', async () => {
    // Create an experience (profileId must reference a real profile — seed one)
    const profileId = await db.seedProfile();
    const exp = Experience.create({
      profileId,
      title: 'Senior Engineer',
      companyName: 'ACME',
      companyWebsite: null,
      location: 'Remote',
      startDate: '2020-01',
      endDate: '2023-01',
      summary: null,
      ordinal: 0
    });

    const acc = exp.addAccomplishment({
      title: 'Billing sharding',
      narrative: 'Led hash-based sharding migration, reducing P99 by 40%.',
      skillTags: ['distributed-systems', 'performance'],
      ordinal: 0
    });

    await repo.save(exp);

    const loaded = await repo.findByIdOrFail(exp.id.value);
    expect(loaded.accomplishments).toHaveLength(1);
    expect(loaded.accomplishments[0].title).toBe('Billing sharding');
    expect(loaded.accomplishments[0].skillTags).toContain('distributed-systems');
  });

  it('deletes accomplishment on save', async () => {
    const profileId = await db.seedProfile();
    const exp = Experience.create({
      profileId, title: 'Eng', companyName: 'Foo', companyWebsite: null,
      location: 'NY', startDate: '2020', endDate: '2022', summary: null, ordinal: 1
    });
    exp.addAccomplishment({ title: 'A', narrative: 'N', skillTags: [], ordinal: 0 });
    await repo.save(exp);

    exp.removeAccomplishment(exp.accomplishments[0].id.value);
    await repo.save(exp);

    const loaded = await repo.findByIdOrFail(exp.id.value);
    expect(loaded.accomplishments).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Check TestDatabase.ts for seedProfile helper**

```bash
cat infrastructure/test-integration/support/TestDatabase.ts
```

If `seedProfile` doesn't exist as a method, add it or use the existing seed mechanism. Check the pattern used by other integration tests to create prerequisite data.

- [ ] **Step 3: Run integration test**

```bash
bun run --cwd infrastructure test:integration
```

Expected: all integration tests pass (60 s timeout).

- [ ] **Step 4: Commit**

```bash
git add infrastructure/test-integration/repositories/experience-accomplishment.test.ts
git commit -m "test(infra): integration test for ExperienceRepository accomplishment persistence"
```

---

## Task 20: Final verification

- [ ] **Step 1: Run all tests**

```bash
bun run test
```

Expected: all pass.

- [ ] **Step 2: Run full typecheck**

```bash
bun run typecheck
```

Expected: zero errors.

- [ ] **Step 3: Run linter**

```bash
bun run check
```

Expected: zero lint/format errors. Run `bun run check:fix` if needed, then commit.

- [ ] **Step 4: Start the full dev environment and manually verify**

```bash
bun up
```

Open `http://localhost:5173`:
1. Sidebar shows only "Resume" group with Wardrobe / Factory / Skills items — no Jobs.
2. Navigate to `/resume` → Wardrobe tab → Experience sub-tab. Expand an experience. Role narrative textarea is visible.
3. Click "+ Add accomplishment". An empty accomplishment card appears. Click edit, fill in title + narrative + skill tags. Save. Reload → data persists.
4. Click Factory tab. Paste a job description. Click "Generate Resume". After ~10 seconds, FactoryReviewStep appears with generated bullets.
5. Edit a bullet inline. Click "Download PDF". PDF downloads successfully.

- [ ] **Step 5: Run E2E tests if available**

```bash
bun run test:e2e
```

Expected: all pass.

- [ ] **Step 6: Push and open PR**

```bash
cd .claude/worktrees/wardrobe-factory
```

Then run `/land` to rebase on main, create PR, wait for CI, and merge.
