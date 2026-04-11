/**
 * Shared Mermaid diagram formatting utilities.
 * Consolidates duplicated emission logic from all three generators.
 */
import type { ErColumnRow, StyleConfig } from './types.js';

export namespace MermaidEmitter {
  /** Section header with decorative comment bars. */
  export function sectionHeader(label: string): string {
    const bar = '\u2500'.repeat(46);
    return [`    %% ${bar}`, `    %%  ${label}`, `    %% ${bar}`].join('\n');
  }

  /** Style directive for classDiagram nodes. */
  export function styleDirective(name: string, config: StyleConfig): string {
    return `    style ${name} fill:${config.fill},stroke:${config.stroke},color:${config.color},stroke-width:${config.width}`;
  }

  /** classDef directive for erDiagram styling. */
  export function classDefDirective(className: string, fill: string, stroke: string): string {
    return `    classDef ${className} fill:${fill},stroke:${stroke},stroke-width:2px`;
  }

  /** Class assignment for erDiagram styling. */
  export function classAssignment(name: string, className: string): string {
    return `    class ${name} ${className}`;
  }

  /** Format a raw TypeScript type for diagram display. */
  export function formatType(rawType: string): string {
    let t = rawType.replace(/\s*\|\s*null/g, '').trim();
    // Strip readonly modifier: readonly string[] → string[]
    t = t.replace(/^readonly\s+/, '');
    // ReadonlyArray<T> → T[], then Array<T> → T[]
    t = t.replace(/ReadonlyArray<([^>]+)>/g, '$1[]');
    t = t.replace(/Array<([^>]+)>/g, '$1[]');
    // Record<K,V> → object
    t = t.replace(/^Record<.+>$/, 'object');
    // Object literals (inline or multiline) → object, preserving trailing []
    const arraySuffix = t.endsWith('[]') ? '[]' : '';
    if (t.startsWith('{') || t.includes('{ ') || t.includes('{\n')) t = `object${arraySuffix}`;
    // Union literal types like 'us-letter' | 'a4' → string
    if (/^'[^']+'\s*(\|\s*'[^']+')+$/.test(t)) t = 'string';
    return t;
  }

  /** Emit a classDiagram class block with stereotype and members. */
  export function classBlock(name: string, stereotype: string, members: string[]): string {
    const lines: string[] = [];
    lines.push(`    class ${name} {`);
    lines.push(`        <<${stereotype}>>`);
    for (const member of members) {
      lines.push(`        ${member}`);
    }
    lines.push('    }');
    return lines.join('\n');
  }

  /** Emit an erDiagram table block. */
  export function erTableBlock(tableName: string, rows: ErColumnRow[]): string {
    const lines: string[] = [];
    lines.push(`    ${tableName} {`);
    for (const row of rows) {
      const parts = [`        ${row.type} ${row.name}`];
      if (row.constraint) parts.push(row.constraint);
      if (row.comment) parts.push(row.comment);
      lines.push(parts.join(' '));
    }
    lines.push('    }');
    return lines.join('\n');
  }
}
