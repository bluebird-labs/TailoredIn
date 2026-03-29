/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ── No circular dependencies anywhere ─────────────────────────────
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies are forbidden across the entire monorepo.',
      from: {},
      to: {
        circular: true,
        pathNot: '^apps/api/src/infrastructure/db/entities/[^/]+/'
      }
    },

    // ── domain/shared: no workspace deps ──────────────────────────────
    {
      name: 'domain-shared-no-workspace-deps',
      severity: 'error',
      comment: 'domain/shared is the foundation layer: no @tailoredin imports allowed.',
      from: { path: '^domain/shared/' },
      to: { path: '^(apps|domain/(job|resume)|application)/' }
    },

    // ── domain/job: only domain/shared ────────────────────────────────
    {
      name: 'domain-job-only-domain-shared',
      severity: 'error',
      comment: 'domain/job must only depend on domain/shared — no infrastructure or application imports.',
      from: { path: '^domain/job/' },
      to: { path: '^(apps|application|domain/resume)/' }
    },

    // ── domain/resume: only domain/shared + domain/job ────────────────
    {
      name: 'domain-resume-only-domain-layers',
      severity: 'error',
      comment: 'domain/resume must only depend on domain packages — no infrastructure or application imports.',
      from: { path: '^domain/resume/' },
      to: { path: '^(apps|application)/' }
    },

    // ── application/job: no infrastructure or apps ────────────────────
    {
      name: 'application-job-no-infra',
      severity: 'error',
      comment: 'application/job must not depend on any infrastructure or app packages.',
      from: { path: '^application/job/' },
      to: { path: '^(apps|application/resume)/' }
    },

    // ── application/resume: no infrastructure or apps ─────────────────
    {
      name: 'application-resume-no-infra',
      severity: 'error',
      comment: 'application/resume must not depend on any infrastructure or app packages.',
      from: { path: '^application/resume/' },
      to: { path: '^apps/' }
    },

    // ── apps/api: must not depend on apps/cli ─────────────────────────
    {
      name: 'api-not-depends-on-cli',
      severity: 'error',
      comment: 'api must not depend on cli.',
      from: { path: '^apps/api/' },
      to: { path: '^apps/cli/' }
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
