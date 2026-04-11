import type { Connection } from '@mikro-orm/postgresql';
import { Logger } from '@tailoredin/core';
import type { EscoDataset } from './EscoDataset.js';

const BATCH_SIZE = 500;
const ESCO_VERSION = '1.2.1';

type TableImport = {
  table: string;
  columns: string[];
  conflictColumns: string[];
  rows: unknown[][];
};

export class EscoImporter {
  private readonly log = Logger.create('esco-importer');

  public constructor(private readonly connection: Connection) {}

  public async importAll(dataset: EscoDataset): Promise<void> {
    const totalStart = performance.now();

    // Phase 1: Concept tables (order matters for FK references)
    await this.importTable(this.buildIscoGroups(dataset));
    await this.importTable(this.buildSkillGroups(dataset));
    await this.importTable(this.buildSkills(dataset));
    await this.importTable(this.buildOccupations(dataset));
    await this.importTable(this.buildConceptSchemes(dataset));
    await this.importTable(this.buildDictionary(dataset));

    // Phase 2: Relationship tables
    await this.importTable(this.buildOccupationSkillRelations(dataset));
    await this.importTable(this.buildSkillSkillRelations(dataset));
    await this.importTable(this.buildBroaderRelationsOccPillar(dataset));
    await this.importTable(this.buildBroaderRelationsSkillPillar(dataset));
    await this.importSkillsHierarchy(dataset);

    // Phase 3: Collection tables
    await this.importTable(this.buildSkillCollections(dataset));
    await this.importTable(this.buildOccupationCollections(dataset));
    await this.importTable(this.buildGreenShareOccupations(dataset));

    const elapsed = ((performance.now() - totalStart) / 1000).toFixed(2);
    this.log.info(`Done in ${elapsed}s`);
  }

