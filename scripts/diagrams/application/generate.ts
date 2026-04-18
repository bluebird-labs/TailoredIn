#!/usr/bin/env tsx
/**
 * Generates application/APPLICATION.mmd — a Mermaid class diagram of the application layer.
 *
 * Uses ts-morph AST for extraction. Fully code-driven: no hardcoded object names.
 *   - **Inclusion** is determined by the barrel (`application/src/index.ts`)
 *     via two-level resolution (main barrel → sub-barrels → source files).
 *   - **Use-case grouping** is inferred from subdirectory structure under `use-cases/`.
 *   - **Domain port stubs** are auto-detected from use-case constructor dependencies
 *     that reference interfaces not defined in the application barrel.
 *
 * Run: bun run app:diagram
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BarrelResolver } from '../shared/BarrelResolver.js';
import { TsMorphProjectFactory } from '../shared/TsMorphProjectFactory.js';
import { ApplicationDiagramAssembler } from './ApplicationDiagramAssembler.js';
import { ApplicationExtractor } from './ApplicationExtractor.js';

const ROOT = resolve(import.meta.dirname, '../../..');
const BARREL_PATH = resolve(ROOT, 'libs/application/src/index.ts');
const OUTPUT_PATH = resolve(ROOT, 'libs/application/APPLICATION.mmd');

const project = TsMorphProjectFactory.create(resolve(ROOT, 'libs/application/tsconfig.json'));

const entries = BarrelResolver.resolveTwoLevelEntries(project, BARREL_PATH, ['use-cases', 'ports', 'dtos', 'errors']);

const allItems = ApplicationExtractor.extract(project, entries);
const diagramOutput = ApplicationDiagramAssembler.assemble(allItems);
writeFileSync(OUTPUT_PATH, diagramOutput);

const counts = { useCases: 0, ports: 0, dtos: 0, errors: 0, domainPorts: 0 };
for (const item of allItems.values()) {
  if (item.stereotype === 'UseCase') counts.useCases++;
  else if (item.stereotype === 'Port') counts.ports++;
  else if (item.stereotype === 'DTO') counts.dtos++;
  else if (item.stereotype === 'Error') counts.errors++;
  else if (item.stereotype === 'DomainPort') counts.domainPorts++;
}

// biome-ignore lint/suspicious/noConsole: CLI script output
console.log(`Generated ${OUTPUT_PATH}`);
// biome-ignore lint/suspicious/noConsole: CLI script output
console.log(
  `  ${counts.useCases} use cases, ${counts.ports} ports, ${counts.dtos} dtos, ` +
    `${counts.errors} errors, ${counts.domainPorts} domain ports`
);
