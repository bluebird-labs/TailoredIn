#!/usr/bin/env bun
/**
 * Generates application/APPLICATION.mmd — a Mermaid class diagram of the application layer.
 *
 * Fully code-driven: no hardcoded object names.
 *   - **Inclusion** is determined by the barrel (`application/src/index.ts`)
 *     via two-level resolution (main barrel → sub-barrels → source files).
 *   - **Use-case grouping** is inferred from subdirectory structure under `use-cases/`.
 *   - **Domain port stubs** are auto-detected from use-case constructor dependencies
 *     that reference interfaces not defined in the application barrel.
 *
 * Run: bun run app:diagram
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// ─── Configuration ──────────────────────────────────────────────────────────

const APP_SRC = resolve(import.meta.dirname, '../src');
const BARREL_PATH = resolve(APP_SRC, 'index.ts');
const OUTPUT_PATH = resolve(import.meta.dirname, '../APPLICATION.mmd');

/** Sub-barrel categories to scan. */
const CATEGORIES = ['use-cases', 'ports', 'dtos', 'errors'] as const;
type Category = (typeof CATEGORIES)[number];

/** Color legend per stereotype. */
const STYLES: Record<string, { fill: string; stroke: string; color: string; width: string }> = {
  UseCase: { fill: '#0d9488', stroke: '#134e4a', color: '#ccfbf1', width: '2px' },
  Port: { fill: '#7c3aed', stroke: '#4c1d95', color: '#ede9fe', width: '2px' },
  DTO: { fill: '#a16207', stroke: '#713f12', color: '#fef3c7', width: '1px' },
  Error: { fill: '#be185d', stroke: '#831843', color: '#fce7f3', width: '1px' },
  DomainPort: { fill: '#475569', stroke: '#1e293b', color: '#e2e8f0', width: '1px' }
};

// ─── Types ──────────────────────────────────────────────────────────────────

type ConstructorDep = { name: string; type: string };
type MethodInfo = { name: string; params: string; returnType: string };
type FieldInfo = { name: string; type: string; nullable: boolean };

type UseCaseInfo = {
  name: string;
  stereotype: 'UseCase';
  domain: string;
  constructorDeps: ConstructorDep[];
  executeInput: string | null;
  executeReturn: string;
};

type PortInfo = {
  name: string;
  stereotype: 'Port';
  methods: MethodInfo[];
};

type DtoInfo = {
  name: string;
  stereotype: 'DTO';
  fields: FieldInfo[];
};

type ErrorInfo = {
  name: string;
  stereotype: 'Error';
  properties: FieldInfo[];
  constructorParams: string[];
};

type DomainPortInfo = {
  name: string;
  stereotype: 'DomainPort';
};

type DiagramItem = UseCaseInfo | PortInfo | DtoInfo | ErrorInfo | DomainPortInfo;

type BarrelEntry = {
  exportedName: string;
  sourceFile: string;
  category: Category;
  domain: string | null;
};

// ─── Barrel Parsing (Two-Level) ────────────────────────────────────────────

function parseMainBarrel(barrelPath: string): Map<Category, string> {
  const source = readFileSync(barrelPath, 'utf-8');
  const subBarrels = new Map<Category, string>();

  const re = /export\s+(?:type\s+)?\*\s+from\s+'\.\/([^']+)'/g;
  for (const match of source.matchAll(re)) {
    const relPath = match[1]; // e.g. 'dtos/index.js' or 'errors/index.js'
    const dir = relPath.split('/')[0];
    const category = CATEGORIES.find(c => c === dir);
    if (category) {
      subBarrels.set(category, resolve(dirname(barrelPath), relPath.replace(/\.js$/, '.ts')));
    }
  }

  return subBarrels;
}

