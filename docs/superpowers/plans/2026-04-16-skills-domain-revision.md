# Skills Domain Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the skills domain to mirror MIND's ontology with typed entities (9 SkillKind values), a dependency graph, and first-class Concept entities.

**Architecture:** Single `skills` table with STI discriminator (`kind`), true domain subclasses (ProgrammingLanguage, Framework, etc.), new `concepts`/`skill_dependencies`/`concept_dependencies` tables. Categories derived from MIND source file basenames (~36 categories). SkillSyncService rewritten as a 5-phase pipeline.

**Tech Stack:** Bun, MikroORM (decorators + raw SQL migrations), Elysia, React 19 + TanStack Query, needle-di

---

## File Structure

### Domain Layer (new/modified)
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/value-objects/SkillType.ts` (replace with SkillKind)
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/value-objects/SkillKind.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/value-objects/ConceptKind.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Skill.ts` (base class with new fields)
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/ProgrammingLanguage.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/MarkupLanguage.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Framework.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Library.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Database.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Tool.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Service.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Protocol.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/QueryLanguage.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Concept.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/SkillDependency.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/ConceptDependency.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/SkillCategory.ts` (add parentId)
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/ports/ConceptRepository.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/index.ts` (update barrel)

### Infrastructure Layer (new/modified)
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/migrations/Migration_20260416000000_skills_domain_revision.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/skill-sync/SkillSyncService.ts` (full rewrite)
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/skill/PostgresConceptRepository.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/skill/PostgresSkillRepository.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/DI.ts` (add Concept tokens)
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/index.ts` (update barrel)
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/orm-config.ts` (register new entities)

### Application Layer (modified)
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/dtos/SkillDto.ts` (kind instead of type)
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/dtos/SkillCategoryDto.ts` (add parentId)
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/dtos/ConceptDto.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/use-cases/skill/ListConcepts.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/use-cases/index.ts` (update barrel)
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/dtos/index.ts` (update barrel)
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/index.ts` (if needed)

### API Layer (modified)
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/api/src/routes/skill/ListSkillsRoute.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/api/src/routes/skill/SearchSkillsRoute.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/api/src/routes/skill/ListSkillCategoriesRoute.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/api/src/routes/skill/ListConceptsRoute.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/api/src/container.ts` (wire new bindings)
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/api/src/index.ts` (mount new route)

### Web Layer (modified)
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/hooks/use-skills.ts` (kind instead of type)
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/routes/skills/index.tsx`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/components/skills/SkillsContent.tsx`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/components/skills/SkillCategorySidebar.tsx`

### Tests (new/modified)
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/Skill.test.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/ProgrammingLanguage.test.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/Concept.test.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/SkillCategory.test.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/SkillDependency.test.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/ConceptDependency.test.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/test/use-cases/skill/SearchSkills.test.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/test-integration/skill-sync/skill-sync.test.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/test-integration/skill/PostgresSkillRepository.test.ts`

---

## Task 1: SkillKind and ConceptKind Enums

**Files:**
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/value-objects/SkillKind.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/value-objects/ConceptKind.ts`
- Delete: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/value-objects/SkillType.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/index.ts`

- [ ] **Step 1: Create SkillKind enum**

```typescript
// domain/src/value-objects/SkillKind.ts
export enum SkillKind {
  PROGRAMMING_LANGUAGE = 'programming_language',
  MARKUP_LANGUAGE = 'markup_language',
  FRAMEWORK = 'framework',
  LIBRARY = 'library',
  DATABASE = 'database',
  TOOL = 'tool',
  SERVICE = 'service',
  PROTOCOL = 'protocol',
  QUERY_LANGUAGE = 'query_language'
}
```

- [ ] **Step 2: Create ConceptKind enum**

```typescript
// domain/src/value-objects/ConceptKind.ts
export enum ConceptKind {
  ARCHITECTURAL_PATTERN = 'architectural_pattern',
  APPLICATION_TASK = 'application_task',
  APPLICATION_DOMAIN = 'application_domain',
  CONCEPTUAL_ASPECT = 'conceptual_aspect',
  TECHNICAL_DOMAIN = 'technical_domain',
  VERTICAL_DOMAIN = 'vertical_domain',
  DEPLOYMENT_TYPE = 'deployment_type'
}
```

- [ ] **Step 3: Delete SkillType.ts**

Remove `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/value-objects/SkillType.ts`.

- [ ] **Step 4: Update domain barrel**

In `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/index.ts`:
- Remove the `SkillType` export line
- Add:
```typescript
export { SkillKind } from './value-objects/SkillKind.js';
export { ConceptKind } from './value-objects/ConceptKind.js';
```

- [ ] **Step 5: Commit**

```bash
git add domain/src/value-objects/SkillKind.ts domain/src/value-objects/ConceptKind.ts domain/src/index.ts
git rm domain/src/value-objects/SkillType.ts
git commit -m "feat(domain): replace SkillType with SkillKind (9 values), add ConceptKind (7 values)"
```

---

## Task 2: Revise Skill Base Entity

**Files:**
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Skill.ts`
- Test: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/Skill.test.ts`

- [ ] **Step 1: Write the failing tests**

Replace the contents of `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/Skill.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import { Skill } from '../../src/entities/Skill.js';
import { SkillKind } from '../../src/value-objects/SkillKind.js';

describe('Skill', () => {
  test('creates with required fields and new kind-based metadata', () => {
    const skill = Skill.create({
      label: 'TypeScript',
      kind: SkillKind.PROGRAMMING_LANGUAGE,
      categoryId: null,
      description: null,
      aliases: [],
      technicalDomains: ['backend', 'frontend'],
      conceptualAspects: ['Object-Oriented'],
      architecturalPatterns: [],
      mindName: 'TypeScript'
    });
    expect(skill.id).toBeString();
    expect(skill.label).toBe('TypeScript');
    expect(skill.normalizedLabel).toBe('typescript');
    expect(skill.kind).toBe(SkillKind.PROGRAMMING_LANGUAGE);
    expect(skill.categoryId).toBeNull();
    expect(skill.description).toBeNull();
    expect(skill.aliases).toEqual([]);
    expect(skill.technicalDomains).toEqual(['backend', 'frontend']);
    expect(skill.conceptualAspects).toEqual(['Object-Oriented']);
    expect(skill.architecturalPatterns).toEqual([]);
    expect(skill.mindName).toBe('TypeScript');
  });

  test('derives normalizedLabel from label', () => {
    const skill = Skill.create({
      label: 'Node.js',
      kind: SkillKind.TOOL,
      categoryId: null,
      description: null,
      aliases: [],
      technicalDomains: [],
      conceptualAspects: [],
      architecturalPatterns: [],
      mindName: null
    });
    expect(skill.normalizedLabel).toBe('node-js');
  });

  test('creates with aliases', () => {
    const aliases = [
      { label: 'Golang', normalizedLabel: 'golang' },
      { label: 'Go language', normalizedLabel: 'go-language' }
    ];
    const skill = Skill.create({
      label: 'Go',
      kind: SkillKind.PROGRAMMING_LANGUAGE,
      categoryId: 'cat-1',
      description: 'A programming language by Google',
      aliases,
      technicalDomains: [],
      conceptualAspects: [],
      architecturalPatterns: [],
      mindName: 'Go'
    });
    expect(skill.aliases).toEqual(aliases);
    expect(skill.categoryId).toBe('cat-1');
    expect(skill.description).toBe('A programming language by Google');
  });

  test('throws when label is empty', () => {
    expect(() =>
      Skill.create({
        label: '',
        kind: SkillKind.PROGRAMMING_LANGUAGE,
        categoryId: null,
        description: null,
        aliases: [],
        technicalDomains: [],
        conceptualAspects: [],
        architecturalPatterns: [],
        mindName: null
      })
    ).toThrow('label');
  });

  test('throws when label exceeds 500 chars', () => {
    expect(() =>
      Skill.create({
        label: 'a'.repeat(501),
        kind: SkillKind.PROGRAMMING_LANGUAGE,
        categoryId: null,
        description: null,
        aliases: [],
        technicalDomains: [],
        conceptualAspects: [],
        architecturalPatterns: [],
        mindName: null
      })
    ).toThrow('label');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test domain/test/entities/Skill.test.ts`
Expected: FAIL — `Skill.create` does not accept `kind`, `technicalDomains`, etc.

- [ ] **Step 3: Rewrite Skill entity**

Replace `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Skill.ts`:

```typescript
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { normalizeLabel } from '@tailoredin/core';
import { AggregateRoot } from '../AggregateRoot.js';
import { ValidationError } from '../ValidationError.js';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import type { SkillKind } from '../value-objects/SkillKind.js';

export type SkillCreateProps = {
  label: string;
  kind: SkillKind;
  categoryId: string | null;
  description: string | null;
  aliases: SkillAlias[];
  technicalDomains: string[];
  conceptualAspects: string[];
  architecturalPatterns: string[];
  mindName: string | null;
};

@Entity({ tableName: 'skills', discriminatorColumn: 'kind' })
export class Skill extends AggregateRoot {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'label', type: 'text' })
  public label: string;

  @Property({ fieldName: 'normalized_label', type: 'text', unique: true })
  public normalizedLabel: string;

  @Property({ fieldName: 'kind', type: 'text' })
  public kind: SkillKind;

  @Property({ fieldName: 'category_id', type: 'uuid', nullable: true })
  public categoryId: string | null;

  @Property({ fieldName: 'description', type: 'text', nullable: true })
  public description: string | null;

  @Property({ fieldName: 'aliases', type: 'jsonb' })
  public aliases: SkillAlias[];

  @Property({ fieldName: 'technical_domains', type: 'jsonb' })
  public technicalDomains: string[];

  @Property({ fieldName: 'conceptual_aspects', type: 'jsonb' })
  public conceptualAspects: string[];

  @Property({ fieldName: 'architectural_patterns', type: 'jsonb' })
  public architecturalPatterns: string[];

  @Property({ fieldName: 'mind_name', type: 'text', nullable: true })
  public mindName: string | null;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: string;
    label: string;
    normalizedLabel: string;
    kind: SkillKind;
    categoryId: string | null;
    description: string | null;
    aliases: SkillAlias[];
    technicalDomains: string[];
    conceptualAspects: string[];
    architecturalPatterns: string[];
    mindName: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    if (!props.label || props.label.length > 500)
      throw new ValidationError('label', 'must be between 1 and 500 characters');
    this.id = props.id;
    this.label = props.label;
    this.normalizedLabel = props.normalizedLabel;
    this.kind = props.kind;
    this.categoryId = props.categoryId;
    this.description = props.description;
    this.aliases = props.aliases;
    this.technicalDomains = props.technicalDomains;
    this.conceptualAspects = props.conceptualAspects;
    this.architecturalPatterns = props.architecturalPatterns;
    this.mindName = props.mindName;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: SkillCreateProps): Skill {
    const now = new Date();
    return new Skill({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: props.kind,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      technicalDomains: props.technicalDomains,
      conceptualAspects: props.conceptualAspects,
      architecturalPatterns: props.architecturalPatterns,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test domain/test/entities/Skill.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add domain/src/entities/Skill.ts domain/test/entities/Skill.test.ts
git commit -m "feat(domain): revise Skill entity with kind, metadata fields, mindName"
```

