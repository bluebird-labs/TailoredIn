/**
 * Creates ts-morph Project instances scoped to a specific package's tsconfig.
 */
import { resolve } from 'node:path';
import { Project } from 'ts-morph';

export namespace TsMorphProjectFactory {
  export function create(tsconfigPath: string): Project {
    return new Project({
      tsConfigFilePath: resolve(tsconfigPath),
      skipAddingFilesFromTsConfig: false
    });
  }
}