function parseSubBarrel(subBarrelPath: string, category: Category): BarrelEntry[] {
  const source = readFileSync(subBarrelPath, 'utf-8');
  const entries: BarrelEntry[] = [];
  const dir = dirname(subBarrelPath);

  const re = /export\s+(?:type\s+)?\{\s*([^}]+)\}\s+from\s+'([^']+)'/g;
  for (const match of source.matchAll(re)) {
    const names = match[1]
      .split(',')
      .map(n => n.trim())
      .filter(Boolean);
    const relPath = match[2]; // e.g. './company/CreateCompany.js'

    // Infer domain from subdirectory (use-cases only)
    let domain: string | null = null;
    if (category === 'use-cases') {
      const parts = relPath.replace(/^\.\//, '').split('/');
      domain = parts.length > 1 ? parts[0] : 'profile';
    }

    const sourceFile = resolve(dir, relPath.replace(/\.js$/, '.ts'));

    for (const name of names) {
      // Skip lowercase names (mapper functions like toCompanyDto)
      if (/^[a-z]/.test(name)) continue;
      // Skip Input types (auxiliary)
      if (name.endsWith('Input')) continue;

      entries.push({ exportedName: name, sourceFile, category, domain });
    }
  }

  return entries;
}

// ─── Source File Parsers ────────────────────────────────────────────────────

function parseUseCaseFile(filePath: string, domain: string, className: string): UseCaseInfo | null {
  const source = readFileSync(filePath, 'utf-8');

  // Parse constructor deps: private readonly paramName: TypeName
  const constructorDeps: ConstructorDep[] = [];
  const ctorMatch = source.match(/public\s+constructor\s*\(([\s\S]*?)\)/);
  if (ctorMatch) {
    const paramRe = /private\s+readonly\s+(\w+)\s*:\s*(\w+)/g;
    for (const m of ctorMatch[1].matchAll(paramRe)) {
      constructorDeps.push({ name: m[1], type: m[2] });
    }
  }

  // Parse execute return type
  const execMatch = source.match(/public\s+async\s+execute\s*\(([^)]*)\)\s*:\s*Promise<(.+?)>\s*\{/);
  let executeReturn = 'void';
  let executeInput: string | null = null;

  if (execMatch) {
    executeReturn = execMatch[2].trim();
    // Parse input param type
    const inputParam = execMatch[1].trim();
    if (inputParam) {
      const inputTypeMatch = inputParam.match(/:\s*(\w+)/);
      if (inputTypeMatch) executeInput = inputTypeMatch[1];
    }
  }

  return {
    name: className,
    stereotype: 'UseCase',
    domain,
    constructorDeps,
    executeInput,
    executeReturn
  };
}

function parsePortFile(filePath: string, targetNames: Set<string>): DiagramItem[] {
  const source = readFileSync(filePath, 'utf-8');
  const items: DiagramItem[] = [];

  // Parse interfaces
  const ifaceRe = /export\s+interface\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  for (const match of source.matchAll(ifaceRe)) {
    const name = match[1];
    if (!targetNames.has(name)) continue;

    const body = match[2];
    const methods: MethodInfo[] = [];
    const methodRe = /^\s+(\w+)\s*\(([^)]*)\)\s*:\s*(.+);$/gm;
    for (const m of body.matchAll(methodRe)) {
      const params = m[2]
        .split(',')
        .map(p => p.trim().split(/\s*:\s*/)[0])
        .filter(Boolean)
        .join(', ');
      const returnType = m[3].trim();
      methods.push({ name: m[1], params, returnType });
    }

    items.push({ name, stereotype: 'Port', methods });
  }

  // Parse co-located result types
  const typeRe = /export\s+type\s+(\w+)\s*=\s*\{/g;
  for (const match of source.matchAll(typeRe)) {
    const name = match[1];
    if (!targetNames.has(name)) continue;

    const body = extractBalancedBraces(source, match.index + match[0].length);
    if (!body) continue;
    const fields = parseTopLevelTypeProperties(body);

    items.push({ name, stereotype: 'DTO', fields });
  }

  return items;
}

