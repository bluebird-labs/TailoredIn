# Extract MIND Runtimes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface runtimes (Node.js, Deno, Bun, etc.) as standalone skills in search by extracting them from MIND's `runtime_environments` column and cross-referencing Linguist interpreter names as aliases.

**Architecture:** Two new private methods in `SkillSyncService`: `readMindRuntimes()` extracts unique runtimes from the `runtime_environments` JSONB column as `CandidateSkill` entries, and `crossReferenceInterpreters()` joins Linguist interpreters to those runtimes through the parent language name, adding matched interpreters as aliases. The existing dedup and upsert phases handle the rest unchanged.

**Tech Stack:** TypeScript, MikroORM (raw SQL), bun:test, Testcontainers (PostgreSQL)

**Spec:** `docs/superpowers/specs/2026-04-15-extract-mind-runtimes-design.md`

---

### Task 1: Update test fixtures to include runtime and interpreter data

The existing test fixtures seed JavaScript with empty `runtime_environments` and empty `interpreters`. Update them to carry real data so subsequent tests can verify the new behavior.

**Files:**
- Modify: `infrastructure/test-integration/skill-sync/skill-sync.test.ts:36-45` (Linguist INSERT)
- Modify: `infrastructure/test-integration/skill-sync/skill-sync.test.ts:48-65` (MIND INSERT)

- [ ] **Step 1: Update Linguist fixture to include interpreters for JavaScript**

In `infrastructure/test-integration/skill-sync/skill-sync.test.ts`, in the `seedFixtures` function, change the Linguist INSERT. JavaScript and TypeScript get interpreters; others stay empty:

```typescript
    await conn.execute(
      `INSERT INTO "linguist_languages" ("linguist_name", "linguist_type", "color", "aliases", "extensions", "interpreters", "linguist_version", "created_at", "updated_at")
       VALUES
         ('JavaScript', 'programming', '#f1e05a', '["JS"]', '[]', '["node", "nodejs"]', 'v1', ?, ?),
         ('TypeScript', 'programming', '#3178c6', '["TS"]', '[]', '["ts-node"]', 'v1', ?, ?),
         ('HTML', 'markup', '#e34c26', '[]', '[]', '[]', 'v1', ?, ?),
         ('JSON', 'data', '#292929', '[]', '[]', '[]', 'v1', ?, ?)`,
      [now, now, now, now, now, now, now, now],
      'run'
    );
```

- [ ] **Step 2: Update MIND fixture to include runtime_environments for JavaScript**

In the same `seedFixtures` function, the MIND INSERT uses a `mindDefaults` constant for all JSONB array columns. The last column in that defaults string corresponds to `runtime_environments`. Instead of using `mindDefaults` for JavaScript, provide explicit values. Change the JavaScript row so that `runtime_environments` is `'["Node.js", "Deno", "Bun"]'` instead of `'[]'`.

Replace the MIND INSERT block:

```typescript
    // -- MIND skills (7 rows) --
    // All JSONB array columns except runtime_environments
    const mindCols = `"mind_name", "mind_type", "synonyms", "mind_source_file", "mind_version",
         "technical_domains", "implies_knowing_skills", "implies_knowing_concepts", "conceptual_aspects",
         "architectural_patterns", "supported_programming_languages", "specific_to_frameworks",
         "adapter_for_tool_or_service", "implements_patterns", "associated_to_application_domains",
         "solves_application_tasks", "build_tools", "runtime_environments"`;
    const emptyArrays = `'[]', '[]', '[]', '[]', '[]', '[]', '[]', '[]', '[]', '[]', '[]', '[]'`;
    await conn.execute(
      `INSERT INTO "mind_skills" (${mindCols})
       VALUES
         ('JavaScript', '["ProgrammingLanguage"]', '["JS"]', 'programming_languages', 'v1', ${emptyArrays}, '["Node.js", "Deno", "Bun"]'),
         ('React', '["Framework"]', '["React.js", "ReactJS"]', 'frameworks_frontend', 'v1', ${emptyArrays}, '[]'),
         ('PostgreSQL', '["Database"]', '["Postgres"]', 'databases', 'v1', ${emptyArrays}, '[]'),
         ('Docker', '["Tool"]', '[]', 'containerization', 'v1', ${emptyArrays}, '[]'),
         ('TensorFlow', '["Library"]', '["TF"]', 'machine_learning', 'v1', ${emptyArrays}, '[]'),
         ('ExoticThing', '["Tool"]', '[]', 'exotic_things', 'v1', ${emptyArrays}, '[]'),
         ('GraphQL', '["QueryLanguage"]', '["GQL"]', 'query_languages', 'v1', ${emptyArrays}, '[]')`,
      [],
      'run'
    );
```

