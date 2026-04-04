#!/usr/bin/env bun
/**
 * Generates domain/DOMAIN.mmd — a Mermaid class diagram of the domain model.
 * Scans domain/src/ TypeScript source files and infers aggregates, entities,
 * value objects, enums, domain services, and domain events from code patterns.
 *
 * Run: bun run domain:diagram
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

// ─── Configuration ─────────────────────────────────────��─────────────────────

const DOMAIN_SRC = resolve(import.meta.dirname, '../src');
const OUTPUT_PATH = resolve(import.meta.dirname, '../DOMAIN.mmd');

const SCAN_DIRS = ['entities', 'value-objects', 'domain-services', 'events'] as const;
type SourceDir = (typeof SCAN_DIRS)[number];

/** Classes/types to exclude entirely from the diagram. */
const EXCLUDED = new Set([
  'ResumeTemplate',
  'LayoutAnalysis',
  'BlockLayout',
  'SkillName',
  'ApprovalStatus',
  'GeneratedExperience',
  'TailoringScore'
]);

/** Properties to exclude (noise / boilerplate). */
const EXCLUDED_PROPS = new Set(['createdAt', 'updatedAt', 'eventName', 'occurredAt']);

/** Methods to exclude (factories / boilerplate). */
const EXCLUDED_METHODS = new Set(['create', 'empty', 'constructor']);

/**
 * Subdomain grouping — order determines output order.
 * Relationships are placed in the section of the FIRST class that appears.
 */
const SUBDOMAIN_GROUPS: [label: string, members: string[]][] = [
  [
    'Profile Subdomain',
    ['Profile', 'Experience', 'Accomplishment', 'Headline', 'Education', 'SkillCategory', 'SkillItem']
  ],
  ['Company Subdomain', ['Company', 'CompanyBrief']],
  ['Tagging Subdomain', ['Tag', 'TagSet']],
  ['Job Subdomain', ['JobPosting']],
  [
    'Resume Subdomain',
    [
      'ResumeProfile',
      'TailoredResume',
      'Resume',
      'ContentSelection',
      'ExperienceSelection',
      'LlmProposal',
      'GeneratedContent'
    ]
  ],
  ['Skill Subdomain', ['Skill']],
  ['Legacy (exists in code, not owned by Experience)', ['Bullet']]
];

/**
 * Hardcoded relationships that cannot be inferred from code patterns.
 * These are placed in the section of the first class mentioned.
 */
const MANUAL_RELATIONSHIPS = [
  'Headline ..> Tag : role tags reference',
  'JobElectionService ..> JobPosting : evaluates',
  'JobElectionService ..> Company : evaluates',
  'TailoringStrategyService ..> ArchetypeKey : resolves',
  'JobPosting ..> JobStatusChangedEvent : emits',
  'Resume ..> ResumeGeneratedEvent : emits'
];

/** Relationship labels by target→source pair. Default is "has". */
const RELATIONSHIP_LABELS: Record<string, string> = {
  'JobPosting→Company': 'belongs-to',
  'Resume→JobPosting': 'generated-for'
};

/** Name aliases for ID properties that don't directly match class names. */
const ID_ALIASES: Record<string, string> = {
  job: 'JobPosting',
  category: 'SkillCategory'
};

/** Color legend per stereotype. */
const STYLES: Record<string, { fill: string; stroke: string; color: string; width: string }> = {
  AggregateRoot: { fill: '#4338ca', stroke: '#312e81', color: '#e0e7ff', width: '2px' },
  Entity: { fill: '#0369a1', stroke: '#0c4a6e', color: '#e0f2fe', width: '2px' },
  ValueObject: { fill: '#047857', stroke: '#064e3b', color: '#d1fae5', width: '1px' },
  enumeration: { fill: '#a16207', stroke: '#713f12', color: '#fef3c7', width: '1px' },
  type: { fill: '#a16207', stroke: '#713f12', color: '#fef3c7', width: '1px' },
  DomainService: { fill: '#7c3aed', stroke: '#4c1d95', color: '#ede9fe', width: '1px' },
  DomainEvent: { fill: '#be185d', stroke: '#831843', color: '#fce7f3', width: '1px' }
};

// ─── Types ───────────────────────────────────────────────────────────────────

type Stereotype = 'AggregateRoot' | 'Entity' | 'ValueObject' | 'enumeration' | 'type' | 'DomainService' | 'DomainEvent';

