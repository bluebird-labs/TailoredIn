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
      comment: 'domain is the innermost ring: only shared utilities allowed, no application/infrastructure/api/web imports.',
      from: { path: '^domain/' },
      to: { path: '^(application|infrastructure|api|web)/' }
    },

    // ── application: only domain ──────────────────────────────────────
    {
      name: 'application-no-infra',
      severity: 'error',
      comment: 'application must not depend on infrastructure, api, or web.',
      from: { path: '^application/' },
      to: { path: '^(infrastructure|api|web)/' }
    },

    // ── infrastructure: no api/cli/web ───────────────────────────────
    {
      name: 'infrastructure-no-entrypoints',
      severity: 'error',
      comment: 'infrastructure must not depend on api or web.',
      from: { path: '^infrastructure/', pathNot: '^infrastructure/dev/e2e-' },
      to: { path: '^(api|web)/' }
    },

    // ── web: only public subpath exports ─────────────────────────────
    {
      name: 'web-only-api-client',
      severity: 'error',
      comment: 'web may only import from @tailoredin/api/client, not the full api barrel.',
      from: { path: '^web/' },
      to: { path: '^api/src/', pathNot: '^api/src/client\\.ts$' }
    },
    {
      name: 'web-no-domain',
      severity: 'error',
      comment: 'web must not depend on domain directly. Use @tailoredin/api/client to re-export what web needs.',
      from: { path: '^web/' },
      to: { path: '^domain/' }
    },
    {
      name: 'web-no-infrastructure',
      severity: 'error',
      comment: 'web must not depend on infrastructure.',
      from: { path: '^web/' },
      to: { path: '^infrastructure/' }
    },
    {
      name: 'web-no-application',
      severity: 'error',
      comment: 'web must not depend on application.',
      from: { path: '^web/' },
      to: { path: '^application/' }
    },
    {
      name: 'web-no-core',
      severity: 'error',
      comment: 'web must not depend on core.',
      from: { path: '^web/' },
      to: { path: '^core/' }
    },

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