---

## Task 3: Skill Subclasses (STI)

**Files:**
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/ProgrammingLanguage.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/MarkupLanguage.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Framework.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Library.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Database.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Tool.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Service.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Protocol.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/QueryLanguage.ts`
- Test: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/ProgrammingLanguage.test.ts`

- [ ] **Step 1: Write failing test for ProgrammingLanguage (representative subclass)**

Create `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/ProgrammingLanguage.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test';
import { ProgrammingLanguage } from '../../src/entities/ProgrammingLanguage.js';
import { SkillKind } from '../../src/value-objects/SkillKind.js';

describe('ProgrammingLanguage', () => {
  test('creates with programming-language-specific fields', () => {
    const pl = ProgrammingLanguage.create({
      label: 'Java',
      categoryId: null,
      description: null,
      aliases: [],
      technicalDomains: ['backend'],
      conceptualAspects: ['Object-Oriented'],
      architecturalPatterns: [],
      mindName: 'Java',
      runtimeEnvironments: ['JVM', 'GraalVM'],
      buildTools: ['Maven', 'Gradle'],
      paradigms: ['Object-Oriented', 'Imperative']
    });
    expect(pl.kind).toBe(SkillKind.PROGRAMMING_LANGUAGE);
    expect(pl.runtimeEnvironments).toEqual(['JVM', 'GraalVM']);
    expect(pl.buildTools).toEqual(['Maven', 'Gradle']);
    expect(pl.paradigms).toEqual(['Object-Oriented', 'Imperative']);
  });

  test('defaults kind-specific arrays to empty', () => {
    const pl = ProgrammingLanguage.create({
      label: 'Rust',
      categoryId: null,
      description: null,
      aliases: [],
      technicalDomains: [],
      conceptualAspects: [],
      architecturalPatterns: [],
      mindName: null,
      runtimeEnvironments: [],
      buildTools: [],
      paradigms: []
    });
    expect(pl.runtimeEnvironments).toEqual([]);
    expect(pl.buildTools).toEqual([]);
    expect(pl.paradigms).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test domain/test/entities/ProgrammingLanguage.test.ts`
Expected: FAIL — ProgrammingLanguage does not exist

- [ ] **Step 3: Create ProgrammingLanguage subclass**

Create `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/ProgrammingLanguage.ts`:

```typescript
import { Entity, Property } from '@mikro-orm/decorators/es';
import { normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import { SkillKind } from '../value-objects/SkillKind.js';
import { Skill } from './Skill.js';

export type ProgrammingLanguageCreateProps = {
  label: string;
  categoryId: string | null;
  description: string | null;
  aliases: SkillAlias[];
  technicalDomains: string[];
  conceptualAspects: string[];
  architecturalPatterns: string[];
  mindName: string | null;
  runtimeEnvironments: string[];
  buildTools: string[];
  paradigms: string[];
};

@Entity({ discriminatorValue: SkillKind.PROGRAMMING_LANGUAGE })
export class ProgrammingLanguage extends Skill {
  @Property({ fieldName: 'runtime_environments', type: 'jsonb', nullable: true })
  public runtimeEnvironments: string[];

  @Property({ fieldName: 'build_tools', type: 'jsonb', nullable: true })
  public buildTools: string[];

  @Property({ fieldName: 'paradigms', type: 'jsonb', nullable: true })
  public paradigms: string[];

  public constructor(props: ConstructorParameters<typeof Skill>[0] & {
    runtimeEnvironments: string[];
    buildTools: string[];
    paradigms: string[];
  }) {
    super(props);
    this.runtimeEnvironments = props.runtimeEnvironments;
    this.buildTools = props.buildTools;
    this.paradigms = props.paradigms;
  }

  public static override create(props: ProgrammingLanguageCreateProps): ProgrammingLanguage {
    const now = new Date();
    return new ProgrammingLanguage({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: SkillKind.PROGRAMMING_LANGUAGE,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      technicalDomains: props.technicalDomains,
      conceptualAspects: props.conceptualAspects,
      architecturalPatterns: props.architecturalPatterns,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now,
      runtimeEnvironments: props.runtimeEnvironments,
      buildTools: props.buildTools,
      paradigms: props.paradigms
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test domain/test/entities/ProgrammingLanguage.test.ts`
Expected: PASS

- [ ] **Step 5: Create remaining 8 subclasses**

Each follows the same pattern. Here is the complete code for each:

**MarkupLanguage** — `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/MarkupLanguage.ts`:
```typescript
import { Entity } from '@mikro-orm/decorators/es';
import { normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import { SkillKind } from '../value-objects/SkillKind.js';
import { Skill, type SkillCreateProps } from './Skill.js';

@Entity({ discriminatorValue: SkillKind.MARKUP_LANGUAGE })
export class MarkupLanguage extends Skill {
  public static override create(props: Omit<SkillCreateProps, 'kind'>): MarkupLanguage {
    const now = new Date();
    return new MarkupLanguage({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: SkillKind.MARKUP_LANGUAGE,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      technicalDomains: props.technicalDomains,
      conceptualAspects: props.conceptualAspects,
      architecturalPatterns: props.architecturalPatterns,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now
    });
  }
}
```

**Framework** — `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Framework.ts`:
```typescript
import { Entity, Property } from '@mikro-orm/decorators/es';
import { normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import { SkillKind } from '../value-objects/SkillKind.js';
import { Skill } from './Skill.js';

export type FrameworkCreateProps = {
  label: string;
  categoryId: string | null;
  description: string | null;
  aliases: SkillAlias[];
  technicalDomains: string[];
  conceptualAspects: string[];
  architecturalPatterns: string[];
  mindName: string | null;
  supportedLanguages: string[];
  solvesApplicationTasks: string[];
  associatedApplicationDomains: string[];
};

@Entity({ discriminatorValue: SkillKind.FRAMEWORK })
export class Framework extends Skill {
  @Property({ fieldName: 'supported_languages', type: 'jsonb', nullable: true })
  public supportedLanguages: string[];

  @Property({ fieldName: 'solves_application_tasks', type: 'jsonb', nullable: true })
  public solvesApplicationTasks: string[];

  @Property({ fieldName: 'associated_application_domains', type: 'jsonb', nullable: true })
  public associatedApplicationDomains: string[];

  public constructor(props: ConstructorParameters<typeof Skill>[0] & {
    supportedLanguages: string[];
    solvesApplicationTasks: string[];
    associatedApplicationDomains: string[];
  }) {
    super(props);
    this.supportedLanguages = props.supportedLanguages;
    this.solvesApplicationTasks = props.solvesApplicationTasks;
    this.associatedApplicationDomains = props.associatedApplicationDomains;
  }

  public static override create(props: FrameworkCreateProps): Framework {
    const now = new Date();
    return new Framework({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: SkillKind.FRAMEWORK,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      technicalDomains: props.technicalDomains,
      conceptualAspects: props.conceptualAspects,
      architecturalPatterns: props.architecturalPatterns,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now,
      supportedLanguages: props.supportedLanguages,
      solvesApplicationTasks: props.solvesApplicationTasks,
      associatedApplicationDomains: props.associatedApplicationDomains
    });
  }
}
```

**Library** — `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Library.ts`:
```typescript
import { Entity, Property } from '@mikro-orm/decorators/es';
import { normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import { SkillKind } from '../value-objects/SkillKind.js';
import { Skill } from './Skill.js';

export type LibraryCreateProps = {
  label: string;
  categoryId: string | null;
  description: string | null;
  aliases: SkillAlias[];
  technicalDomains: string[];
  conceptualAspects: string[];
  architecturalPatterns: string[];
  mindName: string | null;
  supportedLanguages: string[];
  specificToFrameworks: string[];
  adapterForToolOrService: string[];
  implementsPatterns: string[];
  solvesApplicationTasks: string[];
  associatedApplicationDomains: string[];
};

@Entity({ discriminatorValue: SkillKind.LIBRARY })
export class Library extends Skill {
  @Property({ fieldName: 'supported_languages', type: 'jsonb', nullable: true })
  public supportedLanguages: string[];

  @Property({ fieldName: 'specific_to_frameworks', type: 'jsonb', nullable: true })
  public specificToFrameworks: string[];

  @Property({ fieldName: 'adapter_for_tool_or_service', type: 'jsonb', nullable: true })
  public adapterForToolOrService: string[];

  @Property({ fieldName: 'implements_patterns', type: 'jsonb', nullable: true })
  public implementsPatterns: string[];

  @Property({ fieldName: 'solves_application_tasks', type: 'jsonb', nullable: true })
  public solvesApplicationTasks: string[];

  @Property({ fieldName: 'associated_application_domains', type: 'jsonb', nullable: true })
  public associatedApplicationDomains: string[];

  public constructor(props: ConstructorParameters<typeof Skill>[0] & {
    supportedLanguages: string[];
    specificToFrameworks: string[];
    adapterForToolOrService: string[];
    implementsPatterns: string[];
    solvesApplicationTasks: string[];
    associatedApplicationDomains: string[];
  }) {
    super(props);
    this.supportedLanguages = props.supportedLanguages;
    this.specificToFrameworks = props.specificToFrameworks;
    this.adapterForToolOrService = props.adapterForToolOrService;
    this.implementsPatterns = props.implementsPatterns;
    this.solvesApplicationTasks = props.solvesApplicationTasks;
    this.associatedApplicationDomains = props.associatedApplicationDomains;
  }

  public static override create(props: LibraryCreateProps): Library {
    const now = new Date();
    return new Library({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: SkillKind.LIBRARY,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      technicalDomains: props.technicalDomains,
      conceptualAspects: props.conceptualAspects,
      architecturalPatterns: props.architecturalPatterns,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now,
      supportedLanguages: props.supportedLanguages,
      specificToFrameworks: props.specificToFrameworks,
      adapterForToolOrService: props.adapterForToolOrService,
      implementsPatterns: props.implementsPatterns,
      solvesApplicationTasks: props.solvesApplicationTasks,
      associatedApplicationDomains: props.associatedApplicationDomains
    });
  }
}
```

