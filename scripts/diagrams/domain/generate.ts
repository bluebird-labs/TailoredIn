#!/usr/bin/env bun
/**
 * Generates domain/DOMAIN.mmd — a Mermaid class diagram of the domain model.
 *
 * Uses ts-morph AST for extraction. Fully code-driven: no hardcoded object names.
 *   - **Inclusion** is determined by the barrel (`domain/src/index.ts`).
 *   - **Subdomain grouping** is inferred from foreign-key properties.
 *   - **Enum/type placement** follows their referencing entities.
 *
 * Run: bun run domain:diagram
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BarrelResolver } from '../shared/BarrelResolver.js';
import { TsMorphProjectFactory } from '../shared/TsMorphProjectFactory.js';
import { DomainDiagramAssembler } from './DomainDiagramAssembler.js';
import { DomainExtractor } from './DomainExtractor.js';

const ROOT = resolve(import.meta.dirname, '../../..');
const DOMAIN_SRC = resolve(ROOT, 'domain/src');
const BARREL_PATH = resolve(DOMAIN_SRC, 'index.ts');
const OUTPUT_PATH = resolve(ROOT, 'domain/DOMAIN.mmd');

const project = TsMorphProjectFactory.create(resolve(ROOT, 'domain/tsconfig.json'));

const barrelExports = BarrelResolver.resolveExportedNames(project, BARREL_PATH, {
  ignoreSuffixes: ['Id', 'Repository', 'CreateProps'],
  ignoreExact: new Set(['AggregateRoot', 'Entity', 'ValueObject', 'DomainEvent', 'Result', 'ok', 'err'])
});

const allItems = DomainExtractor.extract(project, DOMAIN_SRC, barrelExports);
const diagramOutput = DomainDiagramAssembler.assemble(allItems);
writeFileSync(OUTPUT_PATH, diagramOutput);

const counts = { aggregates: 0, entities: 0, valueObjects: 0, enums: 0, services: 0, events: 0, types: 0 };
for (const item of allItems.values()) {
  if (item.stereotype === 'AggregateRoot') counts.aggregates++;
  else if (item.stereotype === 'Entity') counts.entities++;
  else if (item.stereotype === 'ValueObject') counts.valueObjects++;
  else if (item.stereotype === 'enumeration') counts.enums++;
  else if (item.stereotype === 'DomainService') counts.services++;
  else if (item.stereotype === 'DomainEvent') counts.events++;
  else if (item.stereotype === 'type') counts.types++;
}

// biome-ignore lint/suspicious/noConsole: CLI script output
console.log(`Generated ${OUTPUT_PATH}`);
// biome-ignore lint/suspicious/noConsole: CLI script output
console.log(
  `  ${counts.aggregates} aggregates, ${counts.entities} entities, ${counts.valueObjects} value objects, ` +
    `${counts.enums} enums, ${counts.types} types, ${counts.services} services, ${counts.events} events`
);