type PropertyInfo = { name: string; type: string; nullable: boolean };
type MethodInfo = { name: string };
type EnumInfo = { name: string; members: string[]; stereotype: 'enumeration' };
type TypeAliasInfo = { name: string; members: string[]; stereotype: 'type' };
type ClassInfo = {
  name: string;
  stereotype: Stereotype;
  idType: string | null;
  properties: PropertyInfo[];
  methods: MethodInfo[];
};
type DiagramItem = ClassInfo | EnumInfo | TypeAliasInfo;

// ─── Scanning & Parsing ─────────────────────────────────────────────────────

function scanDir(dir: SourceDir): string[] {
  const fullPath = resolve(DOMAIN_SRC, dir);
  return readdirSync(fullPath)
    .filter(f => f.endsWith('.ts'))
    .map(f => resolve(fullPath, f));
}

function isIdType(fileName: string): boolean {
  return /Id\.ts$/.test(fileName);
}

function parseFile(filePath: string, sourceDir: SourceDir): DiagramItem[] {
  const fileName = basename(filePath);
  const source = readFileSync(filePath, 'utf-8');
  const items: DiagramItem[] = [];

  // Skip ID value objects in value-objects/
  if (sourceDir === 'value-objects' && isIdType(fileName)) return items;

  // Parse enums
  const enumRe = /export\s+enum\s+(\w+)\s*\{([^}]+)\}/g;
  for (const match of source.matchAll(enumRe)) {
    const name = match[1];
    if (EXCLUDED.has(name)) continue;
    const members = match[2]
      .split(',')
      .map(m => m.split('=')[0].trim())
      .filter(Boolean);
    items.push({ name, members, stereotype: 'enumeration' });
  }

  // Parse union literal types: export type Foo = 'a' | 'b';
  const unionTypeRe = /export\s+type\s+(\w+)\s*=\s*((?:'[^']+'\s*\|\s*)*'[^']+')\s*;/g;
  for (const match of source.matchAll(unionTypeRe)) {
    const name = match[1];
    if (EXCLUDED.has(name)) continue;
    const members = match[2].split('|').map(m => m.trim().replace(/'/g, ''));
    items.push({ name, members, stereotype: 'type' });
  }

  // Parse object type aliases: export type Foo = { ... };
  const objTypeRe = /export\s+type\s+(\w+)\s*=\s*\{([^}]+)\}/g;
  for (const match of source.matchAll(objTypeRe)) {
    const name = match[1];
    if (EXCLUDED.has(name) || name.endsWith('Props') || name.endsWith('Sections')) continue;
    const properties = parseTypeProperties(match[2]);
    if (properties.length > 0) {
      items.push({
        name,
        stereotype: 'ValueObject',
        idType: null,
        properties,
        methods: []
      } as ClassInfo);
    }
  }

  // Parse classes
  const classRe = /export\s+class\s+(\w+)(?:\s+extends\s+(\w+)(?:<(\w+)>)?)?(?:\s+implements\s+(\w+))?/g;
  for (const match of source.matchAll(classRe)) {
    const name = match[1];
    if (EXCLUDED.has(name)) continue;

    const extendsBase = match[2] ?? null;
    const typeParam = match[3] ?? null;
    const implementsIface = match[4] ?? null;

    const stereotype = classifyClass(extendsBase, implementsIface, sourceDir);
    if (!stereotype) continue;

    let properties: PropertyInfo[];
    if (stereotype === 'DomainEvent') {
      // Domain events define properties in the constructor parameter list
      properties = parseConstructorProperties(source);
    } else {
      properties = parseClassProperties(source);
    }

    const methods = parseClassMethods(source);
    const getters = parseGetters(source);

    items.push({
      name,
      stereotype,
      idType: typeParam,
      properties,
      methods: [...getters, ...methods]
    });
  }

  return items;
}

function classifyClass(
  extendsBase: string | null,
  implementsIface: string | null,
  sourceDir: SourceDir
): Stereotype | null {
  if (extendsBase === 'AggregateRoot') return 'AggregateRoot';
  if (extendsBase === 'Entity') return 'Entity';
  if (extendsBase === 'ValueObject') return 'ValueObject';
  if (implementsIface === 'DomainEvent') return 'DomainEvent';
  if (sourceDir === 'domain-services') return 'DomainService';
  if (sourceDir === 'value-objects') return 'ValueObject';
  return null;
}

function parseClassProperties(source: string): PropertyInfo[] {
  const props: PropertyInfo[] = [];
  const propRe = /^\s+public\s+(?:readonly\s+)?(\w+)\s*:\s*(.+);$/gm;
  for (const match of source.matchAll(propRe)) {
    const name = match[1];
    if (EXCLUDED_PROPS.has(name)) continue;
    const rawType = match[2].trim();
    const nullable = rawType.includes('| null');
    const type = formatType(rawType);
    props.push({ name, type, nullable });
  }
  return props;
}

/** Parse constructor-defined readonly properties (used by domain events). */
function parseConstructorProperties(source: string): PropertyInfo[] {
  const props: PropertyInfo[] = [];
  const ctorRe = /public\s+constructor\s*\(\s*([\s\S]*?)\)/;
  const ctorMatch = source.match(ctorRe);
  if (!ctorMatch) return props;

  const paramRe = /public\s+readonly\s+(\w+)\s*:\s*([^,)]+)/g;
  for (const match of ctorMatch[1].matchAll(paramRe)) {
    const name = match[1];
    if (EXCLUDED_PROPS.has(name)) continue;
    const rawType = match[2].trim();
    const nullable = rawType.includes('| null');
    const type = formatType(rawType);
    props.push({ name, type, nullable });
  }
  return props;
}

