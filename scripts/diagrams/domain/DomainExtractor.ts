/**
 * Extracts domain model items (classes, enums, type aliases) using ts-morph AST.
 * Replaces regex-based parsing from the original domain/scripts/generate-diagram.ts.
 */
import { existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import type { ClassDeclaration, Project, PropertyDeclaration, SourceFile } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';
import { MermaidEmitter } from '../shared/MermaidEmitter.js';
import type {
  ClassInfo,
  DomainDiagramItem,
  EnumInfo,
  MethodInfo,
  PropertyInfo,
  Stereotype,
  TypeAliasInfo
} from '../shared/types.js';

const SCAN_DIRS = ['entities', 'value-objects', 'domain-services', 'events'] as const;
type SourceDir = (typeof SCAN_DIRS)[number];

/** Properties to exclude (noise / boilerplate). */
const EXCLUDED_PROPS = new Set(['createdAt', 'updatedAt', 'eventName', 'occurredAt', 'id']);

/** Methods to exclude (factories / boilerplate). */
const EXCLUDED_METHODS = new Set(['create', 'empty', 'constructor']);

export namespace DomainExtractor {
  /**
   * Extract all diagram items from the domain source, filtered to barrel-exported names.
   */
  export function extract(
    project: Project,
    domainSrcPath: string,
    barrelExports: Set<string>
  ): Map<string, DomainDiagramItem> {
    const allItems = new Map<string, DomainDiagramItem>();

    for (const dir of SCAN_DIRS) {
      const fullPath = resolve(domainSrcPath, dir);
      if (!existsSync(fullPath)) continue;

      const sourceFiles = project.getSourceFiles(resolve(fullPath, '*.ts'));
      for (const sourceFile of sourceFiles) {
        const items = parseSourceFile(sourceFile, dir);
        for (const item of items) {
          if (barrelExports.has(item.name)) {
            allItems.set(item.name, item);
          }
        }
      }
    }

    return allItems;
  }

  function parseSourceFile(sourceFile: SourceFile, sourceDir: SourceDir): DomainDiagramItem[] {
    const fileName = basename(sourceFile.getFilePath());
    const items: DomainDiagramItem[] = [];

    // Skip ID value objects in value-objects/
    if (sourceDir === 'value-objects' && /Id\.ts$/.test(fileName)) return items;

    // Parse enums
    for (const enumDecl of sourceFile.getEnums()) {
      if (!enumDecl.isExported()) continue;
      const name = enumDecl.getName();
      const members = enumDecl.getMembers().map(m => m.getName());
      items.push({ name, members, stereotype: 'enumeration' } satisfies EnumInfo);
    }

    // Parse type aliases
    for (const typeAlias of sourceFile.getTypeAliases()) {
      if (!typeAlias.isExported()) continue;
      const name = typeAlias.getName();
      const typeNode = typeAlias.getTypeNode();
      if (!typeNode) continue;

      // Union literal types: export type Foo = 'a' | 'b';
      if (typeNode.getKind() === SyntaxKind.UnionType) {
        const unionTypes = typeNode.asKind(SyntaxKind.UnionType)?.getTypeNodes() ?? [];
        const allLiterals = unionTypes.every(t => t.getKind() === SyntaxKind.LiteralType);
        if (allLiterals && unionTypes.length > 0) {
          const members = unionTypes.map(t => {
            const text = t.getText();
            return text.replace(/^'|'$/g, '');
          });
          items.push({ name, members, stereotype: 'type' } satisfies TypeAliasInfo);
          continue;
        }
      }

      // Object type aliases: export type Foo = { ... };
      if (typeNode.getKind() === SyntaxKind.TypeLiteral) {
        if (name.endsWith('Props') || name.endsWith('Sections')) continue;
        const properties = parseTypeLiteralProperties(typeNode);
        if (properties.length > 0) {
          items.push({
            name,
            stereotype: 'ValueObject',
            idType: null,
            properties,
            methods: []
          } satisfies ClassInfo);
        }
      }
    }

    // Parse classes
    for (const classDecl of sourceFile.getClasses()) {
      if (!classDecl.isExported()) continue;
      const name = classDecl.getName();
      if (!name) continue;

      const extendsExpr = classDecl.getExtends();
      const typeArgs = extendsExpr?.getTypeArguments() ?? [];
      // Only capture simple word type parameters (e.g., ProfileId), not complex types like { ... }
      const firstTypeArg = typeArgs.length > 0 ? typeArgs[0].getText() : null;
      const typeParam = firstTypeArg && /^\w+$/.test(firstTypeArg) ? firstTypeArg : null;

      const stereotype = classifyClass(classDecl, sourceDir);
      if (!stereotype) continue;

      let properties: PropertyInfo[];
      if (stereotype === 'DomainEvent') {
        properties = parseConstructorProperties(classDecl);
      } else {
        properties = parseClassProperties(classDecl);
      }

      const methods = parseClassMethods(classDecl);
      const getters = parseGetters(classDecl);

      items.push({
        name,
        stereotype,
        idType: typeParam,
        properties,
        methods: [...getters, ...methods]
      } satisfies ClassInfo);
    }

    return items;
  }

  function classifyClass(classDecl: ClassDeclaration, sourceDir: SourceDir): Stereotype | null {
    const extendsExpr = classDecl.getExtends();
    if (extendsExpr) {
      // Resolve the actual base class name via the type system to handle import aliases
      // (e.g., `import { Entity as DomainEntity }` → `extends DomainEntity`)
      const baseType = extendsExpr.getType();
      const baseSymbol = baseType.getSymbol();
      const resolvedBaseName = baseSymbol?.getName() ?? extendsExpr.getExpression().getText();

      if (resolvedBaseName === 'AggregateRoot') return 'AggregateRoot';
      if (resolvedBaseName === 'Entity') return 'Entity';
      if (resolvedBaseName === 'ValueObject') return 'ValueObject';
    }

    const implementsExprs = classDecl.getImplements();
    if (implementsExprs.length > 0) {
      const ifaceType = implementsExprs[0].getType();
      const ifaceSymbol = ifaceType.getSymbol();
      const resolvedIfaceName = ifaceSymbol?.getName() ?? implementsExprs[0].getExpression().getText();
      if (resolvedIfaceName === 'DomainEvent') return 'DomainEvent';
    }

    if (sourceDir === 'domain-services') return 'DomainService';
    if (sourceDir === 'value-objects') return 'ValueObject';
    return null;
  }

  function parseClassProperties(classDecl: ClassDeclaration): PropertyInfo[] {
    const props: PropertyInfo[] = [];
    for (const prop of classDecl.getProperties()) {
      if (!prop.hasModifier(SyntaxKind.PublicKeyword)) continue;
      const name = prop.getName();
      if (EXCLUDED_PROPS.has(name)) continue;
      // Skip computed properties like [OptionalProps]
      if (name.startsWith('[')) continue;
      const rawType = getPropertyTypeText(prop);
      // Skip Collection-typed properties (MikroORM @OneToMany)
      if (rawType.startsWith('Collection<') || rawType.includes('Collection<')) continue;
      const nullable = rawType.includes('| null');
      const type = MermaidEmitter.formatType(rawType);
      props.push({ name, type, nullable });
    }
    return props;
  }

  function parseConstructorProperties(classDecl: ClassDeclaration): PropertyInfo[] {
    const props: PropertyInfo[] = [];
    const ctor = classDecl.getConstructors()[0];
    if (!ctor) return props;

    for (const param of ctor.getParameters()) {
      if (!param.hasModifier(SyntaxKind.PublicKeyword)) continue;
      if (!param.hasModifier(SyntaxKind.ReadonlyKeyword)) continue;
      const name = param.getName();
      if (EXCLUDED_PROPS.has(name)) continue;
      const rawType = param.getType().getText(param);
      const nullable = rawType.includes('| null');
      const type = MermaidEmitter.formatType(rawType);
      props.push({ name, type, nullable });
    }
    return props;
  }

  function parseTypeLiteralProperties(typeNode: import('ts-morph').Node): PropertyInfo[] {
    const props: PropertyInfo[] = [];
    const typeLiteral = typeNode.asKind(SyntaxKind.TypeLiteral);
    if (!typeLiteral) return props;

    for (const member of typeLiteral.getProperties()) {
      const name = member.getName();
      if (EXCLUDED_PROPS.has(name)) continue;
      const typeNodeChild = member.getTypeNode();
      if (!typeNodeChild) continue;
      const rawType = typeNodeChild.getText();
      const nullable = rawType.includes('| null');
      const type = MermaidEmitter.formatType(rawType);
      props.push({ name, type, nullable });
    }
    return props;
  }

  function parseClassMethods(classDecl: ClassDeclaration): MethodInfo[] {
    const methods: MethodInfo[] = [];
    for (const method of classDecl.getMethods()) {
      if (!method.hasModifier(SyntaxKind.PublicKeyword)) continue;
      if (method.hasModifier(SyntaxKind.StaticKeyword)) continue;
      const name = method.getName();
      if (EXCLUDED_METHODS.has(name)) continue;
      methods.push({ name });
    }
    return methods;
  }

  function parseGetters(classDecl: ClassDeclaration): MethodInfo[] {
    const getters: MethodInfo[] = [];
    for (const getter of classDecl.getGetAccessors()) {
      if (!getter.hasModifier(SyntaxKind.PublicKeyword)) continue;
      const name = getter.getName();
      if (EXCLUDED_PROPS.has(name)) continue;
      getters.push({ name });
    }
    return getters;
  }

  function getPropertyTypeText(prop: PropertyDeclaration): string {
    const typeNode = prop.getTypeNode();
    if (typeNode) return typeNode.getText();
    // Fallback to inferred type
    return prop.getType().getText(prop);
  }
}