**Database** — `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Database.ts`:
```typescript
import { Entity, Property } from '@mikro-orm/decorators/es';
import { normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import { SkillKind } from '../value-objects/SkillKind.js';
import { Skill } from './Skill.js';

export type DatabaseCreateProps = {
  label: string;
  categoryId: string | null;
  description: string | null;
  aliases: SkillAlias[];
  technicalDomains: string[];
  conceptualAspects: string[];
  architecturalPatterns: string[];
  mindName: string | null;
  solvesApplicationTasks: string[];
  associatedApplicationDomains: string[];
};

@Entity({ discriminatorValue: SkillKind.DATABASE })
export class Database extends Skill {
  @Property({ fieldName: 'solves_application_tasks', type: 'jsonb', nullable: true })
  public solvesApplicationTasks: string[];

  @Property({ fieldName: 'associated_application_domains', type: 'jsonb', nullable: true })
  public associatedApplicationDomains: string[];

  public constructor(props: ConstructorParameters<typeof Skill>[0] & {
    solvesApplicationTasks: string[];
    associatedApplicationDomains: string[];
  }) {
    super(props);
    this.solvesApplicationTasks = props.solvesApplicationTasks;
    this.associatedApplicationDomains = props.associatedApplicationDomains;
  }

  public static override create(props: DatabaseCreateProps): Database {
    const now = new Date();
    return new Database({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: SkillKind.DATABASE,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      technicalDomains: props.technicalDomains,
      conceptualAspects: props.conceptualAspects,
      architecturalPatterns: props.architecturalPatterns,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now,
      solvesApplicationTasks: props.solvesApplicationTasks,
      associatedApplicationDomains: props.associatedApplicationDomains
    });
  }
}
```

**Tool** — `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Tool.ts`:
```typescript
import { Entity, Property } from '@mikro-orm/decorators/es';
import { normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import { SkillKind } from '../value-objects/SkillKind.js';
import { Skill } from './Skill.js';

export type ToolCreateProps = {
  label: string;
  categoryId: string | null;
  description: string | null;
  aliases: SkillAlias[];
  technicalDomains: string[];
  conceptualAspects: string[];
  architecturalPatterns: string[];
  mindName: string | null;
  deploymentTypes: string[];
  solvesApplicationTasks: string[];
  associatedApplicationDomains: string[];
};

@Entity({ discriminatorValue: SkillKind.TOOL })
export class Tool extends Skill {
  @Property({ fieldName: 'deployment_types', type: 'jsonb', nullable: true })
  public deploymentTypes: string[];

  @Property({ fieldName: 'solves_application_tasks', type: 'jsonb', nullable: true })
  public solvesApplicationTasks: string[];

  @Property({ fieldName: 'associated_application_domains', type: 'jsonb', nullable: true })
  public associatedApplicationDomains: string[];

  public constructor(props: ConstructorParameters<typeof Skill>[0] & {
    deploymentTypes: string[];
    solvesApplicationTasks: string[];
    associatedApplicationDomains: string[];
  }) {
    super(props);
    this.deploymentTypes = props.deploymentTypes;
    this.solvesApplicationTasks = props.solvesApplicationTasks;
    this.associatedApplicationDomains = props.associatedApplicationDomains;
  }

  public static override create(props: ToolCreateProps): Tool {
    const now = new Date();
    return new Tool({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: SkillKind.TOOL,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      technicalDomains: props.technicalDomains,
      conceptualAspects: props.conceptualAspects,
      architecturalPatterns: props.architecturalPatterns,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now,
      deploymentTypes: props.deploymentTypes,
      solvesApplicationTasks: props.solvesApplicationTasks,
      associatedApplicationDomains: props.associatedApplicationDomains
    });
  }
}
```

**Service** — `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Service.ts`:
```typescript
import { Entity, Property } from '@mikro-orm/decorators/es';
import { normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import { SkillKind } from '../value-objects/SkillKind.js';
import { Skill } from './Skill.js';

export type ServiceCreateProps = {
  label: string;
  categoryId: string | null;
  description: string | null;
  aliases: SkillAlias[];
  technicalDomains: string[];
  conceptualAspects: string[];
  architecturalPatterns: string[];
  mindName: string | null;
  deploymentTypes: string[];
  groups: string[];
  solvesApplicationTasks: string[];
  associatedApplicationDomains: string[];
};

@Entity({ discriminatorValue: SkillKind.SERVICE })
export class Service extends Skill {
  @Property({ fieldName: 'deployment_types', type: 'jsonb', nullable: true })
  public deploymentTypes: string[];

  @Property({ fieldName: 'groups', type: 'jsonb', nullable: true })
  public groups: string[];

  @Property({ fieldName: 'solves_application_tasks', type: 'jsonb', nullable: true })
  public solvesApplicationTasks: string[];

  @Property({ fieldName: 'associated_application_domains', type: 'jsonb', nullable: true })
  public associatedApplicationDomains: string[];

  public constructor(props: ConstructorParameters<typeof Skill>[0] & {
    deploymentTypes: string[];
    groups: string[];
    solvesApplicationTasks: string[];
    associatedApplicationDomains: string[];
  }) {
    super(props);
    this.deploymentTypes = props.deploymentTypes;
    this.groups = props.groups;
    this.solvesApplicationTasks = props.solvesApplicationTasks;
    this.associatedApplicationDomains = props.associatedApplicationDomains;
  }

  public static override create(props: ServiceCreateProps): Service {
    const now = new Date();
    return new Service({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: SkillKind.SERVICE,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      technicalDomains: props.technicalDomains,
      conceptualAspects: props.conceptualAspects,
      architecturalPatterns: props.architecturalPatterns,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now,
      deploymentTypes: props.deploymentTypes,
      groups: props.groups,
      solvesApplicationTasks: props.solvesApplicationTasks,
      associatedApplicationDomains: props.associatedApplicationDomains
    });
  }
}
```

**Protocol** — `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Protocol.ts`:
```typescript
import { Entity, Property } from '@mikro-orm/decorators/es';
import { normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import { SkillKind } from '../value-objects/SkillKind.js';
import { Skill } from './Skill.js';

export type ProtocolCreateProps = {
  label: string;
  categoryId: string | null;
  description: string | null;
  aliases: SkillAlias[];
  technicalDomains: string[];
  conceptualAspects: string[];
  architecturalPatterns: string[];
  mindName: string | null;
  solvesApplicationTasks: string[];
  associatedApplicationDomains: string[];
};

@Entity({ discriminatorValue: SkillKind.PROTOCOL })
export class Protocol extends Skill {
  @Property({ fieldName: 'solves_application_tasks', type: 'jsonb', nullable: true })
  public solvesApplicationTasks: string[];

  @Property({ fieldName: 'associated_application_domains', type: 'jsonb', nullable: true })
  public associatedApplicationDomains: string[];

  public constructor(props: ConstructorParameters<typeof Skill>[0] & {
    solvesApplicationTasks: string[];
    associatedApplicationDomains: string[];
  }) {
    super(props);
    this.solvesApplicationTasks = props.solvesApplicationTasks;
    this.associatedApplicationDomains = props.associatedApplicationDomains;
  }

  public static override create(props: ProtocolCreateProps): Protocol {
    const now = new Date();
    return new Protocol({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: SkillKind.PROTOCOL,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      technicalDomains: props.technicalDomains,
      conceptualAspects: props.conceptualAspects,
      architecturalPatterns: props.architecturalPatterns,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now,
      solvesApplicationTasks: props.solvesApplicationTasks,
      associatedApplicationDomains: props.associatedApplicationDomains
    });
  }
}
```

**QueryLanguage** — `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/QueryLanguage.ts`:
```typescript
import { Entity } from '@mikro-orm/decorators/es';
import { normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '../value-objects/SkillAlias.js';
import { SkillKind } from '../value-objects/SkillKind.js';
import { Skill, type SkillCreateProps } from './Skill.js';

@Entity({ discriminatorValue: SkillKind.QUERY_LANGUAGE })
export class QueryLanguage extends Skill {
  public static override create(props: Omit<SkillCreateProps, 'kind'>): QueryLanguage {
    const now = new Date();
    return new QueryLanguage({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: SkillKind.QUERY_LANGUAGE,
      categoryId: props.categoryId,
      description: props.description,
      aliases: props.aliases,
      technicalDomains: props.technicalDomains,
      conceptualAspects: props.conceptualAspects,
      architecturalPatterns: props.architecturalPatterns,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now
    });
  }
}
```

- [ ] **Step 6: Update domain barrel with all subclass exports**

Add to `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/index.ts`:
```typescript
export { Database } from './entities/Database.js';
export type { DatabaseCreateProps } from './entities/Database.js';
export { Framework } from './entities/Framework.js';
export type { FrameworkCreateProps } from './entities/Framework.js';
export { Library } from './entities/Library.js';
export type { LibraryCreateProps } from './entities/Library.js';
export { MarkupLanguage } from './entities/MarkupLanguage.js';
export { Protocol } from './entities/Protocol.js';
export type { ProtocolCreateProps } from './entities/Protocol.js';
export { ProgrammingLanguage } from './entities/ProgrammingLanguage.js';
export type { ProgrammingLanguageCreateProps } from './entities/ProgrammingLanguage.js';
export { QueryLanguage } from './entities/QueryLanguage.js';
export { Service } from './entities/Service.js';
export type { ServiceCreateProps } from './entities/Service.js';
export { Tool } from './entities/Tool.js';
export type { ToolCreateProps } from './entities/Tool.js';
```

- [ ] **Step 7: Run all domain tests**

Run: `bun test domain/`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add domain/src/entities/ProgrammingLanguage.ts domain/src/entities/MarkupLanguage.ts domain/src/entities/Framework.ts domain/src/entities/Library.ts domain/src/entities/Database.ts domain/src/entities/Tool.ts domain/src/entities/Service.ts domain/src/entities/Protocol.ts domain/src/entities/QueryLanguage.ts domain/test/entities/ProgrammingLanguage.test.ts domain/src/index.ts
git commit -m "feat(domain): add Skill STI subclasses for all 9 SkillKind values"
```

---

## Task 4: Concept, SkillDependency, ConceptDependency Entities

**Files:**
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Concept.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/SkillDependency.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/ConceptDependency.ts`
- Test: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/Concept.test.ts`
- Test: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/SkillDependency.test.ts`
- Test: `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/ConceptDependency.test.ts`

