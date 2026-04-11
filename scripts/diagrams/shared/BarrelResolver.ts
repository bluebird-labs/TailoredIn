/**
 * Resolves barrel exports using ts-morph AST, replacing regex-based parsing.
 *
 * Supports:
 * - Single-level barrels (domain): `export { X } from '...'`
 * - Two-level barrels (application): star re-exports → sub-barrel named exports
 */
import { dirname, resolve } from 'node:path';
import type { Project, SourceFile } from 'ts-morph';
import type { AppCategory, BarrelEntry } from './types.js';

type BarrelFilter = {
  ignoreSuffixes: string[];
  ignoreExact: Set<string>;
};

export namespace BarrelResolver {
  /**
   * Single-level: collect all named export symbols from a barrel file.
   * Used by the domain generator.
   */
  export function resolveExportedNames(project: Project, barrelPath: string, filter: BarrelFilter): Set<string> {
    const sourceFile = project.getSourceFile(resolve(barrelPath));
    if (!sourceFile) return new Set();

    const names = new Set<string>();

    for (const exportDecl of sourceFile.getExportDeclarations()) {
      for (const namedExport of exportDecl.getNamedExports()) {
        const name = namedExport.getAliasNode()?.getText() ?? namedExport.getName();
        names.add(name);
      }
    }

    // Apply filters
    const filtered = new Set<string>();
    for (const name of names) {
      if (filter.ignoreExact.has(name)) continue;
      if (filter.ignoreSuffixes.some(s => name.endsWith(s))) continue;
      filtered.add(name);
    }

    return filtered;
  }

  /**
   * Two-level: resolve star re-exports to sub-barrels, then collect named exports.
   * Used by the application generator.
   */
  export function resolveTwoLevelEntries(
    project: Project,
    barrelPath: string,
    categories: readonly AppCategory[]
  ): BarrelEntry[] {
    const sourceFile = project.getSourceFile(resolve(barrelPath));
    if (!sourceFile) return [];

    const entries: BarrelEntry[] = [];
    const categorySet = new Set<string>(categories);

    for (const exportDecl of sourceFile.getExportDeclarations()) {
      // Only process star re-exports (export * from './use-cases/index.js')
      if (!exportDecl.isNamespaceExport()) continue;

      const moduleSpecifier = exportDecl.getModuleSpecifierValue();
      if (!moduleSpecifier) continue;

      // Determine category from the path (e.g., './use-cases/index.js' → 'use-cases')
      const dir = moduleSpecifier.replace(/^\.\//, '').split('/')[0];
      if (!categorySet.has(dir)) continue;

      const category = dir as AppCategory;
      const subBarrelFile = exportDecl.getModuleSpecifierSourceFile();

      if (subBarrelFile) {
        entries.push(...parseSubBarrel(subBarrelFile, category));
      }
    }

    return entries;
  }

  function parseSubBarrel(subBarrelFile: SourceFile, category: AppCategory): BarrelEntry[] {
    const entries: BarrelEntry[] = [];
    const subBarrelDir = dirname(subBarrelFile.getFilePath());

    for (const exportDecl of subBarrelFile.getExportDeclarations()) {
      const moduleSpecifier = exportDecl.getModuleSpecifierValue();
      if (!moduleSpecifier) continue;

      // Resolve source file path
      const resolvedSourceFile = exportDecl.getModuleSpecifierSourceFile();
      const sourceFilePath =
        resolvedSourceFile?.getFilePath() ?? resolve(subBarrelDir, moduleSpecifier.replace(/\.js$/, '.ts'));

      // Infer domain from subdirectory (use-cases only)
      let domain: string | null = null;
      if (category === 'use-cases') {
        const relPath = moduleSpecifier.replace(/^\.\//, '');
        const parts = relPath.split('/');
        domain = parts.length > 1 ? parts[0] : 'profile';
      }

      for (const namedExport of exportDecl.getNamedExports()) {
        const name = namedExport.getAliasNode()?.getText() ?? namedExport.getName();

        // Skip lowercase names (mapper functions like toCompanyDto)
        if (/^[a-z]/.test(name)) continue;
        // Skip Input types (auxiliary)
        if (name.endsWith('Input')) continue;

        entries.push({
          exportedName: name,
          sourceFile: sourceFilePath,
          category,
          domain
        });
      }
    }

    return entries;
  }
}