  private async importTable(spec: TableImport): Promise<void> {
    const start = performance.now();
    const { table, columns, conflictColumns, rows } = spec;

    // Deduplicate by conflict key (last occurrence wins) to avoid
    // "ON CONFLICT DO UPDATE cannot affect row a second time" within a batch
    const conflictIndexes = conflictColumns.map(c => columns.indexOf(c));
    const deduped = new Map<string, unknown[]>();
    for (const row of rows) {
      const key = conflictIndexes.map(i => row[i]).join('\0');
      deduped.set(key, row);
    }
    const uniqueRows = [...deduped.values()];

    for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
      const batch = uniqueRows.slice(i, i + BATCH_SIZE);
      await this.batchUpsert(table, columns, conflictColumns, batch);
    }

    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    this.log.info(`${table}: ${uniqueRows.length} rows (${elapsed}s)`);
  }

  private async batchUpsert(
    table: string,
    columns: string[],
    conflictColumns: string[],
    rows: unknown[][]
  ): Promise<void> {
    if (rows.length === 0) return;

    const colList = columns.map(c => `"${c}"`).join(', ');
    const conflictList = conflictColumns.map(c => `"${c}"`).join(', ');
    const updateCols = columns.filter(c => !conflictColumns.includes(c));
    const updateSet = updateCols.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');

    const params: unknown[] = [];
    const valueTuples: string[] = [];
    for (const row of rows) {
      const placeholders = row.map(val => {
        params.push(val);
        return '?';
      });
      valueTuples.push(`(${placeholders.join(', ')})`);
    }

    let sql = `INSERT INTO "${table}" (${colList}) VALUES ${valueTuples.join(', ')}`;
    if (updateSet) {
      sql += ` ON CONFLICT (${conflictList}) DO UPDATE SET ${updateSet}`;
    } else {
      sql += ` ON CONFLICT (${conflictList}) DO NOTHING`;
    }

    await this.connection.execute(sql, params, 'run');
  }

  private async importSkillsHierarchy(dataset: EscoDataset): Promise<void> {
    const start = performance.now();
    const table = 'esco_skills_hierarchy';

    // DELETE + INSERT (no natural unique key for upsert)
    await this.connection.execute(`DELETE FROM "${table}"`);

    const columns = [
      'level0_uri',
      'level0_preferred_term',
      'level1_uri',
      'level1_preferred_term',
      'level2_uri',
      'level2_preferred_term',
      'level3_uri',
      'level3_preferred_term',
      'description',
      'scope_note',
      'level0_code',
      'level1_code',
      'level2_code',
      'level3_code'
    ];

    const rows = dataset.skillsHierarchy.map(h => [
      h['Level 0 URI'],
      h['Level 0 preferred term'],
      h['Level 1 URI'] ?? null,
      h['Level 1 preferred term'] ?? null,
      h['Level 2 URI'] ?? null,
      h['Level 2 preferred term'] ?? null,
      h['Level 3 URI'] ?? null,
      h['Level 3 preferred term'] ?? null,
      h.Description ?? null,
      h['Scope note'] ?? null,
      h['Level 0 code'],
      h['Level 1 code'] ?? null,
      h['Level 2 code'] ?? null,
      h['Level 3 code'] ?? null
    ]);

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const params: unknown[] = [];
      const valueTuples: string[] = [];
      for (const row of batch) {
        const placeholders = row.map(val => {
          params.push(val);
          return '?';
        });
        valueTuples.push(`(${placeholders.join(', ')})`);
      }
      const colList = columns.map(c => `"${c}"`).join(', ');
      await this.connection.execute(
        `INSERT INTO "${table}" (${colList}) VALUES ${valueTuples.join(', ')}`,
        params,
        'run'
      );
    }

    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    this.log.info(`${table}: ${rows.length} rows (${elapsed}s)`);
  }

  // --- Concept table builders ---

  private buildSkills(dataset: EscoDataset): TableImport {
    const columns = [
      'concept_uri',
      'concept_type',
      'skill_type',
      'reuse_level',
      'preferred_label',
      'alt_labels',
      'hidden_labels',
      'status',
      'modified_date',
      'scope_note',
      'definition',
      'in_scheme',
      'description',
      'esco_version'
    ];
    return {
      table: 'esco_skills',
      columns,
      conflictColumns: ['concept_uri'],
      rows: dataset.skills.map(s => [
        s.conceptUri,
        s.conceptType,
        s.skillType ?? null,
        s.reuseLevel ?? null,
        s.preferredLabel,
        s.altLabels ?? null,
        s.hiddenLabels ?? null,
        s.status,
        s.modifiedDate ?? null,
        s.scopeNote ?? null,
        s.definition ?? null,
        s.inScheme ?? null,
        s.description ?? null,
        ESCO_VERSION
      ])
    };
  }

  private buildOccupations(dataset: EscoDataset): TableImport {
    const columns = [
      'concept_uri',
      'concept_type',
      'isco_group',
      'preferred_label',
      'alt_labels',
      'hidden_labels',
      'status',
      'modified_date',
      'regulated_profession_note',
      'scope_note',
      'definition',
      'in_scheme',
      'description',
      'code',
      'nace_code',
      'esco_version'
    ];
    return {
      table: 'esco_occupations',
      columns,
      conflictColumns: ['concept_uri'],
      rows: dataset.occupations.map(o => [
        o.conceptUri,
        o.conceptType,
        o.iscoGroup,
        o.preferredLabel,
        o.altLabels ?? null,
        o.hiddenLabels ?? null,
        o.status,
        o.modifiedDate ?? null,
        o.regulatedProfessionNote ?? null,
        o.scopeNote ?? null,
        o.definition ?? null,
        o.inScheme ?? null,
        o.description ?? null,
        o.code,
        o.naceCode ?? null,
        ESCO_VERSION
      ])
    };
  }

  private buildIscoGroups(dataset: EscoDataset): TableImport {
    const columns = [
      'concept_uri',
      'concept_type',
      'code',
      'preferred_label',
      'status',
      'alt_labels',
      'in_scheme',
      'description',
      'esco_version'
    ];
    return {
      table: 'esco_isco_groups',
      columns,
      conflictColumns: ['concept_uri'],
      rows: dataset.iscoGroups.map(g => [
        g.conceptUri,
        g.conceptType,
        g.code,
        g.preferredLabel,
        g.status,
        g.altLabels ?? null,
        g.inScheme ?? null,
        g.description ?? null,
        ESCO_VERSION
      ])
    };
  }

  private buildSkillGroups(dataset: EscoDataset): TableImport {
    const columns = [
      'concept_uri',
      'concept_type',
      'preferred_label',
      'alt_labels',
      'hidden_labels',
      'status',
      'modified_date',
      'scope_note',
      'in_scheme',
      'description',
      'code',
      'esco_version'
    ];
    return {
      table: 'esco_skill_groups',
      columns,
      conflictColumns: ['concept_uri'],
      rows: dataset.skillGroups.map(g => [
        g.conceptUri,
        g.conceptType,
        g.preferredLabel,
        g.altLabels ?? null,
        g.hiddenLabels ?? null,
        g.status,
        g.modifiedDate ?? null,
        g.scopeNote ?? null,
        g.inScheme ?? null,
        g.description ?? null,
        g.code,
        ESCO_VERSION
      ])
    };
  }

  private buildConceptSchemes(dataset: EscoDataset): TableImport {
    const columns = [
      'concept_scheme_uri',
      'concept_type',
      'preferred_label',
      'title',
      'status',
      'description',
      'has_top_concept',
      'esco_version'
    ];
    return {
      table: 'esco_concept_schemes',
      columns,
      conflictColumns: ['concept_scheme_uri'],
      rows: dataset.conceptSchemes.map(cs => [
        cs.conceptSchemeUri,
        cs.conceptType,
        cs.preferredLabel,
        cs.title ?? null,
        cs.status ?? null,
        cs.description ?? null,
        cs.hasTopConcept ?? null,
        ESCO_VERSION
      ])
    };
  }

  private buildDictionary(dataset: EscoDataset): TableImport {
    const columns = ['filename', 'data_header', 'property', 'description', 'esco_version'];
    return {
      table: 'esco_dictionary',
      columns,
      conflictColumns: ['filename', 'data_header'],
      rows: dataset.dictionary.map(d => [
        d.filename,
        d['data header'],
        d.property ?? null,
        d.description ?? null,
        ESCO_VERSION
      ])
    };
  }

  // --- Relationship table builders ---

  private buildOccupationSkillRelations(dataset: EscoDataset): TableImport {
    const columns = ['occupation_uri', 'skill_uri', 'occupation_label', 'relation_type', 'skill_type', 'skill_label'];
    return {
      table: 'esco_occupation_skill_relations',
      columns,
      conflictColumns: ['occupation_uri', 'skill_uri'],
      rows: dataset.occupationSkillRelations.map(r => [
        r.occupationUri,
        r.skillUri,
        r.occupationLabel,
        r.relationType,
        r.skillType ?? null,
        r.skillLabel
      ])
    };
  }

  private buildSkillSkillRelations(dataset: EscoDataset): TableImport {
    const columns = [
      'original_skill_uri',
      'related_skill_uri',
      'original_skill_type',
      'relation_type',
      'related_skill_type'
    ];
    return {
      table: 'esco_skill_skill_relations',
      columns,
      conflictColumns: ['original_skill_uri', 'related_skill_uri'],
      rows: dataset.skillSkillRelations.map(r => [
        r.originalSkillUri,
        r.relatedSkillUri,
        r.originalSkillType,
        r.relationType,
        r.relatedSkillType
      ])
    };
  }

  private buildBroaderRelationsOccPillar(dataset: EscoDataset): TableImport {
    const columns = ['concept_uri', 'broader_uri', 'concept_type', 'concept_label', 'broader_type', 'broader_label'];
    return {
      table: 'esco_broader_relations_occ_pillar',
      columns,
      conflictColumns: ['concept_uri', 'broader_uri'],
      rows: dataset.broaderRelationsOccPillar.map(r => [
        r.conceptUri,
        r.broaderUri,
        r.conceptType,
        r.conceptLabel,
        r.broaderType,
        r.broaderLabel
      ])
    };
  }

  private buildBroaderRelationsSkillPillar(dataset: EscoDataset): TableImport {
    const columns = ['concept_uri', 'broader_uri', 'concept_type', 'concept_label', 'broader_type', 'broader_label'];
    return {
      table: 'esco_broader_relations_skill_pillar',
      columns,
      conflictColumns: ['concept_uri', 'broader_uri'],
      rows: dataset.broaderRelationsSkillPillar.map(r => [
        r.conceptUri,
        r.broaderUri,
        r.conceptType,
        r.conceptLabel,
        r.broaderType,
        r.broaderLabel
      ])
    };
  }

  // --- Collection table builders ---

  private buildSkillCollections(dataset: EscoDataset): TableImport {
    const columns = [
      'concept_uri',
      'collection_type',
      'concept_type',
      'preferred_label',
      'status',
      'skill_type',
      'reuse_level',
      'alt_labels',
      'description',
      'broader_concept_uri',
      'broader_concept_pt'
    ];

    const entries: { type: string; data: readonly import('./schemas/skill-collection.js').SkillCollection[] }[] = [
      { type: 'green', data: dataset.greenSkillsCollection },
      { type: 'digital', data: dataset.digitalSkillsCollection },
      { type: 'digcomp', data: dataset.digCompSkillsCollection },
      { type: 'transversal', data: dataset.transversalSkillsCollection },
      { type: 'language', data: dataset.languageSkillsCollection },
      { type: 'research', data: dataset.researchSkillsCollection }
    ];

    const rows: unknown[][] = [];
    for (const entry of entries) {
      for (const sc of entry.data) {
        rows.push([
          sc.conceptUri,
          entry.type,
          sc.conceptType,
          sc.preferredLabel,
          sc.status,
          sc.skillType ?? null,
          sc.reuseLevel ?? null,
          sc.altLabels ?? null,
          sc.description ?? null,
          sc.broaderConceptUri ?? null,
          sc.broaderConceptPT ?? null
        ]);
      }
    }

    return { table: 'esco_skill_collections', columns, conflictColumns: ['concept_uri', 'collection_type'], rows };
  }

  private buildOccupationCollections(dataset: EscoDataset): TableImport {
    const columns = [
      'concept_uri',
      'concept_type',
      'preferred_label',
      'status',
      'alt_labels',
      'description',
      'broader_concept_uri',
      'broader_concept_pt'
    ];
    return {
      table: 'esco_occupation_collections',
      columns,
      conflictColumns: ['concept_uri'],
      rows: dataset.researchOccupationsCollection.map(oc => [
        oc.conceptUri,
        oc.conceptType,
        oc.preferredLabel,
        oc.status,
        oc.altLabels ?? null,
        oc.description ?? null,
        oc.broaderConceptUri ?? null,
        oc.broaderConceptPT ?? null
      ])
    };
  }

  private buildGreenShareOccupations(dataset: EscoDataset): TableImport {
    const columns = ['concept_uri', 'concept_type', 'code', 'preferred_label', 'green_share'];
    return {
      table: 'esco_green_share_occupations',
      columns,
      conflictColumns: ['concept_uri'],
      rows: dataset.greenShareOcc.map(g => [g.conceptUri, g.conceptType, g.code, g.preferredLabel, g.greenShare])
    };
  }
}
