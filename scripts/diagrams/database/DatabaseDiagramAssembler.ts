/**
 * Assembles the database Mermaid ERD from extracted table/FK data.
 * Groups tables by connected components with color-coded styling.
 */
import { MermaidEmitter } from '../shared/MermaidEmitter.js';
import type { ErColumnRow, ForeignKeyDescriptor, TableDescriptor } from '../shared/types.js';
import type { RelationshipAnalysis } from './DatabaseRelationshipInferrer.js';
import { DatabaseRelationshipInferrer } from './DatabaseRelationshipInferrer.js';

/** Color palette for connected-component groups (fill, stroke). Cycles if more groups than colors. */
const GROUP_COLORS: [fill: string, stroke: string][] = [
  ['#dae8fc', '#6c8ebf'], // blue
  ['#d5e8d4', '#82b366'], // green
  ['#fff2cc', '#d6b656'], // amber
  ['#f8cecc', '#b85450'], // red
  ['#e1d5e7', '#9673a6'], // purple
  ['#ffe6cc', '#d79b00'] // orange
];

export namespace DatabaseDiagramAssembler {
  export function assemble(
    tables: TableDescriptor[],
    foreignKeys: ForeignKeyDescriptor[],
    analysis: RelationshipAnalysis
  ): string {
    const { groups, junctionTables, m2mPairs } = analysis;
    const lines: string[] = ['---', 'title: TailoredIn \u2014 Database ERD (PostgreSQL)', '---', '', 'erDiagram'];

    const tableSet = new Set(tables.map(t => t.tableName));

    // Emit tables grouped by connected component
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const label = groups.length === 1 ? 'Tables' : group.length === 1 ? 'Standalone' : `Group ${i + 1}`;

      lines.push('');
      lines.push(MermaidEmitter.sectionHeader(label));
      lines.push('');

      for (const tableName of group) {
        const table = tables.find(t => t.tableName === tableName);
        if (!table) continue;
        const isJunction = junctionTables.has(tableName);
        lines.push(emitTable(table, isJunction));
        lines.push('');
      }
    }

    // Relationships section
    lines.push(MermaidEmitter.sectionHeader('Relationships'));
    lines.push('');

    const emittedRels = new Set<string>();
    for (const fk of foreignKeys) {
      if (!tableSet.has(fk.fromTable) || !tableSet.has(fk.toTable)) continue;

      const relKey = `${fk.toTable}->${fk.fromTable}`;
      if (emittedRels.has(relKey)) continue;
      emittedRels.add(relKey);

      const cardinality = DatabaseRelationshipInferrer.getCardinality(fk, tables);
      lines.push(`    ${fk.toTable} ${cardinality} ${fk.fromTable} : "has"`);
    }

    // Auto-detected many-to-many relationships
    for (const m2m of m2mPairs) {
      lines.push(`    ${m2m.left} }o--o{ ${m2m.right} : "many-to-many"`);
    }

    // Color-code tables by group
    lines.push('');
    lines.push(MermaidEmitter.sectionHeader('Styles'));
    lines.push('');

    for (let i = 0; i < groups.length; i++) {
      const [fill, stroke] = GROUP_COLORS[i % GROUP_COLORS.length];
      const className = `group${i}`;
      lines.push(MermaidEmitter.classDefDirective(className, fill, stroke));
      for (const tableName of groups[i]) {
        lines.push(MermaidEmitter.classAssignment(tableName, className));
      }
    }

    return `${lines.join('\n')}\n`;
  }
}

function emitTable(table: TableDescriptor, isJunction: boolean): string {
  const rows: ErColumnRow[] = [];

  for (const col of table.columns) {
    // Constraint marker: junction table PK+FK columns show as FK
    let constraint = '';
    if (col.isPrimaryKey && col.isForeignKey && isJunction) constraint = 'FK';
    else if (col.isPrimaryKey) constraint = 'PK';
    else if (col.isForeignKey) constraint = 'FK';
    else if (col.isUnique) constraint = 'UK';

    // Comment parts
    const parts: string[] = [];
    if (col.nullable) parts.push('nullable');
    if (col.defaultRaw) {
      parts.push(`default: ${cleanDefault(col.defaultRaw)}`);
    }
    if (col.isUnique && !col.isPrimaryKey && constraint !== 'UK') {
      parts.push('unique');
    }

    rows.push({
      type: col.dbType,
      name: col.fieldName,
      constraint,
      comment: parts.length > 0 ? `"${parts.join(', ')}"` : ''
    });
  }

  return MermaidEmitter.erTableBlock(table.tableName, rows);
}

function cleanDefault(raw: string): string {
  let d = raw;
  if ((d.startsWith("'") && d.endsWith("'")) || (d.startsWith('"') && d.endsWith('"'))) {
    d = d.slice(1, -1);
  }
  d = d.trim();
  return d || 'empty';
}