- [ ] **Step 3: Run existing tests to confirm fixtures don't break anything**

Run: `bun run --cwd infrastructure test:integration --test-name-pattern "SkillSyncService"`

Expected: All 8 existing tests pass. The fixture changes are additive — runtimes and interpreters were previously empty arrays, now they carry data, but nothing reads them yet.

- [ ] **Step 4: Commit**

```bash
git add infrastructure/test-integration/skill-sync/skill-sync.test.ts
git commit -m "test: add runtime_environments and interpreters to skill-sync fixtures"
```

---

### Task 2: Write failing tests for runtime extraction and interpreter cross-referencing

**Files:**
- Modify: `infrastructure/test-integration/skill-sync/skill-sync.test.ts`

- [ ] **Step 1: Write test — runtimes are extracted as standalone skills**

Add after the existing `it('does not touch experience_skills table', ...)` test:

```typescript
  it('extracts MIND runtimes as standalone skills', async () => {
    await seedFixtures();
    await runSync();

    const skills = await querySkills();

    const nodejs = skills.find(s => s.normalized_label === 'node-js')!;
    expect(nodejs).toBeDefined();
    expect(nodejs.label).toBe('Node.js');
    expect(nodejs.type).toBe('technology');

    const deno = skills.find(s => s.normalized_label === 'deno')!;
    expect(deno).toBeDefined();
    expect(deno.label).toBe('Deno');
    expect(deno.type).toBe('technology');

    const bun = skills.find(s => s.normalized_label === 'bun')!;
    expect(bun).toBeDefined();
    expect(bun.label).toBe('Bun');
    expect(bun.type).toBe('technology');
  }, 60_000);
```

- [ ] **Step 2: Write test — runtimes get the Backend category**

```typescript
  it('assigns Backend category to extracted runtimes', async () => {
    await seedFixtures();
    await runSync();

    const skills = await querySkills();
    const categories = await queryCategories();
    const categoryById = new Map(categories.map(c => [c.id, c.label]));

    const getCategoryLabel = (skill: { category_id: string | null }) =>
      skill.category_id ? categoryById.get(skill.category_id) : null;

    const nodejs = skills.find(s => s.normalized_label === 'node-js')!;
    expect(getCategoryLabel(nodejs)).toBe('Backend');

    const deno = skills.find(s => s.normalized_label === 'deno')!;
    expect(getCategoryLabel(deno)).toBe('Backend');
  }, 60_000);
```

- [ ] **Step 3: Write test — Linguist interpreters are cross-referenced as runtime aliases**

```typescript
  it('cross-references Linguist interpreters as runtime aliases', async () => {
    await seedFixtures();
    await runSync();

    const skills = await querySkills();
    const nodejs = skills.find(s => s.normalized_label === 'node-js')!;

    const aliases = typeof nodejs.aliases === 'string' ? JSON.parse(nodejs.aliases) : nodejs.aliases;
    const aliasLabels: string[] = aliases.map((a: { label: string }) => a.label);

    // "nodejs" and "node" from Linguist interpreters matched to Node.js
    expect(aliasLabels).toContain('nodejs');
    expect(aliasLabels).toContain('node');

    // Deno should NOT get JavaScript's interpreters (no fuzzy match)
    const deno = skills.find(s => s.normalized_label === 'deno')!;
    const denoAliases = typeof deno.aliases === 'string' ? JSON.parse(deno.aliases) : deno.aliases;
    expect(denoAliases.length).toBe(0);
  }, 60_000);
```

- [ ] **Step 4: Write test — ts-node does NOT match Node.js**

