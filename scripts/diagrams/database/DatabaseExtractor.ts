/**
 * Extracts database schema information from MikroORM entity decorators using ts-morph AST.
 * Replaces the SQL-based approach from the original infrastructure/scripts/generate-database-diagram.ts.
 */
import { resolve } from 'node:path';
import type { Decorator, Node, ObjectLiteralExpression, Project, PropertyDeclaration } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';
import type { ColumnDescriptor, ForeignKeyDescriptor, TableDescriptor } from '../shared/types.js';

/** Map MikroORM type strings to diagram-friendly type names. */
function mapType(ormType: string): string {
  // Array types
  if (ormType.endsWith('[]')) return `${mapType(ormType.slice(0, -2))}[]`;

  switch (ormType) {
    case 'uuid':
      return 'uuid';
    case 'text':
      return 'text';
    case 'varchar':
      return 'text';
    case 'integer':
      return 'integer';
    case 'boolean':
      return 'boolean';
    case 'timestamp':
    case 'timestamp(3)':
    case 'timestamptz':
      return 'timestamp';
    case 'tsvector':
      return 'tsvector';
    case 'json':
    case 'jsonb':
      return 'json';
    case 'float4':
    case 'float8':
    case 'numeric':
      return 'numeric';
    case 'blob':
      return 'bytea';
    default:
      return ormType;
  }
}

export namespace DatabaseExtractor {
  /**
   * Extract table and foreign key descriptors from all @Entity-decorated classes.
   */
  export function extract(
    project: Project,
    entitiesDir: string
  ): {
    tables: TableDescriptor[];
    foreignKeys: ForeignKeyDescriptor[];
  } {
    const tables: TableDescriptor[] = [];
    const foreignKeys: ForeignKeyDescriptor[] = [];

    // Build entity-to-table lookup for FK resolution
    const entityTableMap = new Map<string, string>();
    // Also build a set of known enum type names (PascalCase → snake_case)
    const enumTypeMap = new Map<string, string>(); // PascalCase → snake_case column type
    const sourceFiles = project.getSourceFiles(resolve(entitiesDir, '*.ts'));

    // Scan value-objects for enums
    const voDir = resolve(entitiesDir, '../value-objects');
    const voFiles = project.getSourceFiles(resolve(voDir, '*.ts'));
    for (const voFile of voFiles) {
      for (const enumDecl of voFile.getEnums()) {
        if (!enumDecl.isExported()) continue;
        const name = enumDecl.getName();
        // Convert PascalCase to snake_case for the DB column type name
        const snakeName = name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
        enumTypeMap.set(name, snakeName);
      }
    }

    // First pass: collect entity → tableName mapping
    for (const sourceFile of sourceFiles) {
      for (const classDecl of sourceFile.getClasses()) {
        const entityDecorator = classDecl.getDecorator('Entity');
        if (!entityDecorator) continue;
        const tableName = getDecoratorStringProp(entityDecorator, 'tableName');
        if (!tableName) continue;
        const className = classDecl.getName();
        if (className) entityTableMap.set(className, tableName);
      }
    }

    // Build a reverse lookup: snake_case table name → entity class name for FK inference
    const tableToEntity = new Map<string, string>();
    for (const [entity, table] of entityTableMap) {
      tableToEntity.set(table, entity);
    }

    // Second pass: extract full schema
    for (const sourceFile of sourceFiles) {
      for (const classDecl of sourceFile.getClasses()) {
        const entityDecorator = classDecl.getDecorator('Entity');
        if (!entityDecorator) continue;
        const tableName = getDecoratorStringProp(entityDecorator, 'tableName');
        if (!tableName) continue;
        const className = classDecl.getName() ?? tableName;

        const columns: ColumnDescriptor[] = [];

        for (const prop of classDecl.getProperties()) {
          const col = extractColumn(prop, entityTableMap, tableName, foreignKeys, enumTypeMap);
          if (col) columns.push(col);
        }

        tables.push({ tableName, entityClassName: className, columns });
      }
    }

    // Sort tables alphabetically for stable output
    tables.sort((a, b) => a.tableName.localeCompare(b.tableName));

    return { tables, foreignKeys };
  }

  function extractColumn(
    prop: PropertyDeclaration,
    entityTableMap: Map<string, string>,
    ownerTable: string,
    foreignKeys: ForeignKeyDescriptor[],
    enumTypeMap: Map<string, string>
  ): ColumnDescriptor | null {
    // Check for @PrimaryKey
    const pkDecorator = prop.getDecorator('PrimaryKey');
    if (pkDecorator) {
      const type = getDecoratorStringProp(pkDecorator, 'type') ?? 'uuid';
      const fieldName = getDecoratorStringProp(pkDecorator, 'fieldName') ?? prop.getName();
      return {
        fieldName,
        dbType: mapType(type),
        nullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        isUnique: false,
        uniqueConstraintName: null,
        defaultRaw: null,
        referencedTable: null,
        referencedColumn: null
      };
    }

    // Check for @ManyToOne (FK column)
    const manyToOneDecorator = prop.getDecorator('ManyToOne');
    if (manyToOneDecorator) {
      return extractManyToOneColumn(manyToOneDecorator, prop, entityTableMap, ownerTable, foreignKeys);
    }

    // Check for @Property
    const propertyDecorator = prop.getDecorator('Property');
    if (propertyDecorator) {
      return extractPropertyColumn(propertyDecorator, prop, entityTableMap, ownerTable, foreignKeys, enumTypeMap);
    }

    // Skip @OneToMany and undecorated properties
    return null;
  }

