/**
 * Dependency-cruiser configuration.
 * Belt-and-suspenders enforcement of the Clean Architecture dependency rule
 * (already enforced at lint-time by eslint-plugin-boundaries; this catches
 * dynamic requires and is run separately in CI).
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies indicate broken layering or unclear ownership.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Orphan modules are usually dead code.',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',
          '\\.d\\.ts$',
          '(^|/)tsconfig\\.json$',
          '(^|/)(babel|webpack|vite|vitest|tsup|eslint|prettier|jest|.dependency-cruiser)\\.config\\.(js|cjs|mjs|ts|json)$',
        ],
      },
      to: {},
    },
    {
      name: 'no-deprecated-core',
      severity: 'warn',
      from: {},
      to: { dependencyTypes: ['deprecated'] },
    },
    {
      name: 'no-non-package-json',
      severity: 'error',
      comment: 'Every external import must be declared in package.json.',
      from: {},
      to: { dependencyTypes: ['npm-no-pkg', 'npm-unknown'] },
    },

    {
      name: 'domain-no-outward-deps',
      severity: 'error',
      comment: 'Domain layer must not depend on any other layer.',
      from: { path: '^src/domain' },
      to: {
        path: '^src/(application|infrastructure|interfaces|main)',
      },
    },
    {
      name: 'application-only-domain',
      severity: 'error',
      comment: 'Application layer may only depend on domain.',
      from: { path: '^src/application' },
      to: {
        path: '^src/(infrastructure|interfaces|main)',
      },
    },
    {
      name: 'interfaces-no-infra',
      severity: 'error',
      comment: 'Interface adapters must not reach into infrastructure.',
      from: { path: '^src/interfaces' },
      to: { path: '^src/(infrastructure|main)' },
    },
    {
      name: 'infrastructure-no-interfaces',
      severity: 'error',
      comment: 'Infrastructure must not depend on interface adapters.',
      from: { path: '^src/infrastructure' },
      to: { path: '^src/(interfaces|main)' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      mainFields: ['main', 'module', 'types'],
    },
    tsPreCompilationDeps: true,
    progress: { type: 'none' },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/(@[^/]+/[^/]+|[^/]+)',
      },
      archi: {
        collapsePattern: '^src/[^/]+',
      },
    },
  },
};
