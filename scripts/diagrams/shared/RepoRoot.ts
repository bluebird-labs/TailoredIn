/**
 * Resolves the repository root, independently of the caller's working directory.
 *
 * The root package.json declares no `"type": "module"`, so tsx loads these scripts as
 * CommonJS — where `import.meta.dirname` is undefined. `import.meta.url` is populated
 * under both module systems, so deriving the path from it works either way.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export namespace RepoRoot {
  /** Absolute path to the repository root. */
  export const PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
}
