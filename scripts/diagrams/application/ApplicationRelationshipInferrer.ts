/**
 * Infers relationships between application layer items for the Mermaid class diagram.
 * Pure data logic — no ts-morph dependency.
 */
import type { ApplicationDiagramItem } from '../shared/types.js';

export namespace ApplicationRelationshipInferrer {
  export function infer(allItems: Map<string, ApplicationDiagramItem>): string[] {
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
    return [t];
  }
}