function parseTypeProperties(body: string): PropertyInfo[] {
  const props: PropertyInfo[] = [];
  const propRe = /(\w+)\s*:\s*(.+)/g;
  for (const match of body.matchAll(propRe)) {
    const name = match[1];
    if (EXCLUDED_PROPS.has(name)) continue;
    const rawType = match[2].replace(/;/g, '').trim();
    const nullable = rawType.includes('| null');
    const type = formatType(rawType);
    props.push({ name, type, nullable });
  }
  return props;
}

function parseClassMethods(source: string): MethodInfo[] {
  const methods: MethodInfo[] = [];
  const methodRe = /^\s+public\s+(?!static\s|get\s|set\s|readonly\s|constructor)(\w+)\s*\(/gm;
  for (const match of source.matchAll(methodRe)) {
    const name = match[1];
    if (EXCLUDED_METHODS.has(name)) continue;
    methods.push({ name });
  }
  return methods;
}

function parseGetters(source: string): MethodInfo[] {
  const getters: MethodInfo[] = [];
  const getterRe = /^\s+public\s+get\s+(\w+)\s*\(/gm;
  for (const match of source.matchAll(getterRe)) {
    const name = match[1];
    if (EXCLUDED_PROPS.has(name)) continue;
    getters.push({ name });
  }
  return getters;
}

function formatType(rawType: string): string {
  let t = rawType.replace(/\s*\|\s*null/g, '').trim();
  t = t.replace(/Array<([^>]+)>/g, '$1[]');
  // Drop inline object type to a simpler display
  if (t.startsWith('{') || t.includes('{ ')) t = 'object[]';
  return t;
}

// ─── Relationship Inference ──────────────────────────────────────────────────

function inferRelationships(allItems: Map<string, DiagramItem>): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  // Build sets by stereotype for lookups
  const aggregateNames = new Set<string>();
  const entityNames = new Set<string>();
  const voClassNames = new Set<string>();
  const enumNames = new Set<string>();
  const typeNames = new Set<string>();

  // Track composition targets — if A *-- B exists, suppress A --> B
  const compositionTargets = new Set<string>();

  for (const [name, item] of allItems) {
    if (item.stereotype === 'AggregateRoot') aggregateNames.add(name);
    else if (item.stereotype === 'Entity') entityNames.add(name);
    else if (item.stereotype === 'ValueObject') voClassNames.add(name);
    else if (item.stereotype === 'enumeration') enumNames.add(name);
    else if (item.stereotype === 'type') typeNames.add(name);
  }

  // First pass: collect composition relationships
  for (const [name, item] of allItems) {
    if (!isClassInfo(item)) continue;
    for (const prop of item.properties) {
      const baseType = prop.type.replace(/\[\]$/, '');
      const isArray = prop.type.endsWith('[]');

      if (isArray && (entityNames.has(baseType) || voClassNames.has(baseType))) {
        compositionTargets.add(`${name}→${baseType}`);
      } else if (!isArray && voClassNames.has(baseType) && baseType !== name) {
        compositionTargets.add(`${name}→${baseType}`);
      }
    }
  }

  // Second pass: emit relationships
  for (const [name, item] of allItems) {
    if (!isClassInfo(item)) continue;

    for (const prop of item.properties) {
      const baseType = prop.type.replace(/\[\]$/, '');
      const isArray = prop.type.endsWith('[]');

      // Composition: array of entities or value objects
      if (isArray && (entityNames.has(baseType) || voClassNames.has(baseType))) {
        const key = `${name}*--${baseType}`;
        if (!seen.has(key)) {
          seen.add(key);
          lines.push(`${name} "1" *-- "*" ${baseType} : contains`);
        }
        continue;
      }

      // Composition: embedded value object (non-array)
      if (!isArray && voClassNames.has(baseType) && baseType !== name) {
        const key = `${name}*--${baseType}`;
        if (!seen.has(key)) {
          seen.add(key);
          lines.push(`${name} *-- ${baseType}`);
        }
        continue;
      }

      // Association: enum/type-typed property
      if (enumNames.has(baseType) || typeNames.has(baseType)) {
        const key = `${name}→${baseType}`;
        if (!seen.has(key)) {
          seen.add(key);
          lines.push(`${name} --> ${baseType}`);
        }
        continue;
      }

      // Association: fooId string field → Foo aggregate
      if (prop.name.endsWith('Id') && prop.type === 'string') {
        const refName = prop.name.replace(/Id$/, '');
        // Check alias first, then case-insensitive match
        const aliased = ID_ALIASES[refName];
        const matchedAggregate =
          (aliased && aggregateNames.has(aliased) ? aliased : null) ??
          [...aggregateNames].find(a => a.toLowerCase() === refName.toLowerCase());
        if (matchedAggregate && matchedAggregate !== name) {
          // Skip for value objects (e.g., ExperienceSelection.experienceId)
          // and domain events (e.g., ResumeGeneratedEvent.resumeId)
          if (item.stereotype === 'ValueObject' || item.stereotype === 'DomainEvent') continue;

          // Skip if there's already a composition from the same parent to this class
          const composKey = `${matchedAggregate}→${name}`;
          if (compositionTargets.has(composKey)) continue;

          const key = `${matchedAggregate}→${name}`;
          if (!seen.has(key)) {
            seen.add(key);
            const label = RELATIONSHIP_LABELS[`${name}→${matchedAggregate}`] ?? 'has';
            if (name === 'CompanyBrief') {
              lines.push(`${matchedAggregate} "1" --> "0..1" ${name} : ${label}`);
            } else {
              lines.push(`${matchedAggregate} "1" --> "*" ${name} : ${label}`);
            }
          }
        }
      }
    }
  }

  return lines;
}

function isClassInfo(item: DiagramItem): item is ClassInfo {
  return 'properties' in item && Array.isArray(item.properties) && 'idType' in item;
}

// ─── Mermaid Emission ────────────────────────────────────────────────────────

function emitClassBlock(item: DiagramItem): string {
  const lines: string[] = [];
  lines.push(`    class ${item.name} {`);
  lines.push(`        <<${item.stereotype === 'ValueObject' ? 'ValueObject' : item.stereotype}>>`);

  if (isClassInfo(item)) {
    if (item.idType) {
      lines.push(`        +${item.idType} id`);
    }
    for (const prop of item.properties) {
      const suffix = prop.nullable ? '?' : '';
      lines.push(`        +${prop.type}${suffix} ${prop.name}`);
    }
    for (const method of item.methods) {
      lines.push(`        +${method.name}()`);
    }
  }

  if ('members' in item) {
    const chunks: string[][] = [];
    let chunk: string[] = [];
    for (const m of item.members) {
      chunk.push(m);
      if (chunk.length >= 3) {
        chunks.push(chunk);
        chunk = [];
      }
    }
    if (chunk.length > 0) chunks.push(chunk);
    for (const c of chunks) {
      lines.push(`        ${c.join(' \u00b7 ')}`);
    }
  }

  lines.push('    }');
  return lines.join('\n');
}

function getStyleLine(item: DiagramItem): string {
  const style = STYLES[item.stereotype];
  if (!style) return '';
  return `    style ${item.name} fill:${style.fill},stroke:${style.stroke},color:${style.color},stroke-width:${style.width}`;
}

function sectionHeader(label: string): string {
  const bar = '\u2500'.repeat(46);
  return [`    %% ${bar}`, `    %%  ${label}`, `    %% ${bar}`].join('\n');
}

// ─── Diagram Assembly ────────────────────────────────────────────────────────

function generateDiagram(allItems: Map<string, DiagramItem>): string {
  const output: string[] = [
    '---',
    'title: TailoredIn \u2014 Domain Entities & Relationships',
    '---',
    '',
    'classDiagram',
    '    direction TB'
  ];

  const styleLines: string[] = [];

  // Infer all relationships once
  const inferredRels = inferRelationships(allItems);
  const allRels = [...inferredRels, ...MANUAL_RELATIONSHIPS];

  // Track which relationships have been emitted to avoid duplicates
  const emittedRels = new Set<string>();
  const emittedNames = new Set<string>();

  // Helper: find relationships where at least one party is in the given set
  function relsBelongingTo(names: string[]): string[] {
    return allRels.filter(rel => {
      if (emittedRels.has(rel)) return false;
      return names.some(n => new RegExp(`\\b${n}\\b`).test(rel));
    });
  }

  // Emit subdomain sections
  for (const [label, members] of SUBDOMAIN_GROUPS) {
    const items = members.filter(m => allItems.has(m));
    if (items.length === 0) continue;

    output.push('');
    output.push(sectionHeader(label));
    output.push('');

    for (const memberName of items) {
      const item = allItems.get(memberName)!;
      output.push(emitClassBlock(item));
      output.push('');
      styleLines.push(getStyleLine(item));
      emittedNames.add(memberName);
    }

    // Place relationships where both parties have been emitted
    const sectionRels = relsBelongingTo(items).filter(rel => {
      // Only emit if all referenced diagram items have been emitted
      const referencedItems = [...allItems.keys()].filter(n => new RegExp(`\\b${n}\\b`).test(rel));
      return referencedItems.every(n => emittedNames.has(n));
    });
    for (const rel of sectionRels) {
      output.push(`    ${rel}`);
      emittedRels.add(rel);
    }
  }

  // Enums & Types section
  const enumItems = [...allItems.entries()].filter(
    ([name, item]) => !emittedNames.has(name) && (item.stereotype === 'enumeration' || item.stereotype === 'type')
  );
  if (enumItems.length > 0) {
    output.push('');
    output.push(sectionHeader('Enums & Types'));
    output.push('');
    for (const [name, item] of enumItems) {
      output.push(emitClassBlock(item));
      output.push('');
      styleLines.push(getStyleLine(item));
      emittedNames.add(name);
    }
    // Emit enum relationships now that enums are defined
    const enumRels = allRels.filter(rel => {
      if (emittedRels.has(rel)) return false;
      const referencedItems = [...allItems.keys()].filter(n => new RegExp(`\\b${n}\\b`).test(rel));
      return referencedItems.every(n => emittedNames.has(n));
    });
    for (const rel of enumRels) {
      output.push(`    ${rel}`);
      emittedRels.add(rel);
    }
  }

  // Domain Services section
  const serviceItems = [...allItems.entries()].filter(
    ([name, item]) => !emittedNames.has(name) && item.stereotype === 'DomainService'
  );
  if (serviceItems.length > 0) {
    output.push('');
    output.push(sectionHeader('Domain Services'));
    output.push('');
    for (const [name, item] of serviceItems) {
      output.push(emitClassBlock(item));
      output.push('');
      styleLines.push(getStyleLine(item));
      emittedNames.add(name);
    }
    const serviceRels = allRels.filter(rel => {
      if (emittedRels.has(rel)) return false;
      const referencedItems = [...allItems.keys()].filter(n => new RegExp(`\\b${n}\\b`).test(rel));
      return referencedItems.every(n => emittedNames.has(n));
    });
    for (const rel of serviceRels) {
      output.push(`    ${rel}`);
      emittedRels.add(rel);
    }
  }

  // Domain Events section
  const eventItems = [...allItems.entries()].filter(
    ([name, item]) => !emittedNames.has(name) && item.stereotype === 'DomainEvent'
  );
  if (eventItems.length > 0) {
    output.push('');
    output.push(sectionHeader('Domain Events'));
    output.push('');
    for (const [name, item] of eventItems) {
      output.push(emitClassBlock(item));
      output.push('');
      styleLines.push(getStyleLine(item));
      emittedNames.add(name);
    }
    const eventRels = allRels.filter(rel => {
      if (emittedRels.has(rel)) return false;
      const referencedItems = [...allItems.keys()].filter(n => new RegExp(`\\b${n}\\b`).test(rel));
      return referencedItems.every(n => emittedNames.has(n));
    });
    for (const rel of eventRels) {
      output.push(`    ${rel}`);
      emittedRels.add(rel);
    }
  }

  // Style block
  output.push('');
  output.push(sectionHeader('Apply Styles'));
  output.push('');
  output.push(styleLines.filter(Boolean).join('\n'));

  return `${output.join('\n')}\n`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const allItems = new Map<string, DiagramItem>();

for (const dir of SCAN_DIRS) {
  const files = scanDir(dir);
  for (const file of files) {
    const items = parseFile(file, dir);
    for (const item of items) {
      allItems.set(item.name, item);
    }
  }
}

const output = generateDiagram(allItems);
writeFileSync(OUTPUT_PATH, output);

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
