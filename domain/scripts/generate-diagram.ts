#!/usr/bin/env bun
/**
 * Generates domain/DOMAIN.mmd — a Mermaid class diagram of the domain model.
 *
 * Fully code-driven: no hardcoded object names.
 *   - **Inclusion** is determined by the barrel (`domain/src/index.ts`).
 *     Only symbols exported there appear in the diagram.
 *   - **Subdomain grouping** is inferred from foreign-key properties
 *     (`fooId: string` → belongs to Foo's subdomain).
 *   - **Enum/type placement** follows their referencing entities: if every
 *     referencing entity lives in one subdomain the enum goes there too,
 *     otherwise it lands in a shared "Enums & Types" section.
 *
 * Run: bun run domain:diagram
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

// ─── Configuration ──────────────────────────────────────────────────────────

const DOMAIN_SRC = resolve(import.meta.dirname, '../src');
const BARREL_PATH = resolve(DOMAIN_SRC, 'index.ts');
const OUTPUT_PATH = resolve(import.meta.dirname, '../DOMAIN.mmd');

const SCAN_DIRS = ['entities', 'value-objects', 'domain-services', 'events'] as const;
type SourceDir = (typeof SCAN_DIRS)[number];

/** Properties to exclude (noise / boilerplate). */
const EXCLUDED_PROPS = new Set(['createdAt', 'updatedAt', 'eventName', 'occurredAt']);

/** Methods to exclude (factories / boilerplate). */
const EXCLUDED_METHODS = new Set(['create', 'empty', 'constructor']);

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

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Barrel Parsing ─────────────────────────────────────────────────────────

/** Names that are infrastructure / non-diagram even when barrel-exported. */
const BARREL_IGNORE_SUFFIXES = ['Id', 'Repository', 'CreateProps'];
const BARREL_IGNORE_EXACT = new Set(['AggregateRoot', 'Entity', 'ValueObject', 'DomainEvent', 'Result', 'ok', 'err']);

function parseBarrelExports(barrelPath: string): Set<string> {
  const source = readFileSync(barrelPath, 'utf-8');
  const names = new Set<string>();

  // Match: export { Name } from '...'  and  export type { Name1, Name2 } from '...'
  const re = /export\s+(?:type\s+)?\{\s*([^}]+)\}\s+from/g;
  for (const match of source.matchAll(re)) {
    for (const raw of match[1].split(',')) {
      const name = raw.trim();
      if (name) names.add(name);
    }
  }

  // Filter out non-diagram names
  const diagramNames = new Set<string>();
  for (const name of names) {
    if (BARREL_IGNORE_EXACT.has(name)) continue;
    if (BARREL_IGNORE_SUFFIXES.some(s => name.endsWith(s))) continue;
    diagramNames.add(name);
  }

  return diagramNames;
}

// ─── Scanning & Parsing ─────────────────────────────────────────────────────

