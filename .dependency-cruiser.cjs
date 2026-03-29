/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ── No circular dependencies anywhere ─────────────────────────────
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies are forbidden across the entire monorepo. Exception: MikroORM bidirectional entity relationships within the same entity group folder are unavoidable with the ORM pattern.',
      from: {},
      to: {
        circular: true,
        pathNot: '^libs/db/src/entities/[^/]+/'
      }
    },

    // ── Libs must never depend on apps ────────────────────────────────
    {
      name: 'libs-not-depend-on-apps',
      severity: 'error',
      comment: 'Library packages must never import from app packages.',
      from: { path: '^libs/' },
      to: { path: '^apps/' }
    },

    // ── shared: no workspace deps ─────────────────────────────────────
    {
      name: 'shared-no-workspace-deps',
      severity: 'error',
      comment: 'shared is the foundation layer and must not depend on any other @tailoredin package.',
      from: { path: '^libs/shared/' },
      to: { path: '^(apps|libs/(db|ai|linkedin))/' }
    },

    // ── db: only shared ───────────────────────────────────────────────
    {
      name: 'db-only-depends-on-shared',
      severity: 'error',
      comment: 'db must not depend on ai, linkedin, or any app.',
      from: { path: '^libs/db/' },
      to: { path: '^(apps|libs/(ai|linkedin))/' }
    },

    // ── ai: only db + shared ──────────────────────────────────────────
    {
      name: 'ai-only-depends-on-db-shared',
      severity: 'error',
      comment: 'ai must not depend on linkedin or any app.',
      from: { path: '^libs/ai/' },
      to: { path: '^(apps|libs/linkedin)/' }
    },

    // ── linkedin: only db + shared ────────────────────────────────────
    {
      name: 'linkedin-only-depends-on-db-shared',
      severity: 'error',
      comment: 'linkedin must not depend on ai or any app.',
      from: { path: '^libs/linkedin/' },
      to: { path: '^(apps|libs/ai)/' }
    },

    // ── resume: only ai + db + shared ─────────────────────────────────
    {
      name: 'resume-only-depends-on-ai-db-shared',
      severity: 'error',
      comment: 'resume must not depend on linkedin, robot, or any app.',
      from: { path: '^libs/resume/' },
      to: { path: '^(apps/|libs/(linkedin|robot)/)' }
    },

    // ── robot lib: only db + shared ───────────────────────────────────
    {
      name: 'robot-lib-only-depends-on-db-shared',
      severity: 'error',
      comment: 'robot lib must not depend on linkedin, ai, resume, or any app.',
      from: { path: '^libs/robot/' },
      to: { path: '^(apps/|libs/(linkedin|ai|resume)/)' }
    },

    // ── api: only ai + db + resume + shared ───────────────────────────
    {
      name: 'api-not-depends-on-cli-linkedin',
      severity: 'error',
      comment: 'api must not depend on cli or linkedin.',
      from: { path: '^apps/api/' },
      to: { path: '^(apps/cli|libs/linkedin)/' }
    },

    // ── cli: may depend on all libs but not api ───────────────────────
    {
      name: 'cli-not-depends-on-api',
      severity: 'error',
      comment: 'cli must not depend on the api app.',
      from: { path: '^apps/cli/' },
      to: { path: '^apps/api/' }
    }
  ],

  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    exclude: {
      path: [
        'node_modules',
        '\\.d\\.ts$',
        'dist/',
        'build/',
        '\\.sql\\.ts$',
        'migrations/'
      ]
    },
    tsConfig: {
      fileName: 'tsconfig.base.json'
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json']
    }
  }
};