- [ ] **Step 1: Write failing tests**

Create `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/Concept.test.ts`:
```typescript
import { describe, expect, test } from 'bun:test';
import { Concept } from '../../src/entities/Concept.js';
import { ConceptKind } from '../../src/value-objects/ConceptKind.js';

describe('Concept', () => {
  test('creates with required fields', () => {
    const concept = Concept.create({
      label: 'REST (Representational State Transfer)',
      kind: ConceptKind.ARCHITECTURAL_PATTERN,
      category: 'Service Architecture Patterns',
      mindName: 'REST (Representational State Transfer)'
    });
    expect(concept.id).toBeString();
    expect(concept.label).toBe('REST (Representational State Transfer)');
    expect(concept.normalizedLabel).toBe('rest-representational-state-transfer');
    expect(concept.kind).toBe(ConceptKind.ARCHITECTURAL_PATTERN);
    expect(concept.category).toBe('Service Architecture Patterns');
    expect(concept.mindName).toBe('REST (Representational State Transfer)');
  });

  test('creates with null category', () => {
    const concept = Concept.create({
      label: 'Object-Oriented',
      kind: ConceptKind.CONCEPTUAL_ASPECT,
      category: null,
      mindName: 'Object-Oriented'
    });
    expect(concept.category).toBeNull();
  });

  test('throws when label is empty', () => {
    expect(() =>
      Concept.create({ label: '', kind: ConceptKind.TECHNICAL_DOMAIN, category: null, mindName: null })
    ).toThrow('label');
  });
});
```

Create `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/SkillDependency.test.ts`:
```typescript
import { describe, expect, test } from 'bun:test';
import { SkillDependency } from '../../src/entities/SkillDependency.js';

describe('SkillDependency', () => {
  test('creates with skillId and impliedSkillId', () => {
    const dep = SkillDependency.create({ skillId: 'skill-1', impliedSkillId: 'skill-2' });
    expect(dep.id).toBeString();
    expect(dep.skillId).toBe('skill-1');
    expect(dep.impliedSkillId).toBe('skill-2');
  });
});
```

Create `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/test/entities/ConceptDependency.test.ts`:
```typescript
import { describe, expect, test } from 'bun:test';
import { ConceptDependency } from '../../src/entities/ConceptDependency.js';

describe('ConceptDependency', () => {
  test('creates with skillId and conceptId', () => {
    const dep = ConceptDependency.create({ skillId: 'skill-1', conceptId: 'concept-1' });
    expect(dep.id).toBeString();
    expect(dep.skillId).toBe('skill-1');
    expect(dep.conceptId).toBe('concept-1');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test domain/test/entities/Concept.test.ts domain/test/entities/SkillDependency.test.ts domain/test/entities/ConceptDependency.test.ts`
Expected: FAIL

- [ ] **Step 3: Create Concept entity**

Create `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/Concept.ts`:
```typescript
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { normalizeLabel } from '@tailoredin/core';
import { AggregateRoot } from '../AggregateRoot.js';
import { ValidationError } from '../ValidationError.js';
import type { ConceptKind } from '../value-objects/ConceptKind.js';

export type ConceptCreateProps = {
  label: string;
  kind: ConceptKind;
  category: string | null;
  mindName: string | null;
};

@Entity({ tableName: 'concepts' })
export class Concept extends AggregateRoot {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'label', type: 'text' })
  public label: string;

  @Property({ fieldName: 'normalized_label', type: 'text', unique: true })
  public normalizedLabel: string;

  @Property({ fieldName: 'kind', type: 'text' })
  public kind: ConceptKind;

  @Property({ fieldName: 'category', type: 'text', nullable: true })
  public category: string | null;

  @Property({ fieldName: 'mind_name', type: 'text', nullable: true })
  public mindName: string | null;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: string;
    label: string;
    normalizedLabel: string;
    kind: ConceptKind;
    category: string | null;
    mindName: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    if (!props.label || props.label.length > 500)
      throw new ValidationError('label', 'must be between 1 and 500 characters');
    this.id = props.id;
    this.label = props.label;
    this.normalizedLabel = props.normalizedLabel;
    this.kind = props.kind;
    this.category = props.category;
    this.mindName = props.mindName;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: ConceptCreateProps): Concept {
    const now = new Date();
    return new Concept({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      kind: props.kind,
      category: props.category,
      mindName: props.mindName,
      createdAt: now,
      updatedAt: now
    });
  }
}
```

- [ ] **Step 4: Create SkillDependency entity**

Create `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/SkillDependency.ts`:
```typescript
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { Entity as DomainEntity } from '../Entity.js';

export type SkillDependencyCreateProps = {
  skillId: string;
  impliedSkillId: string;
};

@Entity({ tableName: 'skill_dependencies' })
export class SkillDependency extends DomainEntity {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'skill_id', type: 'uuid' })
  public readonly skillId: string;

  @Property({ fieldName: 'implied_skill_id', type: 'uuid' })
  public readonly impliedSkillId: string;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  public constructor(props: { id: string; skillId: string; impliedSkillId: string; createdAt: Date }) {
    super();
    this.id = props.id;
    this.skillId = props.skillId;
    this.impliedSkillId = props.impliedSkillId;
    this.createdAt = props.createdAt;
  }

  public static create(props: SkillDependencyCreateProps): SkillDependency {
    return new SkillDependency({
      id: crypto.randomUUID(),
      ...props,
      createdAt: new Date()
    });
  }
}
```

- [ ] **Step 5: Create ConceptDependency entity**

Create `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/ConceptDependency.ts`:
```typescript
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { Entity as DomainEntity } from '../Entity.js';

export type ConceptDependencyCreateProps = {
  skillId: string;
  conceptId: string;
};

@Entity({ tableName: 'concept_dependencies' })
export class ConceptDependency extends DomainEntity {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'skill_id', type: 'uuid' })
  public readonly skillId: string;

  @Property({ fieldName: 'concept_id', type: 'uuid' })
  public readonly conceptId: string;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  public constructor(props: { id: string; skillId: string; conceptId: string; createdAt: Date }) {
    super();
    this.id = props.id;
    this.skillId = props.skillId;
    this.conceptId = props.conceptId;
    this.createdAt = props.createdAt;
  }

  public static create(props: ConceptDependencyCreateProps): ConceptDependency {
    return new ConceptDependency({
      id: crypto.randomUUID(),
      ...props,
      createdAt: new Date()
    });
  }
}
```

- [ ] **Step 6: Add parentId to SkillCategory**

Modify `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/entities/SkillCategory.ts`. Add after the `normalizedLabel` property:

```typescript
  @Property({ fieldName: 'parent_id', type: 'uuid', nullable: true })
  public parentId: string | null;
```

Update the constructor props type to include `parentId: string | null` and assign it. Update `SkillCategoryCreateProps` to add optional `parentId`:

```typescript
export type SkillCategoryCreateProps = {
  label: string;
  parentId?: string | null;
};
```

Update factory:
```typescript
  public static create(props: SkillCategoryCreateProps): SkillCategory {
    const now = new Date();
    return new SkillCategory({
      id: crypto.randomUUID(),
      label: props.label,
      normalizedLabel: normalizeLabel(props.label),
      parentId: props.parentId ?? null,
      createdAt: now,
      updatedAt: now
    });
  }
```

- [ ] **Step 7: Create ConceptRepository port**

Create `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/ports/ConceptRepository.ts`:
```typescript
import type { Concept } from '../entities/Concept.js';

export interface ConceptRepository {
  findAll(): Promise<Concept[]>;
}
```

- [ ] **Step 8: Update domain barrel**

Add to `/Users/sylvainestevez/Documents/Projects/TailoredIn/domain/src/index.ts`:
```typescript
export type { ConceptCreateProps } from './entities/Concept.js';
export { Concept } from './entities/Concept.js';
export type { ConceptDependencyCreateProps } from './entities/ConceptDependency.js';
export { ConceptDependency } from './entities/ConceptDependency.js';
export type { SkillDependencyCreateProps } from './entities/SkillDependency.js';
export { SkillDependency } from './entities/SkillDependency.js';
export type { ConceptRepository } from './ports/ConceptRepository.js';
```

- [ ] **Step 9: Run all domain tests**

Run: `bun test domain/`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add domain/src/entities/Concept.ts domain/src/entities/SkillDependency.ts domain/src/entities/ConceptDependency.ts domain/src/entities/SkillCategory.ts domain/src/ports/ConceptRepository.ts domain/src/index.ts domain/test/entities/Concept.test.ts domain/test/entities/SkillDependency.test.ts domain/test/entities/ConceptDependency.test.ts
git commit -m "feat(domain): add Concept, SkillDependency, ConceptDependency entities, parentId on SkillCategory"
```

---

## Task 5: Database Migration

**Files:**
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/migrations/Migration_20260416000000_skills_domain_revision.ts`

- [ ] **Step 1: Create migration**

Create `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/migrations/Migration_20260416000000_skills_domain_revision.ts`:

