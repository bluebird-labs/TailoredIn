/**
 * Extracts application layer items (use cases, ports, DTOs, errors) using ts-morph AST.
 * Replaces regex-based parsing from the original application/scripts/generate-diagram.ts.
 */
import { existsSync } from 'node:fs';
import type { ClassDeclaration, InterfaceDeclaration, Project, SourceFile, TypeAliasDeclaration } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';
import { MermaidEmitter } from '../shared/MermaidEmitter.js';
import type {
  ApplicationDiagramItem,
  BarrelEntry,
  ConstructorDep,
  DtoInfo,
  ErrorInfo,
  FieldInfo,
  PortInfo,
  PortMethodInfo,
  UseCaseInfo
} from '../shared/types.js';

export namespace ApplicationExtractor {
  /**
   * Extract all diagram items from barrel entries, auto-detecting domain port stubs.
   */
  export function extract(project: Project, entries: BarrelEntry[]): Map<string, ApplicationDiagramItem> {
    const allItems = new Map<string, ApplicationDiagramItem>();
    const parsedFiles = new Set<string>();

    // Deduplicate entries by name
    const entryByName = new Map<string, BarrelEntry>();
    for (const entry of entries) {
      entryByName.set(entry.exportedName, entry);
    }

    for (const [name, entry] of entryByName) {
      if (!existsSync(entry.sourceFile)) continue;

      if (entry.category === 'use-cases') {
        const sourceFile = project.getSourceFile(entry.sourceFile);
        if (!sourceFile) continue;
        const uc = parseUseCaseClass(sourceFile, name, entry.domain!);
        if (uc) allItems.set(name, uc);
      } else if (!parsedFiles.has(entry.sourceFile)) {
        parsedFiles.add(entry.sourceFile);
        const sourceFile = project.getSourceFile(entry.sourceFile);
        if (!sourceFile) continue;

        // Collect all target names from this file
        const targetNames = new Set<string>();
        for (const [n, e] of entryByName) {
          if (e.sourceFile === entry.sourceFile) targetNames.add(n);
        }

        if (entry.category === 'ports') {
          const items = parsePortFile(sourceFile, targetNames);
          for (const item of items) allItems.set(item.name, item);
        } else if (entry.category === 'dtos') {
          const items = parseDtoFile(sourceFile, targetNames);
          for (const item of items) allItems.set(item.name, item);
        } else if (entry.category === 'errors') {
          const items = parseErrorFile(sourceFile, targetNames);
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

    return allItems;
  }

  function parseUseCaseClass(sourceFile: SourceFile, className: string, domain: string): UseCaseInfo | null {
    const classDecl = sourceFile.getClass(className);
    if (!classDecl) return null;

    const constructorDeps = parseConstructorDeps(classDecl);
    const { executeInput, executeReturn } = parseExecuteMethod(classDecl);

    return {
      name: className,
      stereotype: 'UseCase',
      domain,
      constructorDeps,
      executeInput,
      executeReturn
    };
  }

  function parseConstructorDeps(classDecl: ClassDeclaration): ConstructorDep[] {
    const deps: ConstructorDep[] = [];
    const ctor = classDecl.getConstructors()[0];
    if (!ctor) return deps;

    for (const param of ctor.getParameters()) {
      if (!param.hasModifier(SyntaxKind.PrivateKeyword)) continue;
      if (!param.hasModifier(SyntaxKind.ReadonlyKeyword)) continue;
      const name = param.getName();
      // Get the type name — prefer the type node text to avoid fully-qualified names
      const typeNode = param.getTypeNode();
      const type = typeNode ? typeNode.getText() : param.getType().getText(param);
      deps.push({ name, type });
    }
    return deps;
  }

  function parseExecuteMethod(classDecl: ClassDeclaration): {
    executeInput: string | null;
    executeReturn: string;
  } {
    const method = classDecl.getMethod('execute');
    if (!method) return { executeInput: null, executeReturn: 'void' };

    // Parse input parameter type
    let executeInput: string | null = null;
    const params = method.getParameters();
    if (params.length > 0) {
      const typeNode = params[0].getTypeNode();
      executeInput = typeNode ? typeNode.getText() : null;
    }

    // Parse return type, stripping Promise<...> wrapper
    const returnTypeNode = method.getReturnTypeNode();
    let executeReturn = 'void';
    if (returnTypeNode) {
      const returnText = returnTypeNode.getText();
      // Strip Promise<...> wrapper
      const promiseMatch = returnText.match(/^Promise<(.+)>$/);
      executeReturn = promiseMatch ? promiseMatch[1].trim() : returnText;
    }

    return { executeInput, executeReturn };
  }

  function parsePortFile(sourceFile: SourceFile, targetNames: Set<string>): ApplicationDiagramItem[] {
    const items: ApplicationDiagramItem[] = [];

    // Parse interfaces
    for (const iface of sourceFile.getInterfaces()) {
      if (!targetNames.has(iface.getName())) continue;
      items.push(parseInterface(iface));
    }

    // Parse co-located result types
    for (const typeAlias of sourceFile.getTypeAliases()) {
      if (!targetNames.has(typeAlias.getName())) continue;
      const dto = parseTypeAliasAsDto(typeAlias);
      if (dto) items.push(dto);
    }

    return items;
  }

  function parseInterface(iface: InterfaceDeclaration): PortInfo {
    const methods: PortMethodInfo[] = [];
    for (const method of iface.getMethods()) {
      const name = method.getName();
      const params = method
        .getParameters()
        .map(p => {
          const paramName = p.getName();
          const isOptional = p.isOptional();
          return isOptional ? `${paramName}?` : paramName;
        })
        .filter(Boolean)
        .join(', ');
      const returnTypeNode = method.getReturnTypeNode();
      const returnType = returnTypeNode ? returnTypeNode.getText() : 'void';
      methods.push({ name, params, returnType });
    }
    return { name: iface.getName(), stereotype: 'Port', methods };
  }

  function parseDtoFile(sourceFile: SourceFile, targetNames: Set<string>): DtoInfo[] {
    const items: DtoInfo[] = [];
    for (const typeAlias of sourceFile.getTypeAliases()) {
      if (!targetNames.has(typeAlias.getName())) continue;
      const dto = parseTypeAliasAsDto(typeAlias);
      if (dto) items.push(dto);
    }
    return items;
  }

  function parseTypeAliasAsDto(typeAlias: TypeAliasDeclaration): DtoInfo | null {
    const name = typeAlias.getName();
    const typeNode = typeAlias.getTypeNode();
    if (!typeNode) return null;

    // Only parse object type literals
    if (typeNode.getKind() !== SyntaxKind.TypeLiteral) return null;

    const fields = parseTypeLiteralFields(typeNode);
    return { name, stereotype: 'DTO', fields };
  }

  function parseTypeLiteralFields(typeNode: import('ts-morph').Node): FieldInfo[] {
    const fields: FieldInfo[] = [];
    const typeLiteral = typeNode.asKind(SyntaxKind.TypeLiteral);
    if (!typeLiteral) return fields;

    for (const member of typeLiteral.getProperties()) {
      const name = member.getName();
      const memberTypeNode = member.getTypeNode();
      if (!memberTypeNode) continue;
      const rawType = memberTypeNode.getText();
      const nullable = rawType.includes('| null');
      const type = MermaidEmitter.formatType(rawType);
      fields.push({ name, type, nullable });
    }
    return fields;
  }

  function parseErrorFile(sourceFile: SourceFile, targetNames: Set<string>): ErrorInfo[] {
    const items: ErrorInfo[] = [];

    for (const classDecl of sourceFile.getClasses()) {
      const name = classDecl.getName();
      if (!name || !targetNames.has(name)) continue;

      // Must extend Error
      const extendsExpr = classDecl.getExtends();
      if (!extendsExpr || extendsExpr.getExpression().getText() !== 'Error') continue;

      // Parse public readonly properties with initializers
      const properties: FieldInfo[] = [];
      for (const prop of classDecl.getProperties()) {
        if (!prop.hasModifier(SyntaxKind.PublicKeyword)) continue;
        if (!prop.hasModifier(SyntaxKind.ReadonlyKeyword)) continue;
        const propName = prop.getName();
        const typeNode = prop.getTypeNode();
        const initializer = prop.getInitializer();
        const propType = typeNode
          ? typeNode.getText()
          : initializer
            ? inferTypeFromValue(initializer.getText())
            : 'string';
        properties.push({ name: propName, type: propType, nullable: false });
      }

      // Parse constructor params
      const constructorParams: string[] = [];
      const ctor = classDecl.getConstructors()[0];
      if (ctor) {
        for (const param of ctor.getParameters()) {
          // Only include params that have a type annotation (skip super() args)
          if (param.getTypeNode()) {
            constructorParams.push(param.getName());
          }
        }
      }

      items.push({ name, stereotype: 'Error', properties, constructorParams });
    }

    return items;
  }

  /** Infer a type from a literal value (e.g., 502 → number, 'foo' → string). */
  function inferTypeFromValue(value: string): string {
    if (/^\d+$/.test(value)) return 'number';
    if (value === 'true' || value === 'false') return 'boolean';
    return 'string';
  }
}