function parseDtoFile(filePath: string, targetNames: Set<string>): DtoInfo[] {
  const source = readFileSync(filePath, 'utf-8');
  const items: DtoInfo[] = [];

  const typeRe = /export\s+type\s+(\w+)(?:<[^>]+>)?\s*=\s*\{/g;
  for (const match of source.matchAll(typeRe)) {
    const name = match[1];
    if (!targetNames.has(name)) continue;

    const body = extractBalancedBraces(source, match.index + match[0].length);
    if (!body) continue;
    const fields = parseTopLevelTypeProperties(body);

    items.push({ name, stereotype: 'DTO', fields });
  }

  return items;
}

function parseErrorFile(filePath: string, targetNames: Set<string>): ErrorInfo[] {
  const source = readFileSync(filePath, 'utf-8');
  const items: ErrorInfo[] = [];

  const classRe = /export\s+class\s+(\w+)\s+extends\s+Error/g;
  for (const match of source.matchAll(classRe)) {
    const name = match[1];
    if (!targetNames.has(name)) continue;

    // Parse public readonly properties
    const properties: FieldInfo[] = [];
    const propRe = /public\s+readonly\s+(\w+)(?:\s*:\s*(\w+))?\s*=\s*([^;]+)/g;
    for (const m of source.matchAll(propRe)) {
      const propName = m[1];
      const propType = m[2] ?? inferTypeFromValue(m[3].trim());
      properties.push({ name: propName, type: propType, nullable: false });
    }

    // Parse constructor params
    const constructorParams: string[] = [];
    const ctorMatch = source.match(/public\s+constructor\s*\(([^)]*)\)/);
    if (ctorMatch) {
      const params = ctorMatch[1].split(',').map(p => p.trim());
      for (const param of params) {
        const paramMatch = param.match(/(\w+)\s*:\s*(\w+)/);
        if (paramMatch) constructorParams.push(paramMatch[1]);
      }
    }

    items.push({ name, stereotype: 'Error', properties, constructorParams });
  }

  return items;
}

/** Infer a type from a literal value (e.g. 502 → number, 'foo' → string). */
function inferTypeFromValue(value: string): string {
  if (/^\d+$/.test(value)) return 'number';
  if (value === 'true' || value === 'false') return 'boolean';
  return 'string';
}