```typescript
import { Migration } from '@mikro-orm/migrations';

export class Migration_20260416000000_skills_domain_revision extends Migration {
  public override async up(): Promise<void> {
    // 1. Add parent_id to skill_categories
    this.addSql(`ALTER TABLE "skill_categories" ADD COLUMN "parent_id" uuid REFERENCES "skill_categories"("id");`);

    // 2. Rename type → kind, add new columns to skills
    this.addSql(`ALTER TABLE "skills" RENAME COLUMN "type" TO "kind";`);

    this.addSql(`ALTER TABLE "skills"
      ADD COLUMN "technical_domains" jsonb NOT NULL DEFAULT '[]',
      ADD COLUMN "conceptual_aspects" jsonb NOT NULL DEFAULT '[]',
      ADD COLUMN "architectural_patterns" jsonb NOT NULL DEFAULT '[]',
      ADD COLUMN "mind_name" text,
      ADD COLUMN "runtime_environments" jsonb,
      ADD COLUMN "build_tools" jsonb,
      ADD COLUMN "paradigms" jsonb,
      ADD COLUMN "supported_languages" jsonb,
      ADD COLUMN "specific_to_frameworks" jsonb,
      ADD COLUMN "adapter_for_tool_or_service" jsonb,
      ADD COLUMN "implements_patterns" jsonb,
      ADD COLUMN "solves_application_tasks" jsonb,
      ADD COLUMN "associated_application_domains" jsonb,
      ADD COLUMN "deployment_types" jsonb,
      ADD COLUMN "groups" jsonb;
    `);

    // 3. Migrate existing kind values: language → programming_language, technology → tool
    this.addSql(`UPDATE "skills" SET "kind" = 'programming_language' WHERE "kind" = 'language';`);
    this.addSql(`UPDATE "skills" SET "kind" = 'tool' WHERE "kind" = 'technology';`);

    // 4. Add indexes on skills
    this.addSql(`CREATE INDEX "skills_kind_idx" ON "skills" ("kind");`);
    this.addSql(`CREATE INDEX "skills_mind_name_idx" ON "skills" ("mind_name") WHERE "mind_name" IS NOT NULL;`);

    // 5. Create concepts table
    this.addSql(`
      CREATE TABLE "concepts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "label" text NOT NULL,
        "normalized_label" text NOT NULL UNIQUE,
        "kind" text NOT NULL,
        "category" text,
        "mind_name" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    this.addSql(`CREATE INDEX "concepts_kind_idx" ON "concepts" ("kind");`);

    // 6. Create skill_dependencies table
    this.addSql(`
      CREATE TABLE "skill_dependencies" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "skill_id" uuid NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
        "implied_skill_id" uuid NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("skill_id", "implied_skill_id"),
        CHECK ("skill_id" != "implied_skill_id")
      );
    `);

    // 7. Create concept_dependencies table
    this.addSql(`
      CREATE TABLE "concept_dependencies" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "skill_id" uuid NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
        "concept_id" uuid NOT NULL REFERENCES "concepts"("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("skill_id", "concept_id")
      );
    `);
  }

  public override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "concept_dependencies";`);
    this.addSql(`DROP TABLE IF EXISTS "skill_dependencies";`);
    this.addSql(`DROP TABLE IF EXISTS "concepts";`);

    this.addSql(`DROP INDEX IF EXISTS "skills_mind_name_idx";`);
    this.addSql(`DROP INDEX IF EXISTS "skills_kind_idx";`);

    this.addSql(`UPDATE "skills" SET "kind" = 'language' WHERE "kind" = 'programming_language';`);
    this.addSql(`UPDATE "skills" SET "kind" = 'technology' WHERE "kind" NOT IN ('language');`);

    this.addSql(`ALTER TABLE "skills"
      DROP COLUMN "technical_domains",
      DROP COLUMN "conceptual_aspects",
      DROP COLUMN "architectural_patterns",
      DROP COLUMN "mind_name",
      DROP COLUMN "runtime_environments",
      DROP COLUMN "build_tools",
      DROP COLUMN "paradigms",
      DROP COLUMN "supported_languages",
      DROP COLUMN "specific_to_frameworks",
      DROP COLUMN "adapter_for_tool_or_service",
      DROP COLUMN "implements_patterns",
      DROP COLUMN "solves_application_tasks",
      DROP COLUMN "associated_application_domains",
      DROP COLUMN "deployment_types",
      DROP COLUMN "groups";
    `);

    this.addSql(`ALTER TABLE "skills" RENAME COLUMN "kind" TO "type";`);
    this.addSql(`ALTER TABLE "skill_categories" DROP COLUMN "parent_id";`);
  }
}
```

- [ ] **Step 2: Register new entities in ORM config**

Modify `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/db/orm-config.ts` — add imports and include in the entities array:

```typescript
import { Concept, ConceptDependency, SkillDependency, ProgrammingLanguage, MarkupLanguage, Framework, Library, Database, Tool, Service, Protocol, QueryLanguage } from '@tailoredin/domain';
```

Add all to the `entities` array.

- [ ] **Step 3: Commit**

```bash
git add infrastructure/src/db/migrations/Migration_20260416000000_skills_domain_revision.ts infrastructure/src/db/orm-config.ts
git commit -m "feat(infra): add migration for skills domain revision — new tables, columns, indexes"
```

---

## Task 6: Application Layer Updates (DTOs + Use Cases)

**Files:**
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/dtos/SkillDto.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/dtos/SkillCategoryDto.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/dtos/ConceptDto.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/use-cases/skill/ListConcepts.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/dtos/index.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/use-cases/index.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/test/use-cases/skill/SearchSkills.test.ts`

- [ ] **Step 1: Update SkillDto**

Replace `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/dtos/SkillDto.ts`:

```typescript
import type { Skill, SkillCategory, SkillKind } from '@tailoredin/domain';
import type { SkillCategoryDto } from './SkillCategoryDto.js';
import { toSkillCategoryDto } from './SkillCategoryDto.js';

export type SkillDto = {
  readonly id: string;
  readonly label: string;
  readonly kind: SkillKind;
  readonly categoryId: string | null;
  readonly category: SkillCategoryDto | null;
  readonly description: string | null;
};

export function toSkillDto(skill: Skill, category?: SkillCategory | null): SkillDto {
  return {
    id: skill.id,
    label: skill.label,
    kind: skill.kind,
    categoryId: skill.categoryId,
    category: category ? toSkillCategoryDto(category) : null,
    description: skill.description
  };
}
```

- [ ] **Step 2: Update SkillCategoryDto**

Replace `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/dtos/SkillCategoryDto.ts`:

```typescript
import type { SkillCategory } from '@tailoredin/domain';

export type SkillCategoryDto = {
  readonly id: string;
  readonly label: string;
  readonly parentId: string | null;
};

export function toSkillCategoryDto(category: SkillCategory): SkillCategoryDto {
  return {
    id: category.id,
    label: category.label,
    parentId: category.parentId
  };
}
```

- [ ] **Step 3: Create ConceptDto**

Create `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/dtos/ConceptDto.ts`:

```typescript
import type { Concept, ConceptKind } from '@tailoredin/domain';

export type ConceptDto = {
  readonly id: string;
  readonly label: string;
  readonly kind: ConceptKind;
  readonly category: string | null;
};

export function toConceptDto(concept: Concept): ConceptDto {
  return {
    id: concept.id,
    label: concept.label,
    kind: concept.kind,
    category: concept.category
  };
}
```

- [ ] **Step 4: Create ListConcepts use case**

Create `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/use-cases/skill/ListConcepts.ts`:

```typescript
import type { ConceptRepository } from '@tailoredin/domain';
import type { ConceptDto } from '../../dtos/ConceptDto.js';
import { toConceptDto } from '../../dtos/ConceptDto.js';

export class ListConcepts {
  public constructor(private readonly conceptRepository: ConceptRepository) {}

  public async execute(): Promise<ConceptDto[]> {
    const concepts = await this.conceptRepository.findAll();
    return concepts.map(toConceptDto);
  }
}
```

- [ ] **Step 5: Update application barrels**

In `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/dtos/index.ts`, add:
```typescript
export type { ConceptDto } from './ConceptDto.js';
export { toConceptDto } from './ConceptDto.js';
```

In `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/use-cases/index.ts`, add:
```typescript
export { ListConcepts } from './skill/ListConcepts.js';
```

- [ ] **Step 6: Fix SearchSkills tests**

Update `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/test/use-cases/skill/SearchSkills.test.ts` — replace all `type: SkillType.LANGUAGE` with `kind: SkillKind.PROGRAMMING_LANGUAGE` (and update imports from `SkillType` to `SkillKind`). Also add the new fields (`technicalDomains: [], conceptualAspects: [], architecturalPatterns: [], mindName: null`) to any test Skill constructors.

- [ ] **Step 7: Run application tests**

Run: `bun test application/`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add application/src/dtos/SkillDto.ts application/src/dtos/SkillCategoryDto.ts application/src/dtos/ConceptDto.ts application/src/use-cases/skill/ListConcepts.ts application/src/dtos/index.ts application/src/use-cases/index.ts application/test/
git commit -m "feat(app): update DTOs for SkillKind, add ConceptDto, ListConcepts use case"
```

---

## Task 7: Infrastructure — Repositories and DI

**Files:**
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/skill/PostgresSkillRepository.ts`
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/skill/PostgresConceptRepository.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/DI.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/index.ts`

- [ ] **Step 1: Create PostgresConceptRepository**

Create `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/skill/PostgresConceptRepository.ts`:

```typescript
import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { Concept, type ConceptRepository } from '@tailoredin/domain';

@injectable()
export class PostgresConceptRepository implements ConceptRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findAll(): Promise<Concept[]> {
    return this.orm.em.find(Concept, {}, { orderBy: { label: 'ASC' } });
  }
}
```

- [ ] **Step 2: Update DI tokens**

In `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/DI.ts`, add import for `ListConcepts` and `ConceptRepository`, then add to the `Skill` namespace:

```typescript
import type { ListConcepts } from '@tailoredin/application';
import type { ConceptRepository } from '@tailoredin/domain';

// Inside DI.Skill:
  Skill: {
    Repository: new InjectionToken<SkillRepository>('DI.Skill.Repository'),
    CategoryRepository: new InjectionToken<SkillCategoryRepository>('DI.Skill.CategoryRepository'),
    ConceptRepository: new InjectionToken<ConceptRepository>('DI.Skill.ConceptRepository'),
    List: new InjectionToken<ListSkills>('DI.Skill.List'),
    Search: new InjectionToken<SearchSkills>('DI.Skill.Search'),
    ListCategories: new InjectionToken<ListSkillCategories>('DI.Skill.ListCategories'),
    ListConcepts: new InjectionToken<ListConcepts>('DI.Skill.ListConcepts'),
    SyncExperienceSkills: new InjectionToken<SyncExperienceSkills>('DI.Skill.SyncExperienceSkills')
  },
```

- [ ] **Step 3: Update infrastructure barrel**

In `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/index.ts`, add:
```typescript
export { PostgresConceptRepository } from './skill/PostgresConceptRepository.js';
```

- [ ] **Step 4: Commit**

```bash
git add infrastructure/src/skill/PostgresConceptRepository.ts infrastructure/src/DI.ts infrastructure/src/index.ts
git commit -m "feat(infra): add PostgresConceptRepository, update DI tokens for concepts"
```

---

## Task 8: Rewrite SkillSyncService (5-Phase Pipeline)

**Files:**
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/skill-sync/SkillSyncService.ts`

This is the largest single task. The sync service is rewritten to:
1. Upsert categories from MIND source file basenames
2. Upsert skills with `SkillKind` from MIND type tags + all metadata fields
3. Upsert concepts from `mind_concepts` staging table
4. Resolve skill→skill dependencies
5. Resolve skill→concept dependencies

- [ ] **Step 1: Write the full SkillSyncService replacement**

Replace `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/src/skill-sync/SkillSyncService.ts`:

```typescript
import type { Connection } from '@mikro-orm/postgresql';
import { Logger, normalizeLabel } from '@tailoredin/core';
import type { SkillAlias } from '@tailoredin/domain';

