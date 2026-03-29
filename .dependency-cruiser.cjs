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
        pathNot: '^infrastructure/src/db/entities/[^/]+/'
      }
    },

    // ── domain: no workspace deps except shared ───────────────────────
    {
      name: 'domain-no-workspace-deps',
      severity: 'error',
      comment: 'domain is the innermost ring: only shared utilities allowed, no application/infrastructure/presentation imports.',
      from: { path: '^domain/' },
      to: { path: '^(application|infrastructure|presentation)/' }
    },

    // ── application: only domain ──────────────────────────────────────
    {
      name: 'application-no-infra',
      severity: 'error',
      comment: 'application must not depend on infrastructure or presentation.',
      from: { path: '^application/' },
      to: { path: '^(infrastructure|presentation)/' }
    },

    // ── infrastructure: no presentation ───────────────────────────────
    {
      name: 'infrastructure-no-presentation',
      severity: 'error',
      comment: 'infrastructure must not depend on presentation.',
      from: { path: '^infrastructure/' },
      to: { path: '^presentation/' }
    },

    // ── presentation/api: must not depend on presentation/cli ─────────
    {
      name: 'api-not-depends-on-cli',
      severity: 'error',
      comment: 'api must not depend on cli.',
      from: { path: '^presentation/api/' },
      to: { path: '^presentation/cli/' }
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