// ─── Shared Parsing Utilities (from domain generator) ───────────────────────

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
function parseTopLevelTypeProperties(body: string): FieldInfo[] {
  const props: FieldInfo[] = [];
  let i = 0;
  while (i < body.length) {
    // Skip comments
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
    const propMatch = body.slice(i).match(/^(?:readonly\s+)?(\w+)\s*:\s*/);
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
      if (typeStr) {
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

function formatType(rawType: string): string {
  let t = rawType.replace(/\s*\|\s*null/g, '').trim();
  t = t.replace(/Array<([^>]+)>/g, '$1[]');
  if (t.startsWith('{') || t.includes('{ ')) t = 'object';
  if (/^'[^']+'\s*(\|\s*'[^']+')+$/.test(t)) t = 'string';
  return t;
}

// ─── Relationship Inference ─────────────────────────────────────────────────

function inferRelationships(allItems: Map<string, DiagramItem>): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  for (const [name, item] of allItems) {
    if (item.stereotype === 'UseCase') {
      // Constructor dependencies
      for (const dep of item.constructorDeps) {
        if (allItems.has(dep.type)) {
          const key = `${name}..>${dep.type}`;
          if (!seen.has(key)) {
            seen.add(key);
            lines.push(`${name} ..> ${dep.type} : depends`);
          }
        }
      }

      // Execute return type → DTO
      const returnTypes = extractTypeNames(item.executeReturn);
      for (const rt of returnTypes) {
        if (allItems.has(rt) && allItems.get(rt)!.stereotype === 'DTO') {
          const key = `${name}..>${rt}`;
          if (!seen.has(key)) {
            seen.add(key);
            lines.push(`${name} ..> ${rt} : returns`);
          }
        }
      }
    }

    if (item.stereotype === 'Port') {
      // Port method return types → result types
      for (const method of item.methods) {
        const returnTypes = extractTypeNames(method.returnType);
        for (const rt of returnTypes) {
          if (allItems.has(rt) && allItems.get(rt)!.stereotype === 'DTO') {
            const key = `${name}..>${rt}`;
            if (!seen.has(key)) {
              seen.add(key);
              lines.push(`${name} ..> ${rt} : produces`);
            }
          }
        }
      }
    }

    if (item.stereotype === 'DTO') {
      // DTO composition: field types referencing other DTOs
      for (const field of item.fields) {
        const baseType = field.type.replace(/\[\]$/, '');
        if (allItems.has(baseType) && allItems.get(baseType)!.stereotype === 'DTO' && baseType !== name) {
          const isArray = field.type.endsWith('[]');
          const key = `${name}*--${baseType}`;
          if (!seen.has(key)) {
            seen.add(key);
            if (isArray) {
              lines.push(`${name} "1" *-- "*" ${baseType} : contains`);
            } else {
              lines.push(`${name} *-- ${baseType}`);
            }
          }
        }
      }
    }
  }

  return lines;
}

/** Extract concrete type names from a return type string, unwrapping Result<T, E>, arrays, Promise<T>. */
function extractTypeNames(typeStr: string): string[] {
  let t = typeStr.trim();
  // Unwrap Result<T, E> → take first type param
  const resultMatch = t.match(/^Result<\s*([^,>]+)/);
  if (resultMatch) t = resultMatch[1].trim();
  // Strip Promise wrapper
  const promiseMatch = t.match(/^Promise<(.+)>$/);
  if (promiseMatch) t = promiseMatch[1].trim();
  // Strip array suffix (after all unwrapping)
  t = t.replace(/\[\]$/, '');
  // Return as single-item array (primitives like void/string are fine — they won't match any item)
  return [t];
}

// ─── Mermaid Emission ───────────────────────────────────────────────────────

function emitClassBlock(item: DiagramItem): string {
  const lines: string[] = [];
  lines.push(`    class ${item.name} {`);
  lines.push(`        <<${item.stereotype}>>`);

  if (item.stereotype === 'UseCase') {
    for (const dep of item.constructorDeps) {
      lines.push(`        +${dep.type} ${dep.name}`);
    }
    const inputStr = item.executeInput ?? '';
    lines.push(`        +execute(${inputStr}) ${item.executeReturn}`);
  }

  if (item.stereotype === 'Port') {
    for (const method of item.methods) {
      const params = method.params ? method.params : '';
      lines.push(`        +${method.name}(${params}) ${method.returnType}`);
    }
  }

  if (item.stereotype === 'DTO') {
    for (const field of item.fields) {
      const suffix = field.nullable ? '?' : '';
      lines.push(`        +${field.type}${suffix} ${field.name}`);
    }
  }

  if (item.stereotype === 'Error') {
    for (const prop of item.properties) {
      lines.push(`        +${prop.type} ${prop.name}`);
    }
    if (item.constructorParams.length > 0) {
      lines.push(`        +constructor(${item.constructorParams.join(', ')})`);
    }
  }

  // DomainPort: no members (stub)

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
    'title: TailoredIn \u2014 Application Layer (Use Cases, Ports, DTOs)',
    '---',
    '',
    'classDiagram',
    '    direction TB'
  ];

  const styleLines: string[] = [];
  const inferredRels = inferRelationships(allItems);
  const emittedRels = new Set<string>();
  const emittedNames = new Set<string>();

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

  // Group use cases by domain
  const domainGroups = new Map<string, string[]>();
  for (const [name, item] of allItems) {
    if (item.stereotype === 'UseCase') {
      const group = domainGroups.get(item.domain) ?? [];
      group.push(name);
      domainGroups.set(item.domain, group);
    }
  }

  // Sort domain groups alphabetically, emit each
  const sortedDomains = [...domainGroups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [domain, members] of sortedDomains) {
    const label = `${domain.charAt(0).toUpperCase() + domain.slice(1)} Use Cases`;
    emitSection(label, members.sort());
  }

  // Ports
  const portNames = [...allItems.entries()]
    .filter(([, item]) => item.stereotype === 'Port')
    .map(([name]) => name)
    .sort();
  emitSection('Ports', portNames);

  // DTOs
  const dtoNames = [...allItems.entries()]
    .filter(([, item]) => item.stereotype === 'DTO')
    .map(([name]) => name)
    .sort();
  emitSection('DTOs', dtoNames);

  // Errors
  const errorNames = [...allItems.entries()]
    .filter(([, item]) => item.stereotype === 'Error')
    .map(([name]) => name)
    .sort();
  emitSection('Errors', errorNames);

  // Domain Port stubs
  const domainPortNames = [...allItems.entries()]
    .filter(([, item]) => item.stereotype === 'DomainPort')
    .map(([name]) => name)
    .sort();
  emitSection('Domain Ports (external)', domainPortNames);

  // Remaining relationships (cross-section)
  const remainingRels = inferredRels.filter(rel => !emittedRels.has(rel));
  if (remainingRels.length > 0) {
    output.push('');
    output.push(sectionHeader('Cross-section Relationships'));
    output.push('');
    for (const rel of remainingRels) {
      output.push(`    ${rel}`);
    }
  }

  // Style block
  output.push('');
  output.push(sectionHeader('Apply Styles'));
  output.push('');
  output.push(styleLines.filter(Boolean).join('\n'));

  return `${output.join('\n')}\n`;
}