const BATCH_SIZE = 500;

const MIND_TYPE_TO_KIND: Record<string, string> = {
  ProgrammingLanguage: 'programming_language',
  MarkupLanguage: 'markup_language',
  Framework: 'framework',
  Library: 'library',
  Database: 'database',
  Tool: 'tool',
  Webserver: 'tool',
  Service: 'service',
  Protocol: 'protocol',
  QueryLanguage: 'query_language'
};

const MULTI_TYPE_OVERRIDES: Record<string, string> = {
  Docker: 'tool',
  Realm: 'database',
  'Flux CD': 'tool',
  'Fabric8 Kubernetes Client': 'library'
};

const SOURCE_FILE_TO_CATEGORY: Record<string, string> = {
  programming_languages: 'Programming Languages',
  markup_languages: 'Markup Languages',
  frameworks_frontend: 'Frontend Frameworks',
  frameworks_backend: 'Backend Frameworks',
  frameworks_mobile: 'Mobile Frameworks',
  frameworks_fullstack: 'Fullstack Frameworks',
  libraries_javascript: 'JavaScript Libraries',
  libraries_python: 'Python Libraries',
  libraries_java: 'Java Libraries',
  libraries_csharp: 'C# Libraries',
  libraries_kotlin: 'Kotlin Libraries',
  // biome-ignore lint/style/useNamingConvention: exact MIND source_file key
  libraries_frontend_UI: 'Frontend UI Libraries',
  // biome-ignore lint/style/useNamingConvention: exact MIND source_file key
  libraries_mobile_UI: 'Mobile UI Libraries',
  'libraries_-various': 'General Libraries',
  databases: 'Relational Databases',
  databases_nosql: 'NoSQL Databases',
  query_languages: 'Query Languages',
  services: 'Services',
  cloud_services: 'Cloud Services',
  cloud_platforms: 'Cloud Platforms',
  infrastructure: 'Infrastructure',
  operating_systems: 'Operating Systems',
  containerization: 'Containerization',
  ci_cd: 'CI/CD',
  devops: 'DevOps',
  build_tools: 'Build Tools',
  package_managers: 'Package Managers',
  version_control: 'Version Control',
  ides: 'IDEs',
  tools: 'Developer Tools',
  testing: 'Testing',
  machine_learning: 'Machine Learning',
  ai_tools: 'AI Tools',
  data_science: 'Data Science',
  protocols: 'Protocols',
  webservers: 'Web Servers',
  runtime_environments: 'Runtime Environments',
  architectural_patterns: 'Architectural Patterns',
  design_patterns: 'Design Patterns'
};

const CONCEPT_FILE_TO_KIND: Record<string, string> = {
  architectural_patterns: 'architectural_pattern',
  application_tasks: 'application_task',
  application_domains: 'application_domain',
  conceptual_aspects: 'conceptual_aspect',
  technical_domains: 'technical_domain',
  vertical_domains: 'vertical_domain',
  skill_deployment_types: 'deployment_type'
};

type CandidateSkill = {
  label: string;
  normalizedLabel: string;
  kind: string;
  categoryLabel: string | null;
  description: string | null;
  aliases: SkillAlias[];
  mindName: string | null;
  technicalDomains: string[];
  conceptualAspects: string[];
  architecturalPatterns: string[];
  runtimeEnvironments: string[] | null;
  buildTools: string[] | null;
  paradigms: string[] | null;
  supportedLanguages: string[] | null;
  specificToFrameworks: string[] | null;
  adapterForToolOrService: string[] | null;
  implementsPatterns: string[] | null;
  solvesApplicationTasks: string[] | null;
  associatedApplicationDomains: string[] | null;
  deploymentTypes: string[] | null;
  groups: string[] | null;
  sourcePriority: number;
};

function parseJsonb<T>(val: T[] | string | null | undefined): T[] {
  if (val == null) return [];
  if (typeof val === 'string') return JSON.parse(val);
  return val;
}

function resolveKind(mindName: string, mindTypes: string[]): string {
  if (MULTI_TYPE_OVERRIDES[mindName]) return MULTI_TYPE_OVERRIDES[mindName];
  for (const t of mindTypes) {
    const kind = MIND_TYPE_TO_KIND[t];
    if (kind) return kind;
  }
  return 'tool';
}

export class SkillSyncService {
  private readonly log = Logger.create('skill-sync');

  public constructor(private readonly connection: Connection) {}

  public async sync(): Promise<void> {
    const totalStart = performance.now();

    // Phase 1: Upsert categories
    const categoryMap = await this.upsertCategories();
    this.log.info(`Categories: ${categoryMap.size} upserted`);

    // Phase 2: Upsert skills
    const skillMap = await this.upsertSkills(categoryMap);
    this.log.info(`Skills: ${skillMap.size} upserted`);

    // Phase 3: Upsert concepts
    const conceptMap = await this.upsertConcepts();
    this.log.info(`Concepts: ${conceptMap.size} upserted`);

    // Phase 4: Resolve skill dependencies
    const skillDepCount = await this.resolveSkillDependencies(skillMap);
    this.log.info(`Skill dependencies: ${skillDepCount} resolved`);

    // Phase 5: Resolve concept dependencies
    const conceptDepCount = await this.resolveConceptDependencies(skillMap, conceptMap);
    this.log.info(`Concept dependencies: ${conceptDepCount} resolved`);

    const elapsed = ((performance.now() - totalStart) / 1000).toFixed(2);
    this.log.info(`Done in ${elapsed}s`);
  }

  public async reset(): Promise<void> {
    this.log.info('Resetting skills data...');
    await this.connection.execute('DELETE FROM "concept_dependencies"', [], 'run');
    await this.connection.execute('DELETE FROM "skill_dependencies"', [], 'run');
    await this.connection.execute('DELETE FROM "concepts"', [], 'run');
    await this.connection.execute('DELETE FROM "experience_skills"', [], 'run');
    await this.connection.execute('DELETE FROM "skills"', [], 'run');
    await this.connection.execute('DELETE FROM "skill_categories"', [], 'run');
    this.log.info('Reset complete');
  }

  // ---- Phase 1: Upsert categories ----

  private async upsertCategories(): Promise<Map<string, string>> {
    const categoryLabels = new Set(Object.values(SOURCE_FILE_TO_CATEGORY));
    const now = new Date();
    const rows = [...categoryLabels].map(label => [
      crypto.randomUUID(), label, normalizeLabel(label), null, now, now
    ]);

    await this.batchUpsert(
      'skill_categories',
      ['id', 'label', 'normalized_label', 'parent_id', 'created_at', 'updated_at'],
      ['normalized_label'],
      rows
    );

    const result = await this.connection.execute(
      `SELECT "id", "label" FROM "skill_categories"`, [], 'all'
    );
    return new Map(result.map((r: { id: string; label: string }) => [r.label, r.id]));
  }

  // ---- Phase 2: Upsert skills ----

  private async upsertSkills(categoryMap: Map<string, string>): Promise<Map<string, string>> {
    const linguist = await this.readLinguistLanguages();
    this.log.info(`Linguist: ${linguist.length} candidates`);

    const mind = await this.readMindSkills();
    this.log.info(`MIND: ${mind.length} candidates`);

    const allCandidates = [...linguist, ...mind];
    const deduplicated = this.deduplicateSkills(allCandidates);
    this.log.info(`Deduplicated: ${allCandidates.length} -> ${deduplicated.length} unique skills`);

    const now = new Date();
    const rows = deduplicated.map(s => [
      crypto.randomUUID(),
      s.label,
      s.normalizedLabel,
      s.kind,
      s.categoryLabel ? (categoryMap.get(s.categoryLabel) ?? null) : null,
      s.description,
      JSON.stringify(s.aliases),
      JSON.stringify(s.technicalDomains),
      JSON.stringify(s.conceptualAspects),
      JSON.stringify(s.architecturalPatterns),
      s.mindName,
      s.runtimeEnvironments ? JSON.stringify(s.runtimeEnvironments) : null,
      s.buildTools ? JSON.stringify(s.buildTools) : null,
      s.paradigms ? JSON.stringify(s.paradigms) : null,
      s.supportedLanguages ? JSON.stringify(s.supportedLanguages) : null,
      s.specificToFrameworks ? JSON.stringify(s.specificToFrameworks) : null,
      s.adapterForToolOrService ? JSON.stringify(s.adapterForToolOrService) : null,
      s.implementsPatterns ? JSON.stringify(s.implementsPatterns) : null,
      s.solvesApplicationTasks ? JSON.stringify(s.solvesApplicationTasks) : null,
      s.associatedApplicationDomains ? JSON.stringify(s.associatedApplicationDomains) : null,
      s.deploymentTypes ? JSON.stringify(s.deploymentTypes) : null,
      s.groups ? JSON.stringify(s.groups) : null,
      now,
      now
    ]);

    await this.batchUpsert(
      'skills',
      [
        'id', 'label', 'normalized_label', 'kind', 'category_id', 'description',
        'aliases', 'technical_domains', 'conceptual_aspects', 'architectural_patterns',
        'mind_name', 'runtime_environments', 'build_tools', 'paradigms',
        'supported_languages', 'specific_to_frameworks', 'adapter_for_tool_or_service',
        'implements_patterns', 'solves_application_tasks', 'associated_application_domains',
        'deployment_types', 'groups', 'created_at', 'updated_at'
      ],
      ['normalized_label'],
      rows
    );

    const result = await this.connection.execute(
      `SELECT "id", "mind_name" FROM "skills" WHERE "mind_name" IS NOT NULL`, [], 'all'
    );
    const skillMap = new Map<string, string>();
    for (const row of result as { id: string; mind_name: string }[]) {
      skillMap.set(row.mind_name, row.id);
    }
    return skillMap;
  }

