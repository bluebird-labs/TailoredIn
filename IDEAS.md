# Ideas
> A list of potential ideas to dive into

## Job boards of interest

For VP/Head of Engineering roles specifically, the signal-to-noise ratio matters a lot. Here's how I'd tier it:
High signal, leadership-focused

- Lenny's Job Board (lennysjobboard.com) — product & eng leadership at Series B+ startups, well-curated
- Levels.fyi Jobs — skews technical/senior, good comp transparency
- Wellfound (formerly AngelList Talent) — startup-focused, you can filter by stage and role level, decent for Series A–C
- Work at a Startup (by YC) — YC portfolio companies, very startup-dense

**Executive/leadership-specific**

- Exec Thread — engineering and product leadership community, has a job board, but more valuable for the network
- Chief / Pavilion — more GTM/executive-skewed, but engineering leaders do show up
- On Deck — has a job board and network, though it's quieted down from its peak

**Recruiter-driven (worth being findable)**

- Riviera Partners — probably the most recognized firm specifically for engineering leadership
- Hirewell, Heidrick & Struggles, Spencer Stuart — for later-stage / larger companies
- Being findable on LinkedIn still matters even if you don't job-hunt there, since most executive recruiters lead there

**Communities worth being in**

- Rands Leadership Slack — eng leadership community, occasional opps shared
- CTO Craft — more CTO-oriented but overlaps with VP/Head roles

Given you're targeting Series B+ and your background is platform/infrastructure, Wellfound and Lenny's are probably the best bang-for-buck alongside direct outreach to companies you're tracking. The real alpha at your level tends to be warm intros through your network anyway — job boards surface maybe 20% of what actually gets filled at VP level.

## Static Analysis Hardening

> Goal: make AI-authored changes fail fast in CI before they accumulate as drift.
> Current baseline: Biome (all error), dependency-cruiser, CodeQL, Dependabot, Bun tests + coverage, DB integration tests (Testcontainers), `tsc --strict`.

### To Add

#### Knip
Dead code, unused exports, unused dependencies. The highest-leverage addition for AI drift —
orphaned exports, renamed-but-not-cleaned functions, and unused packages all surface here.
Run as a hard CI gate on every PR.
- https://knip.dev

#### Type Coverage (`type-coverage`)
`tsc --strict` does not guarantee zero `any`. This tool reports a coverage percentage and
enforces a minimum threshold (target: 99%). Catches `any` leakage through function parameters
and generic constraints that strict mode misses.
- https://github.com/plantain-00/type-coverage

#### Elysia OpenAPI Snapshot Diff
Elysia can emit an OpenAPI spec at build time. Commit the generated spec and add a CI step:
`git diff --exit-code docs/openapi.json`. Any unintentional breaking API change becomes a
visible failed step rather than a runtime surprise.

#### Sherif
Monorepo-level manifest linting: consistent `package.json` fields, no cross-workspace version
mismatches, no duplicate dependencies. Complements dependency-cruiser at the manifest level.
- https://github.com/nicolo-ribaudo/sherif

#### Size-Limit
Budget per web bundle chunk. Prevents AI from importing heavy libraries for trivial tasks
(e.g. full lodash for one utility). Makes bundle bloat a CI failure.
- https://github.com/ai/size-limit

#### `bun audit` in CI
Dependabot catches update PRs but doesn't block the build. `bun audit` on every CI run
catches known vulnerabilities in the current lockfile.

#### License Compliance (`licensee` or `license-checker`)
AI adds dependencies without checking licenses. Catches GPL/copyleft sneaking into the
codebase before it's a legal problem.

#### Mutation Testing (Stryker) — scheduled, not per-PR
Mutates source code and verifies tests catch the mutations. High setup cost, but exposes
tests that mirror implementation rather than assert behavior — a common AI pattern.
Run nightly or pre-merge on a schedule, not on every commit.
- https://stryker-mutator.io

#### Contract Tests (Pact) — deferred until API stabilizes
Consumer-driven contracts between `web/` and `api/`. Catches frontend/backend divergence
before integration tests do. Add once the API surface is stable.
- https://pact.io

---

### Priority Order

1. Knip
2. Type coverage threshold
3. Elysia OpenAPI snapshot diff
4. Sherif
5. Size-limit
6. `bun audit`
7. License compliance
8. Stryker (scheduled)
9. Pact (post-API stabilization)

## AI Code Review (CodeRabbit)

> Free tier covers unlimited public repositories. No GitHub Actions workflow needed —
> installs as a native GitHub App and runs on its own infrastructure.

### Setup

1. [coderabbit.ai](https://coderabbit.ai) → Login with GitHub
2. Install the GitHub App, select the repo
3. Add `.coderabbit.yaml` to the repo root (see below)
4. Open a PR — reviews happen automatically

### `.coderabbit.yaml`
```yaml
language: en-US
reviews:
  profile: assertive
  auto_review:
    enabled: true
    drafts: false
  path_filters:
    - "!**/node_modules/**"
    - "!**/*.lock"
    - "!dist/**"
  finishing_touches:
    docstrings:
      enabled: false

chat:
  auto_reply: true

instructions: |
  This is a TypeScript monorepo using Onion/DDD architecture.
  - Flag any import from domain/ in apps/web/ — only application/ DTOs should cross that boundary
  - Flag any 'any' type usage, even in generics or function parameters
  - Flag unused exports that Knip might have missed
  - Flag functions over 40 lines or cyclomatic complexity over 5
  - Flag direct DB queries outside of repository implementations in libs/
  - This is a solo project with heavy Claude Code usage — be skeptical of tests
    that mirror implementation rather than asserting behavior
```

### Notes

- CodeRabbit Pro is **free forever for public repos**
- `profile: assertive` = more thorough, less noise than the default
- The `instructions` field is plain English — update it as new patterns emerge
- Reviews count as "Comment", not "Approve" — does not block merges on its own;
  pair with branch protection rules requiring human approval to use it as a soft gate