function scanDir(dir: SourceDir): string[] {
  const fullPath = resolve(DOMAIN_SRC, dir);
  if (!existsSync(fullPath)) return [];
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
    const members = match[2].split('|').map(m => m.trim().replace(/'/g, ''));
    items.push({ name, members, stereotype: 'type' });
  }

  // Parse object type aliases: export type Foo = { ... };
  // Use balanced-brace extraction to handle nested objects.
  const objTypeHeaderRe = /export\s+type\s+(\w+)\s*=\s*\{/g;
  for (const match of source.matchAll(objTypeHeaderRe)) {
    const name = match[1];
    if (name.endsWith('Props') || name.endsWith('Sections')) continue;
    const body = extractBalancedBraces(source, match.index + match[0].length);
    if (!body) continue;
    const properties = parseTopLevelTypeProperties(body);
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
    const extendsBase = match[2] ?? null;
    const typeParam = match[3] ?? null;
    const implementsIface = match[4] ?? null;

    const stereotype = classifyClass(extendsBase, implementsIface, sourceDir);
    if (!stereotype) continue;

    let properties: PropertyInfo[];
    if (stereotype === 'DomainEvent') {
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

/** Extract the body between balanced braces, starting right after the opening `{`. */
function extractBalancedBraces(source: string, startAfterOpen: number): string | null {
  let depth = 1;
  let i = startAfterOpen;
  while (i < source.length && depth > 0) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    i++;
  }
  if (depth !== 0) return null;
  return source.slice(startAfterOpen, i - 1);
}

/** Parse only top-level properties from a type body (skip nested object contents). */
function parseTopLevelTypeProperties(body: string): PropertyInfo[] {
  const props: PropertyInfo[] = [];
  let i = 0;
  while (i < body.length) {
    // Skip whitespace and comments
    if (body[i] === '/' && body[i + 1] === '*') {
      const end = body.indexOf('*/', i + 2);
      i = end === -1 ? body.length : end + 2;
      continue;
    }
    if (body[i] === '/' && body[i + 1] === '/') {
      const end = body.indexOf('\n', i);
      i = end === -1 ? body.length : end + 1;
      continue;
    }

    // Try to match a property: name: type;
    const propMatch = body.slice(i).match(/^(\w+)\s*:\s*/);
    if (propMatch) {
      const name = propMatch[1];
      i += propMatch[0].length;

      // Read the type, handling nested braces
      let typeStr = '';
      let depth = 0;
      while (i < body.length) {
        if (body[i] === '{') depth++;
        else if (body[i] === '}') depth--;
        if (depth === 0 && (body[i] === ';' || body[i] === '\n')) break;
        if (depth < 0) break;
        typeStr += body[i];
        i++;
      }
      i++; // skip the semicolon/newline

      typeStr = typeStr.trim();
      if (!EXCLUDED_PROPS.has(name) && typeStr) {
        const nullable = typeStr.includes('| null');
        const type = formatType(typeStr);
        props.push({ name, type, nullable });
      }
    } else {
      i++;
    }
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
  if (t.startsWith('{') || t.includes('{ ')) t = 'object';
  // Union literal types like 'us-letter' | 'a4' → string
  if (/^'[^']+'\s*(\|\s*'[^']+')+$/.test(t)) t = 'string';
  return t;
}

// ─── Subdomain Inference ────────────────────────────────────────────────────

type SubdomainGroup = { label: string; members: string[] };

/**
 * Infer subdomain grouping from foreign-key properties.
 *
 * 1. AggregateRoots with no `fooId` FK to another aggregate are subdomain roots.
 * 2. Aggregates/entities with `fooId: string` belong to Foo's subdomain.
 * 3. Transitive: Accomplishment.experienceId → Experience → Profile subdomain.
 * 4. Enums/types go to the subdomain that exclusively references them, or shared.
 */
function inferSubdomains(allItems: Map<string, DiagramItem>): {
  subdomains: SubdomainGroup[];
  sharedEnumsTypes: string[];
  ungrouped: string[];
} {
  const aggregateNames = new Set<string>();
  const entityNames = new Set<string>();

  for (const [name, item] of allItems) {
    if (item.stereotype === 'AggregateRoot') aggregateNames.add(name);
    else if (item.stereotype === 'Entity') entityNames.add(name);
  }

  // Build FK parent map: childName → parentAggregateName
  const fkParent = new Map<string, string>();
  for (const [name, item] of allItems) {
    if (!isClassInfo(item)) continue;
    if (item.stereotype !== 'AggregateRoot' && item.stereotype !== 'Entity') continue;

    for (const prop of item.properties) {
      if (!prop.name.endsWith('Id') || prop.type !== 'string') continue;
      const refName = prop.name.replace(/Id$/, '');
      const matchedAggregate = [...aggregateNames].find(a => a.toLowerCase() === refName.toLowerCase());
      if (matchedAggregate && matchedAggregate !== name) {
        fkParent.set(name, matchedAggregate);
        break; // Use the first FK as the subdomain assignment
      }
    }
  }

  // Resolve transitive chains to find the subdomain root
  function resolveRoot(name: string, visited = new Set<string>()): string {
    if (visited.has(name)) return name; // cycle guard
    visited.add(name);
    const parent = fkParent.get(name);
    if (!parent) return name;
    return resolveRoot(parent, visited);
  }

  // Group aggregates/entities by their subdomain root
  const subdomainMembers = new Map<string, Set<string>>();
  for (const name of [...aggregateNames, ...entityNames]) {
    const root = resolveRoot(name);
    if (!subdomainMembers.has(root)) subdomainMembers.set(root, new Set());
    subdomainMembers.get(root)!.add(name);
  }

  // Determine which subdomain(s) reference each enum/type
  const enumTypeNames = new Set<string>();
  for (const [name, item] of allItems) {
    if (item.stereotype === 'enumeration' || item.stereotype === 'type') {
      enumTypeNames.add(name);
    }
  }

  // For ValueObject class items (parsed from object type aliases), treat them like types for placement
  const voClassNames = new Set<string>();
  for (const [name, item] of allItems) {
    if (item.stereotype === 'ValueObject') voClassNames.add(name);
  }

  const referencedBy = new Map<string, Set<string>>(); // enumOrTypeName → set of subdomain roots
  for (const [name, item] of allItems) {
    if (!isClassInfo(item)) continue;
    const root = resolveRoot(name);
    for (const prop of item.properties) {
      const baseType = prop.type.replace(/\[\]$/, '');
      if (enumTypeNames.has(baseType) || voClassNames.has(baseType)) {
        if (!referencedBy.has(baseType)) referencedBy.set(baseType, new Set());
        referencedBy.get(baseType)!.add(root);
      }
    }
  }

  // Build subdomain groups with enum/type placement
  const placedItems = new Set<string>();
  const subdomains: SubdomainGroup[] = [];

  // Sort subdomain roots: largest group first for stable output
  const sortedRoots = [...subdomainMembers.entries()].sort((a, b) => b[1].size - a[1].size);

  for (const [root, members] of sortedRoots) {
    // Order: root first, then by name
    const ordered = [root, ...[...members].filter(m => m !== root).sort()];

    // Find enums/types exclusively referenced by this subdomain
    const subdomainEnums: string[] = [];
    for (const [etName, refs] of referencedBy) {
      if (placedItems.has(etName)) continue;
      if (refs.size === 1 && refs.has(root)) {
        subdomainEnums.push(etName);
      }
    }
    subdomainEnums.sort();

    const allMembers = [...ordered, ...subdomainEnums];
    for (const m of allMembers) placedItems.add(m);

    subdomains.push({ label: `${root} Subdomain`, members: allMembers });
  }

  // Shared enums/types: referenced by multiple subdomains
  const sharedEnumsTypes: string[] = [];
  for (const name of [...enumTypeNames, ...voClassNames]) {
    if (!placedItems.has(name)) {
      sharedEnumsTypes.push(name);
      placedItems.add(name);
    }
  }
  sharedEnumsTypes.sort();

  // Ungrouped: anything remaining (domain services, events, etc.)
  const ungrouped: string[] = [];
  for (const name of allItems.keys()) {
    if (!placedItems.has(name)) {
      ungrouped.push(name);
    }
  }
  ungrouped.sort();

  return { subdomains, sharedEnumsTypes, ungrouped };
}

// ─── Relationship Inference ─────────────────────────────────────────────────

function inferRelationships(allItems: Map<string, DiagramItem>): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  const aggregateNames = new Set<string>();
  const entityNames = new Set<string>();
  const voClassNames = new Set<string>();
  const enumNames = new Set<string>();
  const typeNames = new Set<string>();
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
        const matchedAggregate = [...aggregateNames].find(a => a.toLowerCase() === refName.toLowerCase());
        if (matchedAggregate && matchedAggregate !== name) {
          if (item.stereotype === 'ValueObject' || item.stereotype === 'DomainEvent') continue;

          const composKey = `${matchedAggregate}→${name}`;
          if (compositionTargets.has(composKey)) continue;

          const key = `${matchedAggregate}→${name}`;
          if (!seen.has(key)) {
            seen.add(key);
            lines.push(`${matchedAggregate} "1" --> "*" ${name} : has`);
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

// ─── Mermaid Emission ───────────────────────────────────────────────────────

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

// ─── Diagram Assembly ───────────────────────────────────────────────────────

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
  const inferredRels = inferRelationships(allItems);
  const emittedRels = new Set<string>();
  const emittedNames = new Set<string>();

  const { subdomains, sharedEnumsTypes, ungrouped } = inferSubdomains(allItems);

  function emitSection(label: string, memberNames: string[]) {
    const items = memberNames.filter(m => allItems.has(m));
    if (items.length === 0) return;

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

    // Place relationships where all referenced items have been emitted
    const sectionRels = inferredRels.filter(rel => {
      if (emittedRels.has(rel)) return false;
      if (!items.some(n => new RegExp(`\\b${n}\\b`).test(rel))) return false;
      const referencedItems = [...allItems.keys()].filter(n => new RegExp(`\\b${n}\\b`).test(rel));
      return referencedItems.every(n => emittedNames.has(n));
    });
    for (const rel of sectionRels) {
      output.push(`    ${rel}`);
      emittedRels.add(rel);
    }
  }

  // Emit subdomain sections
  for (const { label, members } of subdomains) {
    emitSection(label, members);
  }

  // Shared enums/types
  if (sharedEnumsTypes.length > 0) {
    emitSection('Enums & Types', sharedEnumsTypes);
  }

  // Domain Services (auto-detected, no hardcoded names)
  const serviceNames = [...allItems.entries()]
    .filter(([name, item]) => !emittedNames.has(name) && item.stereotype === 'DomainService')
    .map(([name]) => name);
  if (serviceNames.length > 0) {
    emitSection('Domain Services', serviceNames);
  }

  // Domain Events (auto-detected)
  const eventNames = [...allItems.entries()]
    .filter(([name, item]) => !emittedNames.has(name) && item.stereotype === 'DomainEvent')
    .map(([name]) => name);
  if (eventNames.length > 0) {
    emitSection('Domain Events', eventNames);
  }

  // Ungrouped catch-all
  if (ungrouped.length > 0) {
    emitSection('Ungrouped (needs classification)', ungrouped);
  }

  // Style block
  output.push('');
  output.push(sectionHeader('Apply Styles'));
  output.push('');
  output.push(styleLines.filter(Boolean).join('\n'));

  return `${output.join('\n')}\n`;
}

// ─── Main ───────────────────────────────────────────────────────────────────

const barrelExports = parseBarrelExports(BARREL_PATH);
const allItems = new Map<string, DiagramItem>();

for (const dir of SCAN_DIRS) {
  const files = scanDir(dir);
  for (const file of files) {
    const items = parseFile(file, dir);
    for (const item of items) {
      // Only include items exported from the barrel
      if (barrelExports.has(item.name)) {
        allItems.set(item.name, item);
      }
    }
  }
}

const diagramOutput = generateDiagram(allItems);
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
