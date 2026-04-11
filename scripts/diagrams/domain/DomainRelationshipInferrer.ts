/**
 * Infers relationships between domain model items for the Mermaid class diagram.
 * Pure data logic — no ts-morph dependency.
 */
import type { ClassInfo, DomainDiagramItem } from '../shared/types.js';

export namespace DomainRelationshipInferrer {
  export function infer(allItems: Map<string, DomainDiagramItem>): string[] {
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
          compositionTargets.add(`${name}\u2192${baseType}`);
        } else if (!isArray && voClassNames.has(baseType) && baseType !== name) {
          compositionTargets.add(`${name}\u2192${baseType}`);
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
          const key = `${name}\u2192${baseType}`;
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

            const composKey = `${matchedAggregate}\u2192${name}`;
            if (compositionTargets.has(composKey)) continue;

            const key = `${matchedAggregate}\u2192${name}`;
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
}

function isClassInfo(item: DomainDiagramItem): item is ClassInfo {
  return 'properties' in item && Array.isArray(item.properties) && 'idType' in item;
}
