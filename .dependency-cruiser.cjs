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
        pathNot: '^(libs/infrastructure/src/db/entities/[^/]+/|libs/domain/src/entities/)'
      }
    },

    // ── domain: no workspace deps except shared ───────────────────────
    {
      name: 'domain-no-workspace-deps',
      severity: 'error',
      comment:
        'domain is the innermost ring: only shared utilities allowed, no application/infrastructure/api/web imports.',
      from: { path: '^libs/domain/' },
      to: { path: '^(libs/application|libs/infrastructure|apps/api|apps/web)/' }
    },

    // ── application: only domain ──────────────────────────────────────
    {
      name: 'application-no-infra',
      severity: 'error',
      comment: 'application must not depend on infrastructure, api, or web.',
      from: { path: '^libs/application/' },
      to: { path: '^(libs/infrastructure|apps/api|apps/web)/' }
    },

    // ── infrastructure: no api/cli/web ───────────────────────────────
    {
      name: 'infrastructure-no-entrypoints',
      severity: 'error',
      comment: 'infrastructure must not depend on api or web.',
      from: { path: '^libs/infrastructure/', pathNot: '^libs/infrastructure/scripts/e2e-' },
      to: { path: '^(apps/api|apps/web)/' }
    },

    // ── web: only public subpath exports ─────────────────────────────
    {
      name: 'web-only-api-client',
      severity: 'error',
      comment: 'web may only import from @tailoredin/api/client, not the full api barrel.',
      from: { path: '^apps/web/' },
      to: { path: '^apps/api/src/', pathNot: '^apps/api/src/client\\.ts$' }
    },
    {
      name: 'web-no-domain',
      severity: 'error',
      comment: 'web must not depend on domain directly. Use @tailoredin/api/client to re-export what web needs.',
      from: { path: '^apps/web/' },
      to: { path: '^libs/domain/' }
    },
    {
      name: 'web-no-infrastructure',
      severity: 'error',
      comment: 'web must not depend on infrastructure.',
      from: { path: '^apps/web/' },
      to: { path: '^libs/infrastructure/' }
    },
    {
      name: 'web-no-application',
      severity: 'error',
      comment: 'web must not depend on application.',
      from: { path: '^apps/web/' },
      to: { path: '^libs/application/' }
    },
    {
      name: 'web-no-core',
      severity: 'error',
      comment: 'web must not depend on core.',
      from: { path: '^apps/web/' },
      to: { path: '^libs/core/' }
    }
  ],

  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    exclude: {
      path: ['node_modules', '\\.d\\.ts$', 'dist/', 'build/', '\\.sql\\.ts$', 'migrations/']
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
