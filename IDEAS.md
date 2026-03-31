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

## ~~Static Analysis Hardening~~ — Done / Rejected

> Current CI: Biome, dependency-cruiser, Knip, `tsc --strict`, Bun tests + coverage, DB integration tests (Testcontainers), CodeRabbit, Gitleaks.

- [x] **Knip** — Added as CI gate. Catches dead code, unused exports/deps.
- [x] **CodeRabbit** — Installed as GitHub App with `.coderabbit.yaml`.
- [ ] **Type Coverage** — Revisit when `any` leakage becomes a real problem. Biome's `noExplicitAny: error` covers most cases.
- [ ] **Elysia OpenAPI Snapshot** — Revisit when API surface stabilizes (post-M6B).
- [x] ~~Sherif~~ — Rejected. Dependency-cruiser already covers architectural boundaries. Manifest cosmetics not worth a gate for a solo project.
- [x] ~~`bun audit`~~ — Rejected. Dependabot already covers this.
- [x] ~~Size-Limit~~ — Rejected. Premature for current bundle size.
- [x] ~~License Compliance~~ — Rejected. Solo project, not distributing.
- [ ] **Stryker** — Revisit when test suite is larger. High setup cost for current coverage.
- [ ] **Pact** — Deferred until API stabilizes.