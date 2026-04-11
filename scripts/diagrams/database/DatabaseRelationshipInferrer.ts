/**
 * Infers database relationships, connected components, junction tables, and cardinality.
 * Pure data logic — no ts-morph dependency.
 */
import type { ForeignKeyDescriptor, TableDescriptor } from '../shared/types.js';

export type RelationshipAnalysis = {
  groups: string[][];
  junctionTables: Set<string>;
  m2mPairs: { left: string; right: string }[];
};

export namespace DatabaseRelationshipInferrer {
  export function analyze(tables: TableDescriptor[], foreignKeys: ForeignKeyDescriptor[]): RelationshipAnalysis {
    const tableNames = tables.map(t => t.tableName);

    // Detect junction tables: tables where all PK columns are also FK columns
    const junctionTables = new Set<string>();
    for (const table of tables) {
      const pkColumns = table.columns.filter(c => c.isPrimaryKey).map(c => c.fieldName);
      const fkColumns = new Set(table.columns.filter(c => c.isForeignKey).map(c => c.fieldName));
      if (pkColumns.length > 1 && pkColumns.every(pk => fkColumns.has(pk))) {
        junctionTables.add(table.tableName);
      }
    }

    // Auto-detect M2M pairs from junction tables
    const m2mPairs: { left: string; right: string }[] = [];
    for (const jt of junctionTables) {
      const targets = foreignKeys.filter(fk => fk.fromTable === jt).map(fk => fk.toTable);
      const uniqueTargets = [...new Set(targets)];
      if (uniqueTargets.length === 2) {
        m2mPairs.push({ left: uniqueTargets[0], right: uniqueTargets[1] });
      }
    }

    // Group tables by FK connectivity (connected components)
    const groups = findConnectedComponents(tableNames, foreignKeys);

    return { groups, junctionTables, m2mPairs };
  }

  /**
   * Determine relationship cardinality for a FK.
   * If the FK column has a unique constraint, it's one-to-one (||--o|).
   * Otherwise it's one-to-many (||--o{).
   */
  export function getCardinality(fk: ForeignKeyDescriptor, tables: TableDescriptor[]): string {
    const fromTable = tables.find(t => t.tableName === fk.fromTable);
    if (!fromTable) return '||--o{';

    const col = fromTable.columns.find(c => c.fieldName === fk.fromColumn);
    if (!col) return '||--o{';

    const isOneToOne = col.isUnique || col.isPrimaryKey;
    return isOneToOne ? '||--o|' : '||--o{';
  }
}

function findConnectedComponents(tableNames: string[], foreignKeys: ForeignKeyDescriptor[]): string[][] {
  const tableSet = new Set(tableNames);
  const adjacency = new Map<string, Set<string>>();
  for (const t of tableNames) adjacency.set(t, new Set());

  for (const fk of foreignKeys) {
    if (!tableSet.has(fk.fromTable) || !tableSet.has(fk.toTable)) continue;
    adjacency.get(fk.fromTable)!.add(fk.toTable);
    adjacency.get(fk.toTable)!.add(fk.fromTable);
  }

  const visited = new Set<string>();
  const components: string[][] = [];

  for (const table of tableNames) {
    if (visited.has(table)) continue;
    const component: string[] = [];
    const queue = [table];
    visited.add(table);
    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);
      for (const neighbor of adjacency.get(current)!) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    component.sort();
    components.push(component);
  }

  // Sort components: larger groups first, then alphabetically by first table
  components.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
  return components;
}
