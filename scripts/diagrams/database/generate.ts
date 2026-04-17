#!/usr/bin/env tsx
/**
 * Generates infrastructure/DATABASE.mmd — a Mermaid ERD from MikroORM entity decorators.
 *
 * Uses ts-morph AST to extract @Entity, @Property, @PrimaryKey, @ManyToOne, @OneToMany
 * decorators from domain entity source files. No running database required.
 *
 * Note: Tables that exist only as migrations (no entity class) will not appear
 * in the diagram. This reflects the entity-mapped schema that application code interacts with.
 *
 * Run: bun run db:diagram
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TsMorphProjectFactory } from '../shared/TsMorphProjectFactory.js';
import { DatabaseDiagramAssembler } from './DatabaseDiagramAssembler.js';
import { DatabaseExtractor } from './DatabaseExtractor.js';
import { DatabaseRelationshipInferrer } from './DatabaseRelationshipInferrer.js';

const ROOT = resolve(import.meta.dirname, '../../..');
const ENTITIES_DIR = resolve(ROOT, 'domain/src/entities');
const OUTPUT_PATH = resolve(ROOT, 'infrastructure/DATABASE.mmd');

const project = TsMorphProjectFactory.create(resolve(ROOT, 'domain/tsconfig.json'));
const { tables, foreignKeys } = DatabaseExtractor.extract(project, ENTITIES_DIR);
const analysis = DatabaseRelationshipInferrer.analyze(tables, foreignKeys);
const diagramOutput = DatabaseDiagramAssembler.assemble(tables, foreignKeys, analysis);
writeFileSync(OUTPUT_PATH, diagramOutput);

// biome-ignore lint/suspicious/noConsole: CLI script output
console.log(`Generated ${OUTPUT_PATH} (${tables.length} tables)`);