  function extractManyToOneColumn(
    decorator: Decorator,
    prop: PropertyDeclaration,
    entityTableMap: Map<string, string>,
    ownerTable: string,
    foreignKeys: ForeignKeyDescriptor[]
  ): ColumnDescriptor | null {
    const args = decorator.getArguments();
    if (args.length < 2) return null;

    // First arg: arrow function returning target entity
    const targetEntityName = extractArrowFunctionReturnText(args[0]);
    if (!targetEntityName) return null;

    // Second arg: options object
    const options = args[1].asKind(SyntaxKind.ObjectLiteralExpression);
    if (!options) return null;

    const fieldName = getObjectStringProp(options, 'fieldName') ?? prop.getName();
    const targetTable = entityTableMap.get(targetEntityName);

    // Determine uniqueness from Property decorator on the same property or context
    const isUnique = false; // ManyToOne is typically not unique unless also PK
    const isPk = false;

    if (targetTable) {
      foreignKeys.push({
        fromTable: ownerTable,
        fromColumn: fieldName,
        toTable: targetTable,
        toColumn: 'id',
        isUnique: isPk || isUnique,
        isPrimaryKey: isPk
      });
    }

    return {
      fieldName,
      dbType: 'uuid',
      nullable: false,
      isPrimaryKey: false,
      isForeignKey: true,
      isUnique,
      uniqueConstraintName: null,
      defaultRaw: null,
      referencedTable: targetTable ?? null,
      referencedColumn: targetTable ? 'id' : null
    };
  }

  function extractPropertyColumn(
    decorator: Decorator,
    prop: PropertyDeclaration,
    entityTableMap: Map<string, string>,
    ownerTable: string,
    foreignKeys: ForeignKeyDescriptor[],
    enumTypeMap: Map<string, string>
  ): ColumnDescriptor | null {
    const args = decorator.getArguments();
    if (args.length === 0) return null;

    const options = args[0].asKind(SyntaxKind.ObjectLiteralExpression);
    if (!options) return null;

    const fieldName = getObjectStringProp(options, 'fieldName') ?? prop.getName();
    const ormType = getObjectStringProp(options, 'type') ?? 'text';
    const nullable = getObjectBooleanProp(options, 'nullable') ?? false;
    const uniqueValue = getObjectStringProp(options, 'unique');
    const isUnique = uniqueValue !== null;
    const defaultRaw = getObjectStringProp(options, 'defaultRaw');

    // Detect enum-typed columns: when @Property has type 'text' but the TS type is a known enum
    let dbType = mapType(ormType);
    if (ormType === 'text') {
      const tsTypeNode = prop.getTypeNode();
      if (tsTypeNode) {
        const tsType = tsTypeNode
          .getText()
          .replace(/\s*\|\s*null/g, '')
          .trim();
        const enumSnakeName = enumTypeMap.get(tsType);
        if (enumSnakeName) dbType = enumSnakeName;
      }
    }

    // Detect implicit FK: uuid column with _id suffix that matches a known entity table
    let isForeignKey = false;
    let referencedTable: string | null = null;
    let referencedColumn: string | null = null;

    if (ormType === 'uuid' && fieldName.endsWith('_id') && fieldName !== 'id') {
      // Convert field name to potential table name: profile_id → profiles, company_id → companies
      const baseName = fieldName.replace(/_id$/, '');
      // Try pluralizing: add 's' or 'es' or 'ies'
      const candidates = [`${baseName}s`, `${baseName}es`, baseName.replace(/y$/, 'ies')];
      for (const candidate of candidates) {
        if ([...entityTableMap.values()].includes(candidate)) {
          isForeignKey = true;
          referencedTable = candidate;
          referencedColumn = 'id';

          foreignKeys.push({
            fromTable: ownerTable,
            fromColumn: fieldName,
            toTable: candidate,
            toColumn: 'id',
            isUnique,
            isPrimaryKey: false
          });
          break;
        }
      }
    }

    return {
      fieldName,
      dbType,
      nullable,
      isPrimaryKey: false,
      isForeignKey,
      isUnique,
      uniqueConstraintName: uniqueValue,
      defaultRaw,
      referencedTable,
      referencedColumn
    };
  }

  /** Extract the return expression text from an arrow function: `() => Foo` → `"Foo"`. */
  function extractArrowFunctionReturnText(node: Node): string | null {
    const arrow = node.asKind(SyntaxKind.ArrowFunction);
    if (!arrow) return null;
    const body = arrow.getBody();
    return body.getText();
  }

  /** Get a string property value from a decorator's first object literal argument. */
  function getDecoratorStringProp(decorator: Decorator, propName: string): string | null {
    const args = decorator.getArguments();
    if (args.length === 0) return null;
    const objLiteral = args[0].asKind(SyntaxKind.ObjectLiteralExpression);
    if (!objLiteral) return null;
    return getObjectStringProp(objLiteral, propName);
  }

  /** Get a string property value from an object literal. */
  function getObjectStringProp(obj: ObjectLiteralExpression, propName: string): string | null {
    const prop = obj.getProperty(propName);
    if (!prop) return null;
    const initializer = prop.asKind(SyntaxKind.PropertyAssignment)?.getInitializer();
    if (!initializer) return null;
    const text = initializer.getText();
    // Strip quotes from string literals
    if ((text.startsWith("'") && text.endsWith("'")) || (text.startsWith('"') && text.endsWith('"'))) {
      return text.slice(1, -1);
    }
    return text;
  }

  /** Get a boolean property value from an object literal. */
  function getObjectBooleanProp(obj: ObjectLiteralExpression, propName: string): boolean | null {
    const prop = obj.getProperty(propName);
    if (!prop) return null;
    const initializer = prop.asKind(SyntaxKind.PropertyAssignment)?.getInitializer();
    if (!initializer) return null;
    return initializer.getText() === 'true';
  }
}
