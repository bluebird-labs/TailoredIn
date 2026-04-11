/**
 * Assembles the application Mermaid class diagram from extracted data.
 * Handles use case grouping by domain and section layout.
 */
import { MermaidEmitter } from '../shared/MermaidEmitter.js';
import type { ApplicationDiagramItem, StyleConfig } from '../shared/types.js';
import { ApplicationRelationshipInferrer } from './ApplicationRelationshipInferrer.js';

/** Color legend per stereotype. */
const STYLES: Record<string, StyleConfig> = {
  UseCase: { fill: '#0d9488', stroke: '#134e4a', color: '#ccfbf1', width: '2px' },
  Port: { fill: '#7c3aed', stroke: '#4c1d95', color: '#ede9fe', width: '2px' },
  DTO: { fill: '#a16207', stroke: '#713f12', color: '#fef3c7', width: '1px' },
  Error: { fill: '#be185d', stroke: '#831843', color: '#fce7f3', width: '1px' },
  DomainPort: { fill: '#475569', stroke: '#1e293b', color: '#e2e8f0', width: '1px' }
};

export namespace ApplicationDiagramAssembler {
  export function assemble(allItems: Map<string, ApplicationDiagramItem>): string {
    const output: string[] = [
      '---',
      'title: TailoredIn \u2014 Application Layer (Use Cases, Ports, DTOs)',
      '---',
      '',
      'classDiagram',
      '    direction TB'
    ];

    const styleLines: string[] = [];
    const inferredRels = ApplicationRelationshipInferrer.infer(allItems);
    const emittedRels = new Set<string>();
    const emittedNames = new Set<string>();

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
      output.push(MermaidEmitter.sectionHeader('Cross-section Relationships'));
      output.push('');
      for (const rel of remainingRels) {
        output.push(`    ${rel}`);
      }
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

function emitClassBlock(item: ApplicationDiagramItem): string {
  const members: string[] = [];

  if (item.stereotype === 'UseCase') {
    for (const dep of item.constructorDeps) {
      members.push(`+${dep.type} ${dep.name}`);
    }
    const inputStr = item.executeInput ?? '';
    members.push(`+execute(${inputStr}) ${item.executeReturn}`);
  }

  if (item.stereotype === 'Port') {
    for (const method of item.methods) {
      const params = method.params ? method.params : '';
      members.push(`+${method.name}(${params}) ${method.returnType}`);
    }
  }

  if (item.stereotype === 'DTO') {
    for (const field of item.fields) {
      const suffix = field.nullable ? '?' : '';
      members.push(`+${field.type}${suffix} ${field.name}`);
    }
  }

  if (item.stereotype === 'Error') {
    for (const prop of item.properties) {
      members.push(`+${prop.type} ${prop.name}`);
    }
    if (item.constructorParams.length > 0) {
      members.push(`+constructor(${item.constructorParams.join(', ')})`);
    }
  }

  // DomainPort: no members (stub)

  return MermaidEmitter.classBlock(item.name, item.stereotype, members);
}