```typescript
  it('does not match unrelated interpreters to runtimes', async () => {
    await seedFixtures();
    await runSync();

    const skills = await querySkills();
    const nodejs = skills.find(s => s.normalized_label === 'node-js')!;

    const aliases = typeof nodejs.aliases === 'string' ? JSON.parse(nodejs.aliases) : nodejs.aliases;
    const aliasLabels: string[] = aliases.map((a: { label: string }) => a.label);

    // ts-node is a TypeScript interpreter, not a match for Node.js
    expect(aliasLabels).not.toContain('ts-node');
  }, 60_000);
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `bun run --cwd infrastructure test:integration --test-name-pattern "extracts MIND runtimes"`

Expected: FAIL — `nodejs` is undefined because `readMindRuntimes()` doesn't exist yet.

- [ ] **Step 6: Commit**

```bash
git add infrastructure/test-integration/skill-sync/skill-sync.test.ts
git commit -m "test: add failing tests for runtime extraction and interpreter cross-referencing"
```

---

### Task 3: Implement `readMindRuntimes()` in SkillSyncService

**Files:**
- Modify: `infrastructure/src/skill-sync/SkillSyncService.ts`

- [ ] **Step 1: Add `readMindRuntimes()` method**

Add after the existing `readMindSkills()` method (after line 209):

```typescript
  private async readMindRuntimes(): Promise<CandidateSkill[]> {
    const rows = await this.connection.execute(
      `SELECT "mind_name", "runtime_environments" FROM "mind_skills" WHERE "runtime_environments" != '[]'`,
      [],
      'all'
    );

    const byNormalizedLabel = new Map<string, CandidateSkill>();

    for (const row of rows as { mind_name: string; runtime_environments: string[] | string }[]) {
      const runtimes: string[] =
        typeof row.runtime_environments === 'string'
          ? JSON.parse(row.runtime_environments)
          : row.runtime_environments;

      for (const runtime of runtimes) {
        const normalizedLabel = normalizeLabel(runtime);
        if (!byNormalizedLabel.has(normalizedLabel)) {
          byNormalizedLabel.set(normalizedLabel, {
            label: runtime,
            normalizedLabel,
            type: SkillType.TECHNOLOGY,
            categoryNormalizedLabel: 'backend',
            description: null,
            aliases: [],
            sourcePriority: 2
          });
        }
      }
    }

    return [...byNormalizedLabel.values()];
  }
```

- [ ] **Step 2: Wire `readMindRuntimes()` into `sync()`**

In the `sync()` method, after the existing `readMindSkills()` call (line 94-95), add:

```typescript
    const runtimes = await this.readMindRuntimes();
    this.log.info(`MIND runtimes: ${runtimes.length} candidates`);
```

Update the `allCandidates` line (line 98) to include runtimes:

```typescript
    const allCandidates = [...linguist, ...mind, ...runtimes];