  private async readLinguistLanguages(): Promise<CandidateSkill[]> {
    const rows = await this.connection.execute(
      `SELECT "linguist_name", "linguist_type", "aliases"
       FROM "linguist_languages"
       WHERE "linguist_type" IN ('programming', 'markup')`,
      [], 'all'
    );

    return rows.map((row: { linguist_name: string; linguist_type: string; aliases: string[] | string }) => {
      const rawAliases = parseJsonb(row.aliases as string[]);
      const aliases: SkillAlias[] = rawAliases.map((a: string) => ({
        label: a,
        normalizedLabel: normalizeLabel(a)
      }));
      const kind = row.linguist_type === 'programming' ? 'programming_language' : 'markup_language';
      const categoryLabel = row.linguist_type === 'programming' ? 'Programming Languages' : 'Markup Languages';

      return {
        label: row.linguist_name,
        normalizedLabel: normalizeLabel(row.linguist_name),
        kind,
        categoryLabel,
        description: null,
        aliases,
        mindName: null,
        technicalDomains: [],
        conceptualAspects: [],
        architecturalPatterns: [],
        runtimeEnvironments: kind === 'programming_language' ? [] : null,
        buildTools: kind === 'programming_language' ? [] : null,
        paradigms: kind === 'programming_language' ? [] : null,
        supportedLanguages: null,
        specificToFrameworks: null,
        adapterForToolOrService: null,
        implementsPatterns: null,
        solvesApplicationTasks: null,
        associatedApplicationDomains: null,
        deploymentTypes: null,
        groups: null,
        sourcePriority: 1
      };
    });
  }

  private async readMindSkills(): Promise<CandidateSkill[]> {
    const rows = await this.connection.execute(
      `SELECT * FROM "mind_skills"`, [], 'all'
    );

    return rows.map((row: Record<string, unknown>) => {
      const mindName = row.mind_name as string;
      const mindTypes = parseJsonb(row.mind_type as string[]);
      const synonyms = parseJsonb(row.synonyms as string[]);
      const sourceFile = row.mind_source_file as string;
      const kind = resolveKind(mindName, mindTypes);

      const aliases: SkillAlias[] = synonyms.map((s: string) => ({
        label: s,
        normalizedLabel: normalizeLabel(s)
      }));

      const categoryLabel = SOURCE_FILE_TO_CATEGORY[sourceFile] ?? null;

      const technicalDomains = parseJsonb(row.technical_domains as string[]);
      const conceptualAspects = parseJsonb(row.conceptual_aspects as string[]);
      const architecturalPatterns = parseJsonb(row.architectural_patterns as string[]);

      const result: CandidateSkill = {
        label: mindName,
        normalizedLabel: normalizeLabel(mindName),
        kind,
        categoryLabel,
        description: null,
        aliases,
        mindName,
        technicalDomains,
        conceptualAspects,
        architecturalPatterns,
        runtimeEnvironments: kind === 'programming_language' ? parseJsonb(row.runtime_environments as string[]) : null,
        buildTools: kind === 'programming_language' ? parseJsonb(row.build_tools as string[]) : null,
        paradigms: null,
        supportedLanguages: ['framework', 'library'].includes(kind) ? parseJsonb(row.supported_programming_languages as string[]) : null,
        specificToFrameworks: kind === 'library' ? parseJsonb(row.specific_to_frameworks as string[]) : null,
        adapterForToolOrService: kind === 'library' ? parseJsonb(row.adapter_for_tool_or_service as string[]) : null,
        implementsPatterns: kind === 'library' ? parseJsonb(row.implements_patterns as string[]) : null,
        solvesApplicationTasks: ['framework', 'library', 'database', 'tool', 'service', 'protocol'].includes(kind)
          ? parseJsonb(row.solves_application_tasks as string[]) : null,
        associatedApplicationDomains: ['framework', 'library', 'database', 'tool', 'service', 'protocol'].includes(kind)
          ? parseJsonb(row.associated_to_application_domains as string[]) : null,
        deploymentTypes: ['tool', 'service'].includes(kind) ? [] : null,
        groups: kind === 'service' ? [] : null,
        sourcePriority: 2
      };

      // Extract paradigms from conceptualAspects for programming languages
      if (kind === 'programming_language') {
        const paradigmKeywords = [
          'Object-Oriented', 'Functional', 'Imperative', 'Declarative', 'Procedural',
          'Logic', 'Concurrent', 'Event-Driven', 'Reactive', 'Multi-Paradigm',
          'Prototype-Based', 'Aspect-Oriented', 'Metaprogramming', 'Generic'
        ];
        result.paradigms = conceptualAspects.filter(a => paradigmKeywords.includes(a));
      }

      return result;
    });
  }

  // ---- Deduplication (same logic as before, adapted for CandidateSkill) ----

  private deduplicateSkills(candidates: CandidateSkill[]): CandidateSkill[] {
    const byNormalizedLabel = new Map<string, CandidateSkill>();
    const aliasIndex = new Map<string, string>();

    for (const candidate of candidates) {
      const match = this.findMatch(candidate, byNormalizedLabel, aliasIndex);

      if (match) {
        const newAliases = this.mergeInto(match, candidate);
        for (const alias of newAliases) {
          aliasIndex.set(alias, match.normalizedLabel);
        }
      } else {
        byNormalizedLabel.set(candidate.normalizedLabel, candidate);
        for (const alias of candidate.aliases) {
          if (alias.normalizedLabel !== candidate.normalizedLabel) {
            aliasIndex.set(alias.normalizedLabel, candidate.normalizedLabel);
          }
        }
      }
    }

    return [...byNormalizedLabel.values()];
  }

  private findMatch(
    candidate: CandidateSkill,
    byNormalizedLabel: Map<string, CandidateSkill>,
    aliasIndex: Map<string, string>
  ): CandidateSkill | null {
    const direct = byNormalizedLabel.get(candidate.normalizedLabel);
    if (direct) return direct;

    const ownerKey = aliasIndex.get(candidate.normalizedLabel);
    if (ownerKey) {
      const owner = byNormalizedLabel.get(ownerKey);
      if (owner) return owner;
    }

    for (const alias of candidate.aliases) {
      const aliasMatch = byNormalizedLabel.get(alias.normalizedLabel);
      if (aliasMatch) return aliasMatch;
    }

    for (const alias of candidate.aliases) {
      const aliasOwnerKey = aliasIndex.get(alias.normalizedLabel);
      if (aliasOwnerKey) {
        const aliasOwner = byNormalizedLabel.get(aliasOwnerKey);
        if (aliasOwner) return aliasOwner;
      }
    }

    return null;
  }

  private mergeInto(existing: CandidateSkill, candidate: CandidateSkill): string[] {
    if (candidate.description && (!existing.description || candidate.description.length > existing.description.length)) {
      existing.description = candidate.description;
    }

    if (!existing.categoryLabel && candidate.categoryLabel) {
      existing.categoryLabel = candidate.categoryLabel;
    }

    // Merge MIND metadata into Linguist skill
    if (candidate.mindName && !existing.mindName) {
      existing.mindName = candidate.mindName;
      existing.technicalDomains = candidate.technicalDomains;
      existing.conceptualAspects = candidate.conceptualAspects;
      existing.architecturalPatterns = candidate.architecturalPatterns;
      if (candidate.runtimeEnvironments) existing.runtimeEnvironments = candidate.runtimeEnvironments;
      if (candidate.buildTools) existing.buildTools = candidate.buildTools;
      if (candidate.paradigms) existing.paradigms = candidate.paradigms;
      if (candidate.supportedLanguages) existing.supportedLanguages = candidate.supportedLanguages;
      if (candidate.specificToFrameworks) existing.specificToFrameworks = candidate.specificToFrameworks;
      if (candidate.adapterForToolOrService) existing.adapterForToolOrService = candidate.adapterForToolOrService;
      if (candidate.implementsPatterns) existing.implementsPatterns = candidate.implementsPatterns;
      if (candidate.solvesApplicationTasks) existing.solvesApplicationTasks = candidate.solvesApplicationTasks;
      if (candidate.associatedApplicationDomains) existing.associatedApplicationDomains = candidate.associatedApplicationDomains;
      if (candidate.deploymentTypes) existing.deploymentTypes = candidate.deploymentTypes;
      if (candidate.groups) existing.groups = candidate.groups;
    }

    const existingAliasSet = new Set(existing.aliases.map(a => a.normalizedLabel));
    const newAliases: string[] = [];

    if (candidate.normalizedLabel !== existing.normalizedLabel && !existingAliasSet.has(candidate.normalizedLabel)) {
      existing.aliases.push({ label: candidate.label, normalizedLabel: candidate.normalizedLabel });
      existingAliasSet.add(candidate.normalizedLabel);
      newAliases.push(candidate.normalizedLabel);
    }

    for (const alias of candidate.aliases) {
      if (alias.normalizedLabel !== existing.normalizedLabel && !existingAliasSet.has(alias.normalizedLabel)) {
        existing.aliases.push(alias);
        existingAliasSet.add(alias.normalizedLabel);
        newAliases.push(alias.normalizedLabel);
      }
    }

    return newAliases;
  }

  // ---- Phase 3: Upsert concepts ----

  private async upsertConcepts(): Promise<Map<string, string>> {
    const rows = await this.connection.execute(
      `SELECT "mind_name", "mind_type", "category" FROM "mind_concepts"`, [], 'all'
    );

    const now = new Date();
    const conceptRows = rows.map((row: { mind_name: string; mind_type: string; category: string | null }) => {
      const kind = CONCEPT_FILE_TO_KIND[row.mind_type] ?? 'conceptual_aspect';
      return [
        crypto.randomUUID(),
        row.mind_name,
        normalizeLabel(row.mind_name),
        kind,
        row.category,
        row.mind_name,
        now,
        now
      ];
    });

    if (conceptRows.length > 0) {
      await this.batchUpsert(
        'concepts',
        ['id', 'label', 'normalized_label', 'kind', 'category', 'mind_name', 'created_at', 'updated_at'],
        ['normalized_label'],
        conceptRows
      );
    }

    const result = await this.connection.execute(
      `SELECT "id", "mind_name" FROM "concepts" WHERE "mind_name" IS NOT NULL`, [], 'all'
    );
    return new Map(result.map((r: { id: string; mind_name: string }) => [r.mind_name, r.id]));
  }

  // ---- Phase 4: Resolve skill dependencies ----

  private async resolveSkillDependencies(skillMap: Map<string, string>): Promise<number> {
    const rows = await this.connection.execute(
      `SELECT "mind_source_name", "mind_target_name"
       FROM "mind_relations"
       WHERE "relation_type" = 'impliesKnowingSkills'`,
      [], 'all'
    );

    // Clear existing
    await this.connection.execute('DELETE FROM "skill_dependencies"', [], 'run');

    const now = new Date();
    const depRows: unknown[][] = [];
    for (const row of rows as { mind_source_name: string; mind_target_name: string }[]) {
      const sourceId = skillMap.get(row.mind_source_name);
      const targetId = skillMap.get(row.mind_target_name);
      if (sourceId && targetId && sourceId !== targetId) {
        depRows.push([crypto.randomUUID(), sourceId, targetId, now]);
      }
    }

    if (depRows.length > 0) {
      await this.batchUpsert(
        'skill_dependencies',
        ['id', 'skill_id', 'implied_skill_id', 'created_at'],
        ['skill_id', 'implied_skill_id'],
        depRows
      );
    }

    return depRows.length;
  }