// ─── Main ───────────────────────────────────────────────────────────────────

const subBarrels = parseMainBarrel(BARREL_PATH);
const allEntries: BarrelEntry[] = [];

for (const [category, subBarrelPath] of subBarrels) {
  if (!existsSync(subBarrelPath)) continue;
  allEntries.push(...parseSubBarrel(subBarrelPath, category));
}

// Deduplicate entries by name (same file may be referenced multiple times)
const entryByName = new Map<string, BarrelEntry>();
for (const entry of allEntries) {
  entryByName.set(entry.exportedName, entry);
}

// Parse source files by category
const allItems = new Map<string, DiagramItem>();
const parsedFiles = new Set<string>();

for (const [name, entry] of entryByName) {
  if (!existsSync(entry.sourceFile)) continue;

  if (entry.category === 'use-cases') {
    const uc = parseUseCaseFile(entry.sourceFile, entry.domain!, name);
    if (uc) allItems.set(name, uc);
  } else if (entry.category === 'ports') {
    if (!parsedFiles.has(entry.sourceFile)) {
      parsedFiles.add(entry.sourceFile);
      // Collect all target names from this file
      const targetNames = new Set<string>();
      for (const [n, e] of entryByName) {
        if (e.sourceFile === entry.sourceFile) targetNames.add(n);
      }
      const items = parsePortFile(entry.sourceFile, targetNames);
      for (const item of items) allItems.set(item.name, item);
    }
  } else if (entry.category === 'dtos') {
    if (!parsedFiles.has(entry.sourceFile)) {
      parsedFiles.add(entry.sourceFile);
      const targetNames = new Set<string>();
      for (const [n, e] of entryByName) {
        if (e.sourceFile === entry.sourceFile) targetNames.add(n);
      }
      const items = parseDtoFile(entry.sourceFile, targetNames);
      for (const item of items) allItems.set(item.name, item);
    }
  } else if (entry.category === 'errors') {
    if (!parsedFiles.has(entry.sourceFile)) {
      parsedFiles.add(entry.sourceFile);
      const targetNames = new Set<string>();
      for (const [n, e] of entryByName) {
        if (e.sourceFile === entry.sourceFile) targetNames.add(n);
      }
      const items = parseErrorFile(entry.sourceFile, targetNames);
      for (const item of items) allItems.set(item.name, item);
    }
  }
}

// Collect domain port stubs (constructor deps not in the application barrel)
for (const item of allItems.values()) {
  if (item.stereotype === 'UseCase') {
    for (const dep of item.constructorDeps) {
      if (!allItems.has(dep.type)) {
        allItems.set(dep.type, { name: dep.type, stereotype: 'DomainPort' });
      }
    }
  }
}

const diagramOutput = generateDiagram(allItems);
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