```

- [ ] **Step 3: Run the runtime extraction test**

Run: `bun run --cwd infrastructure test:integration --test-name-pattern "extracts MIND runtimes"`

Expected: PASS — Node.js, Deno, Bun now appear as standalone skills.

Also run: `bun run --cwd infrastructure test:integration --test-name-pattern "assigns Backend category to extracted runtimes"`

Expected: PASS.

- [ ] **Step 4: Run all existing tests to check for regressions**

Run: `bun run --cwd infrastructure test:integration --test-name-pattern "SkillSyncService"`

Expected: All pass. The new runtimes are additive — they don't collide with any existing skills.

- [ ] **Step 5: Commit**

```bash
git add infrastructure/src/skill-sync/SkillSyncService.ts
git commit -m "feat: extract MIND runtime_environments as standalone skills"
```

---

### Task 4: Implement `crossReferenceInterpreters()` in SkillSyncService

**Files:**
- Modify: `infrastructure/src/skill-sync/SkillSyncService.ts`

- [ ] **Step 1: Add helper to strip non-alphanumeric characters**

Add at the top of the file, after the existing imports and before `BATCH_SIZE`:

```typescript
function alphanumericKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
```

- [ ] **Step 2: Add `crossReferenceInterpreters()` method**

Add after `readMindRuntimes()`:

```typescript
  /**
   * Joins Linguist interpreters to MIND runtimes through the parent language.
   *
   * For each MIND language that has runtimes, look up the same language in Linguist
   * and get its interpreters. For each runtime, check if any interpreter fuzzy-matches
   * the runtime name (by stripping non-alphanumeric chars and checking prefix containment).
   * Matched interpreters are added as aliases on the runtime CandidateSkill.
   */
  private async crossReferenceInterpreters(runtimes: CandidateSkill[]): Promise<void> {
    // 1. Build runtime lookup: normalizedLabel → CandidateSkill
    const runtimeByNormalized = new Map(runtimes.map(r => [r.normalizedLabel, r]));

    // 2. Read MIND language → runtimes mapping
    const mindRows = await this.connection.execute(
      `SELECT "mind_name", "runtime_environments" FROM "mind_skills" WHERE "runtime_environments" != '[]'`,
      [],
      'all'
    );

    // 3. Read Linguist language → interpreters mapping
    const linguistRows = await this.connection.execute(
      `SELECT "linguist_name", "interpreters" FROM "linguist_languages" WHERE "interpreters" != '[]'`,
      [],
      'all'
    );
    const interpretersByLanguage = new Map<string, string[]>();
    for (const row of linguistRows as { linguist_name: string; interpreters: string[] | string }[]) {
      const interpreters = typeof row.interpreters === 'string' ? JSON.parse(row.interpreters) : row.interpreters;
      interpretersByLanguage.set(row.linguist_name, interpreters);
    }

    // 4. Cross-reference through parent language name
    for (const row of mindRows as { mind_name: string; runtime_environments: string[] | string }[]) {
      const runtimeNames: string[] =
        typeof row.runtime_environments === 'string'
          ? JSON.parse(row.runtime_environments)
          : row.runtime_environments;

      const interpreters = interpretersByLanguage.get(row.mind_name);
      if (!interpreters || interpreters.length === 0) continue;

      for (const runtimeName of runtimeNames) {
        const runtime = runtimeByNormalized.get(normalizeLabel(runtimeName));
        if (!runtime) continue;

        const runtimeKey = alphanumericKey(runtimeName);

        for (const interpreter of interpreters) {
          const interpKey = alphanumericKey(interpreter);
          if (runtimeKey.startsWith(interpKey) || interpKey.startsWith(runtimeKey)) {
            const normalizedInterp = normalizeLabel(interpreter);
            if (
              normalizedInterp !== runtime.normalizedLabel &&
              !runtime.aliases.some(a => a.normalizedLabel === normalizedInterp)
            ) {
              runtime.aliases.push({ label: interpreter, normalizedLabel: normalizedInterp });
            }
          }
        }
      }
    }
  }
```

- [ ] **Step 3: Wire `crossReferenceInterpreters()` into `sync()`**

In the `sync()` method, after the `readMindRuntimes()` call and its log line, add:

```typescript
    await this.crossReferenceInterpreters(runtimes);
    this.log.info('Interpreter cross-reference complete');
```

- [ ] **Step 4: Run the cross-referencing tests**

Run: `bun run --cwd infrastructure test:integration --test-name-pattern "cross-references Linguist interpreters"`

Expected: PASS — Node.js has aliases "nodejs" and "node".

Run: `bun run --cwd infrastructure test:integration --test-name-pattern "does not match unrelated interpreters"`

Expected: PASS — "ts-node" does NOT appear in Node.js aliases.

- [ ] **Step 5: Run all tests**

Run: `bun run --cwd infrastructure test:integration --test-name-pattern "SkillSyncService"`

Expected: All 12 tests pass (8 existing + 4 new).

- [ ] **Step 6: Commit**

```bash
git add infrastructure/src/skill-sync/SkillSyncService.ts
git commit -m "feat: cross-reference Linguist interpreters as runtime aliases"
```

---

### Task 5: Final verification

**Files:** None (read-only checks)

- [ ] **Step 1: Run typecheck**

Run: `bun run typecheck`

Expected: No errors.

- [ ] **Step 2: Run lint/format check**

Run: `bun run check`

Expected: No errors. If formatting issues, run `bun run check:fix` and commit.

- [ ] **Step 3: Run full integration test suite**

Run: `bun run --cwd infrastructure test:integration`

Expected: All tests pass (skill-sync + any other integration tests).

- [ ] **Step 4: Run unit tests**

Run: `bun run test`

Expected: All pass.

- [ ] **Step 5: Run dead code check**

Run: `bun run knip`

Expected: No new unused exports.

- [ ] **Step 6: Run dependency boundary check**

Run: `bun run dep:check`

Expected: No violations.