  // ---- Phase 5: Resolve concept dependencies ----

  private async resolveConceptDependencies(
    skillMap: Map<string, string>,
    conceptMap: Map<string, string>
  ): Promise<number> {
    const rows = await this.connection.execute(
      `SELECT "mind_source_name", "mind_target_name"
       FROM "mind_relations"
       WHERE "relation_type" = 'impliesKnowingConcepts'`,
      [], 'all'
    );

    // Clear existing
    await this.connection.execute('DELETE FROM "concept_dependencies"', [], 'run');

    const now = new Date();
    const depRows: unknown[][] = [];
    for (const row of rows as { mind_source_name: string; mind_target_name: string }[]) {
      const skillId = skillMap.get(row.mind_source_name);
      const conceptId = conceptMap.get(row.mind_target_name);
      if (skillId && conceptId) {
        depRows.push([crypto.randomUUID(), skillId, conceptId, now]);
      }
    }

    if (depRows.length > 0) {
      await this.batchUpsert(
        'concept_dependencies',
        ['id', 'skill_id', 'concept_id', 'created_at'],
        ['skill_id', 'concept_id'],
        depRows
      );
    }

    return depRows.length;
  }

  // ---- Batch upsert helper ----

  private async batchUpsert(
    table: string,
    columns: string[],
    conflictColumns: string[],
    rows: unknown[][]
  ): Promise<void> {
    if (rows.length === 0) return;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await this.executeBatch(table, columns, conflictColumns, batch);
    }
  }

  private async executeBatch(
    table: string,
    columns: string[],
    conflictColumns: string[],
    rows: unknown[][]
  ): Promise<void> {
    if (rows.length === 0) return;

    const colList = columns.map(c => `"${c}"`).join(', ');
    const conflictList = conflictColumns.map(c => `"${c}"`).join(', ');
    const updateCols = columns.filter(c => !conflictColumns.includes(c) && c !== 'id' && c !== 'created_at');
    const updateSet = updateCols.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');

    const params: unknown[] = [];
    const valueTuples: string[] = [];
    for (const row of rows) {
      const placeholders = row.map(val => {
        params.push(val);
        return '?';
      });
      valueTuples.push(`(${placeholders.join(', ')})`);
    }

    let sql = `INSERT INTO "${table}" (${colList}) VALUES ${valueTuples.join(', ')}`;
    if (updateSet) {
      sql += ` ON CONFLICT (${conflictList}) DO UPDATE SET ${updateSet}`;
    } else {
      sql += ` ON CONFLICT (${conflictList}) DO NOTHING`;
    }

    await this.connection.execute(sql, params, 'run');
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add infrastructure/src/skill-sync/SkillSyncService.ts
git commit -m "feat(infra): rewrite SkillSyncService as 5-phase pipeline with kind, concepts, dependencies"
```

---

## Task 9: API Layer Updates

**Files:**
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/api/src/routes/skill/ListSkillsRoute.ts` (no changes needed — delegates to use case)
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/api/src/routes/skill/SearchSkillsRoute.ts` (no changes needed)
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/api/src/routes/skill/ListSkillCategoriesRoute.ts` (no changes needed)
- Create: `/Users/sylvainestevez/Documents/Projects/TailoredIn/api/src/routes/skill/ListConceptsRoute.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/api/src/container.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/api/src/index.ts`

- [ ] **Step 1: Create ListConceptsRoute**

Create `/Users/sylvainestevez/Documents/Projects/TailoredIn/api/src/routes/skill/ListConceptsRoute.ts`:

```typescript
import { inject, injectable } from '@needle-di/core';
import type { ListConcepts } from '@tailoredin/application';
import { DI } from '@tailoredin/infrastructure';
import { Elysia } from 'elysia';

@injectable()
export class ListConceptsRoute {
  public constructor(private readonly listConcepts: ListConcepts = inject(DI.Skill.ListConcepts)) {}

  public plugin() {
    return new Elysia().get('/concepts', async () => {
      const data = await this.listConcepts.execute();
      return { data };
    });
  }
}
```

- [ ] **Step 2: Add DI bindings in container.ts**

In `/Users/sylvainestevez/Documents/Projects/TailoredIn/api/src/container.ts`, add imports and bindings:

```typescript
import { ListConcepts } from '@tailoredin/application';
import { PostgresConceptRepository } from '@tailoredin/infrastructure';
```

After the existing skill bindings, add:
```typescript
container.bind({ provide: DI.Skill.ConceptRepository, useClass: PostgresConceptRepository });
container.bind({
  provide: DI.Skill.ListConcepts,
  useFactory: () => new ListConcepts(container.get(DI.Skill.ConceptRepository))
});
```

- [ ] **Step 3: Mount route in api/src/index.ts**

Add import:
```typescript
import { ListConceptsRoute } from './routes/skill/ListConceptsRoute.js';
```

Add after `ListSkillCategoriesRoute`:
```typescript
  .use(container.get(ListConceptsRoute).plugin())
```

- [ ] **Step 4: Commit**

```bash
git add api/src/routes/skill/ListConceptsRoute.ts api/src/container.ts api/src/index.ts
git commit -m "feat(api): add GET /concepts route, wire DI for ConceptRepository"
```

---

## Task 10: Web Layer Updates

**Files:**
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/hooks/use-skills.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/routes/skills/index.tsx`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/components/skills/SkillsContent.tsx`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/components/skills/SkillCategorySidebar.tsx`

- [ ] **Step 1: Update use-skills hook**

In `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/hooks/use-skills.ts`, rename the `type` field to `kind` in the `Skill` type:

```typescript
export type Skill = {
  id: string;
  label: string;
  kind: string;
  categoryId: string | null;
  category: { id: string; label: string; parentId: string | null } | null;
  description: string | null;
};

export type SkillCategory = {
  id: string;
  label: string;
  parentId: string | null;
};
```

- [ ] **Step 2: Update skills page and components**

In `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/routes/skills/index.tsx` and related components, replace any references to `skill.type` with `skill.kind`. The existing grouping by category should continue to work since `categoryId` is unchanged.

In `/Users/sylvainestevez/Documents/Projects/TailoredIn/web/src/components/skills/SkillCategorySidebar.tsx`, if category has a `parentId` field, no display changes are needed now — the hierarchy is for future use.

- [ ] **Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add web/src/hooks/use-skills.ts web/src/routes/skills/index.tsx web/src/components/skills/SkillsContent.tsx web/src/components/skills/SkillCategorySidebar.tsx
git commit -m "feat(web): update Skill type to use kind instead of type, add parentId to categories"
```

---

## Task 11: Fix All Remaining Type Errors

**Files:**
- All files that reference `SkillType` or `skill.type`

- [ ] **Step 1: Search for remaining SkillType references**

Run: `grep -r "SkillType" --include="*.ts" --include="*.tsx" -l` in the worktree to find all files still referencing `SkillType`.

- [ ] **Step 2: Fix each reference**

Replace `SkillType` imports with `SkillKind`, replace `.type` accesses with `.kind`, update any enum value references (`SkillType.LANGUAGE` → `SkillKind.PROGRAMMING_LANGUAGE`, `SkillType.TECHNOLOGY` → the appropriate kind).

Key files likely affected:
- `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/use-cases/experience/SyncExperienceSkills.ts` (if it references skill.type)
- `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/use-cases/experience/ListExperiences.ts` (if it maps skills)
- `/Users/sylvainestevez/Documents/Projects/TailoredIn/application/src/dtos/ExperienceSkillDto.ts` (if it includes type)
- Any route files that reference SkillType

- [ ] **Step 3: Run full typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 4: Run all unit tests**

Run: `bun run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: replace all SkillType references with SkillKind across codebase"
```

---

## Task 12: Update Integration Tests

**Files:**
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/test-integration/skill-sync/skill-sync.test.ts`
- Modify: `/Users/sylvainestevez/Documents/Projects/TailoredIn/infrastructure/test-integration/skill/PostgresSkillRepository.test.ts`

- [ ] **Step 1: Rewrite skill-sync integration tests**

The test needs to:
- Add `mind_concepts` and `mind_relations` fixtures
- Clean new tables in `beforeEach` (`concept_dependencies`, `skill_dependencies`, `concepts`)
- Test category count matches MIND source file-derived categories (~36)
- Test `kind` values (programming_language, framework, database, tool, query_language)
- Test concept upsert from `mind_concepts`
- Test skill dependency resolution from `mind_relations`
- Test concept dependency resolution
- Test idempotency of the full pipeline
- Test multi-type edge case overrides (Docker→tool)

Update the `seedFixtures` function to include `mind_concepts` and `mind_relations` rows. Update assertions to use the new `kind` column values instead of `type`.

- [ ] **Step 2: Update PostgresSkillRepository integration tests**

Update Skill constructors in test fixtures to use `kind` instead of `type` and include the new fields (`technicalDomains`, `conceptualAspects`, `architecturalPatterns`, `mindName`).

- [ ] **Step 3: Run integration tests**

Run: `bun run --cwd infrastructure test:integration`
Expected: PASS (60s timeout per test)

- [ ] **Step 4: Commit**

```bash
git add infrastructure/test-integration/
git commit -m "test(infra): update integration tests for skills domain revision"
```

---

## Task 13: Run Full Quality Checks

- [ ] **Step 1: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 2: Run linter**

Run: `bun run check`
Expected: PASS (fix any issues with `bun run check:fix`)

- [ ] **Step 3: Run unit tests**

Run: `bun run test`
Expected: PASS

- [ ] **Step 4: Run integration tests**

Run: `bun run --cwd infrastructure test:integration`
Expected: PASS

- [ ] **Step 5: Run dead code check**

Run: `bun run knip`
Expected: PASS (SkillType.ts should be gone, no dangling exports)

- [ ] **Step 6: Run dependency boundary check**

Run: `bun run dep:check`
Expected: PASS

- [ ] **Step 7: Run E2E tests**

Run: `bun e2e:test`
Expected: PASS

- [ ] **Step 8: Regenerate diagrams**

Run: `bun run diags`

- [ ] **Step 9: Commit diagram changes**

```bash
git add domain/DOMAIN.mmd application/APPLICATION.mmd infrastructure/DATABASE.mmd
git commit -m "docs: regenerate diagrams after skills domain revision"
```
