/**
 * Assembles the domain Mermaid class diagram from extracted data.
 * Handles subdomain grouping and section layout.
 */
import { MermaidEmitter } from '../shared/MermaidEmitter.js';
import type { ClassInfo, DomainDiagramItem, StyleConfig, SubdomainGroup } from '../shared/types.js';
import { DomainRelationshipInferrer } from './DomainRelationshipInferrer.js';

/** Color legend per stereotype. */
const STYLES: Record<string, StyleConfig> = {
  AggregateRoot: { fill: '#4338ca', stroke: '#312e81', color: '#e0e7ff', width: '2px' },
  Entity: { fill: '#0369a1', stroke: '#0c4a6e', color: '#e0f2fe', width: '2px' },
  ValueObject: { fill: '#047857', stroke: '#064e3b', color: '#d1fae5', width: '1px' },
  enumeration: { fill: '#a16207', stroke: '#713f12', color: '#fef3c7', width: '1px' },
  type: { fill: '#a16207', stroke: '#713f12', color: '#fef3c7', width: '1px' },
  DomainService: { fill: '#7c3aed', stroke: '#4c1d95', color: '#ede9fe', width: '1px' },
  DomainEvent: { fill: '#be185d', stroke: '#831843', color: '#fce7f3', width: '1px' }
};

export namespace DomainDiagramAssembler {
  export function assemble(allItems: Map<string, DomainDiagramItem>): string {
    const output: string[] = [
      '---',
      'title: TailoredIn \u2014 Domain Entities & Relationships',
      '---',
      '',
      'classDiagram',
      '    direction TB'
    ];

    const styleLines: string[] = [];
    const inferredRels = DomainRelationshipInferrer.infer(allItems);
    const emittedRels = new Set<string>();
    const emittedNames = new Set<string>();

    const { subdomains, sharedEnumsTypes, ungrouped } = inferSubdomains(allItems);

    function emitSection(label: string, memberNames: string[]) {
      const items = memberNames.filter(m => allItems.has(m));
      if (items.length === 0) return;

      output.push('');
      output.push(MermaidEmitter.sectionHeader(label));
      output.push('');

      for (const memberName of items) {
        const item = allItems.get(memberName)!;
        output.push(emitClassBlock(item));
        output.push('');
        const style = STYLES[item.stereotype];
        if (style) styleLines.push(MermaidEmitter.styleDirective(item.name, style));
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

    // Domain Services (auto-detected)
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
    output.push(MermaidEmitter.sectionHeader('Apply Styles'));
    output.push('');
    output.push(styleLines.filter(Boolean).join('\n'));

    return `${output.join('\n')}\n`;
  }
}

// ─── Class Block Emission ──────────────────────────────────────────────────

function emitClassBlock(item: DomainDiagramItem): string {
  const members: string[] = [];

  if (isClassInfo(item)) {
    if (item.idType) {
      members.push(`+${item.idType} id`);
    }
    for (const prop of item.properties) {
      const suffix = prop.nullable ? '?' : '';
      members.push(`+${prop.type}${suffix} ${prop.name}`);
    }
    for (const method of item.methods) {
      members.push(`+${method.name}()`);
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
      members.push(c.join(' \u00b7 '));
    }
  }

  const stereotype = item.stereotype === 'ValueObject' ? 'ValueObject' : item.stereotype;
  return MermaidEmitter.classBlock(item.name, stereotype, members);
}

// ─── Subdomain Inference ───────────────────────────────────────────────────

function inferSubdomains(allItems: Map<string, DomainDiagramItem>): {
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

  // Ungrouped: anything remaining
  const ungrouped: string[] = [];
  for (const name of allItems.keys()) {
    if (!placedItems.has(name)) {
      ungrouped.push(name);
    }
  }
  ungrouped.sort();

  return { subdomains, sharedEnumsTypes, ungrouped };
}

function isClassInfo(item: DomainDiagramItem): item is ClassInfo {
  return 'properties' in item && Array.isArray(item.properties) && 'idType' in item;
}
