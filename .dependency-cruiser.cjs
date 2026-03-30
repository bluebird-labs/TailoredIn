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
      comment: 'domain is the innermost ring: only shared utilities allowed, no application/infrastructure/api/cli/web imports.',
      from: { path: '^domain/' },
      to: { path: '^(application|infrastructure|api|cli|web)/' }
    },

    // ── application: only domain ──────────────────────────────────────
    {
      name: 'application-no-infra',
      severity: 'error',
      comment: 'application must not depend on infrastructure, api, cli, or web.',
      from: { path: '^application/' },
      to: { path: '^(infrastructure|api|cli|web)/' }
    },

    // ── infrastructure: no api/cli/web ───────────────────────────────
    {
      name: 'infrastructure-no-entrypoints',
      severity: 'error',
      comment: 'infrastructure must not depend on api, cli, or web.',
      from: { path: '^infrastructure/' },
      to: { path: '^(api|cli|web)/' }
    },

    // ── api: must not depend on cli ──────────────────────────────────
    {
      name: 'api-not-depends-on-cli',
      severity: 'error',
      comment: 'api must not depend on cli.',
      from: { path: '^api/' },
      to: { path: '^cli/' }
    },

    // ── web: no infrastructure (use Eden Treaty) ────────────────────
    {
      name: 'web-no-infrastructure',
      severity: 'error',
      comment: 'web must use Eden Treaty, not direct infrastructure access.',
      from: { path: '^web/' },
      to: { path: '^infrastructure/' }
    },

    // ── web ↔ cli: entry-point packages are isolated ────────────────
    {
      name: 'web-not-depends-on-cli',
      severity: 'error',
      comment: 'web must not depend on cli.',
      from: { path: '^web/' },
      to: { path: '^cli/' }
    },
    {
      name: 'cli-not-depends-on-web',
      severity: 'error',
      comment: 'cli must not depend on web.',
      from: { path: '^cli/' },
      to: { path: '^web/' }
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
