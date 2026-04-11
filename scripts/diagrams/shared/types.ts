/**
 * Intermediate data structures shared by all diagram generators.
 * These decouple ts-morph extraction from Mermaid emission.
 */

// ─── Common ────────────────────────────────────────────────────────────────

export type StyleConfig = {
  fill: string;
  stroke: string;
  color: string;
  width: string;
};

// ─── Domain Diagram ────────────────────────────────────────────────────────

export type Stereotype =
  | 'AggregateRoot'
  | 'Entity'
  | 'ValueObject'
  | 'enumeration'
  | 'type'
  | 'DomainService'
  | 'DomainEvent';

export type PropertyInfo = { name: string; type: string; nullable: boolean };
export type MethodInfo = { name: string };

export type ClassInfo = {
  name: string;
  stereotype: Stereotype;
  idType: string | null;
  properties: PropertyInfo[];
  methods: MethodInfo[];
};

export type EnumInfo = {
  name: string;
  members: string[];
  stereotype: 'enumeration';
};

export type TypeAliasInfo = {
  name: string;
  members: string[];
  stereotype: 'type';
};

export type DomainDiagramItem = ClassInfo | EnumInfo | TypeAliasInfo;

export type SubdomainGroup = { label: string; members: string[] };

// ─── Application Diagram ───────────────────────────────────────────────────

export type AppCategory = 'use-cases' | 'ports' | 'dtos' | 'errors';

export type ConstructorDep = { name: string; type: string };
export type PortMethodInfo = { name: string; params: string; returnType: string };
export type FieldInfo = { name: string; type: string; nullable: boolean };

export type UseCaseInfo = {
  name: string;
  stereotype: 'UseCase';
  domain: string;
  constructorDeps: ConstructorDep[];
  executeInput: string | null;
  executeReturn: string;
};

export type PortInfo = {
  name: string;
  stereotype: 'Port';
  methods: PortMethodInfo[];
};

export type DtoInfo = {
  name: string;
  stereotype: 'DTO';
  fields: FieldInfo[];
};

export type ErrorInfo = {
  name: string;
  stereotype: 'Error';
  properties: FieldInfo[];
  constructorParams: string[];
};

export type DomainPortInfo = {
  name: string;
  stereotype: 'DomainPort';
};

export type ApplicationDiagramItem = UseCaseInfo | PortInfo | DtoInfo | ErrorInfo | DomainPortInfo;

export type BarrelEntry = {
  exportedName: string;
  sourceFile: string;
  category: AppCategory;
  domain: string | null;
};

// ─── Database Diagram ──────────────────────────────────────────────────────

export type ColumnDescriptor = {
  fieldName: string;
  dbType: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  uniqueConstraintName: string | null;
  defaultRaw: string | null;
  referencedTable: string | null;
  referencedColumn: string | null;
};

export type TableDescriptor = {
  tableName: string;
  entityClassName: string;
  columns: ColumnDescriptor[];
};

export type ForeignKeyDescriptor = {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  isUnique: boolean;
  isPrimaryKey: boolean;
};

export type ErColumnRow = {
  type: string;
  name: string;
  constraint: string;
  comment: string;
};
