# core/ — Cross-cutting Utilities

Package: `@tailoredin/core`

Pure TypeScript utilities with **no domain logic, no framework dependencies, no I/O**.

## What belongs here

- Stateless helper namespaces (no instances, no state)
- Type-level utilities
- Environment variable access
- Logging bootstrap

What does **not** belong here: domain concepts, database, HTTP, anything that imports from other TailoredIn packages.

## Naming convention

All utility modules use a `namespace` export with a `Util` suffix:

```typescript
export namespace StringUtil {
  export function capitalize(s: string): string { ... }
}
```

Single-responsibility modules: one concern per file.

## Environment access

Always use the typed helpers from `Environment.ts` — never access `process.env` directly outside this package:

```typescript
import { env, envInt, envBool, envOptional } from '@tailoredin/core';

const host = env('POSTGRES_HOST');          // throws if missing
const port = envInt('POSTGRES_PORT');       // parses as integer, throws if missing
const debug = envBool('DEBUG');             // parses as boolean
const key = envOptional('OPENAI_API_KEY');  // returns undefined if missing
```

These throw **at call time**, not at import time — no hidden side effects.

## Logging

```typescript
// In a class — derives prefix from class name (kebab-cased)
private readonly logger = Logger.create(this);

// In a standalone script or module without a class
const logger = Logger.create('my-script');
```

All prefixes are normalized to kebab-case automatically.

## Import rule

Always import from the barrel — never use deep subpath imports:

```typescript
// Correct
import { StringUtil, Logger, env } from '@tailoredin/core';

// Wrong — never do this
import { StringUtil } from '@tailoredin/core/src/StringUtil.js';
```

## Available utilities

| Module | Purpose |
|---|---|
| `Environment` | Typed `process.env` access (`env`, `envInt`, `envBool`, `envOptional`) |
| `Logger` | Structured logging with kebab-cased prefix |
| `ColorUtil` | Color manipulation |
| `EnumUtil` | Enum value/key helpers |
| `FsUtil` | File system helpers |
| `InspectUtil` | Object inspection/debugging |
| `NodeEnv` | Node environment detection (`isDev`, `isProd`) |
| `ObjectUtil` | Object manipulation |
| `StringUtil` | String helpers |
| `TimeUtil` | Date/time helpers |
| `TypeUtil` | TypeScript type utilities |
| `ZodUtil` | Zod schema helpers |

## Adding a new utility

1. Create `core/src/<Name>Util.ts` with a `namespace` export
2. Export it from `core/src/index.ts`
3. Add a unit test in `core/test/<Name>Util.test.ts`
