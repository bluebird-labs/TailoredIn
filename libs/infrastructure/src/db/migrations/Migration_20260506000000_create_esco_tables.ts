import { Migration } from '@mikro-orm/migrations';

export class Migration_20260506000000_create_esco_tables extends Migration {
  override async up(): Promise<void> {
    // 1. Concept schemes
    this.addSql(`
      CREATE TABLE "esco_concept_schemes" (
        "concept_scheme_uri" text NOT NULL,
        "concept_type" text NOT NULL,
        "preferred_label" text NOT NULL,
        "title" text NULL,
        "status" text NULL,
        "description" text NULL,
        "has_top_concept" text NULL,
        "esco_version" text NOT NULL DEFAULT '1.2.1',
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "esco_concept_schemes_pkey" PRIMARY KEY ("concept_scheme_uri")
      );
    `);

    // 2. Dictionary (metadata)
    this.addSql(`
      CREATE TABLE "esco_dictionary" (
        "filename" text NOT NULL,
        "data_header" text NOT NULL,
        "property" text NULL,
        "description" text NULL,
        "esco_version" text NOT NULL DEFAULT '1.2.1',
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "esco_dictionary_pkey" PRIMARY KEY ("filename", "data_header")
      );
    `);

    // 3. ISCO groups
    this.addSql(`
      CREATE TABLE "esco_isco_groups" (
        "concept_uri" text NOT NULL,
        "concept_type" text NOT NULL,
        "code" text NOT NULL,
        "preferred_label" text NOT NULL,
        "status" text NOT NULL,
        "alt_labels" text NULL,
        "in_scheme" text NULL,
        "description" text NULL,
        "esco_version" text NOT NULL DEFAULT '1.2.1',
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "esco_isco_groups_pkey" PRIMARY KEY ("concept_uri")
      );
    `);
    this.addSql(`CREATE INDEX "esco_isco_groups_code_idx" ON "esco_isco_groups" ("code");`);

    // 4. Skill groups
    this.addSql(`
      CREATE TABLE "esco_skill_groups" (
        "concept_uri" text NOT NULL,
        "concept_type" text NOT NULL,
        "preferred_label" text NOT NULL,
        "alt_labels" text NULL,
        "hidden_labels" text NULL,
        "status" text NOT NULL,
        "modified_date" text NULL,
        "scope_note" text NULL,
        "in_scheme" text NULL,
        "description" text NULL,
        "code" text NOT NULL,
        "esco_version" text NOT NULL DEFAULT '1.2.1',
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "esco_skill_groups_pkey" PRIMARY KEY ("concept_uri")
      );
    `);
    this.addSql(`CREATE INDEX "esco_skill_groups_code_idx" ON "esco_skill_groups" ("code");`);

    // 5. Skills
    this.addSql(`
      CREATE TABLE "esco_skills" (
        "concept_uri" text NOT NULL,
        "concept_type" text NOT NULL,
        "skill_type" text NULL,
        "reuse_level" text NULL,
        "preferred_label" text NOT NULL,
        "alt_labels" text NULL,
        "hidden_labels" text NULL,
        "status" text NOT NULL,
        "modified_date" text NULL,
        "scope_note" text NULL,
        "definition" text NULL,
        "in_scheme" text NULL,
        "description" text NULL,
        "esco_version" text NOT NULL DEFAULT '1.2.1',
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "esco_skills_pkey" PRIMARY KEY ("concept_uri")
      );
    `);
    this.addSql(`CREATE INDEX "esco_skills_skill_type_idx" ON "esco_skills" ("skill_type");`);
    this.addSql(`CREATE INDEX "esco_skills_reuse_level_idx" ON "esco_skills" ("reuse_level");`);
    this.addSql(`CREATE INDEX "esco_skills_status_idx" ON "esco_skills" ("status");`);

    // 6. Occupations
    this.addSql(`
      CREATE TABLE "esco_occupations" (
        "concept_uri" text NOT NULL,
        "concept_type" text NOT NULL,
        "isco_group" text NOT NULL,
        "preferred_label" text NOT NULL,
        "alt_labels" text NULL,
        "hidden_labels" text NULL,
        "status" text NOT NULL,
        "modified_date" text NULL,
        "regulated_profession_note" text NULL,
        "scope_note" text NULL,
        "definition" text NULL,
        "in_scheme" text NULL,
        "description" text NULL,
        "code" text NOT NULL,
        "nace_code" text NULL,
        "esco_version" text NOT NULL DEFAULT '1.2.1',
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "esco_occupations_pkey" PRIMARY KEY ("concept_uri")
      );
    `);
    this.addSql(`CREATE INDEX "esco_occupations_isco_group_idx" ON "esco_occupations" ("isco_group");`);
    this.addSql(`CREATE INDEX "esco_occupations_code_idx" ON "esco_occupations" ("code");`);
    this.addSql(`CREATE INDEX "esco_occupations_status_idx" ON "esco_occupations" ("status");`);

    // 7. Occupation-skill relations (FK → occupations, skills)
    this.addSql(`
      CREATE TABLE "esco_occupation_skill_relations" (
        "occupation_uri" text NOT NULL,
        "skill_uri" text NOT NULL,
        "occupation_label" text NOT NULL,
        "relation_type" text NOT NULL,
        "skill_type" text NULL,
        "skill_label" text NOT NULL,
        CONSTRAINT "esco_occupation_skill_relations_pkey" PRIMARY KEY ("occupation_uri", "skill_uri"),
        CONSTRAINT "esco_osr_occupation_fk" FOREIGN KEY ("occupation_uri") REFERENCES "esco_occupations" ("concept_uri") ON DELETE CASCADE,
        CONSTRAINT "esco_osr_skill_fk" FOREIGN KEY ("skill_uri") REFERENCES "esco_skills" ("concept_uri") ON DELETE CASCADE
      );
    `);
    this.addSql(
      `CREATE INDEX "esco_occupation_skill_relations_skill_uri_idx" ON "esco_occupation_skill_relations" ("skill_uri");`
    );

    // 8. Skill-skill relations (FK → skills x2)
    this.addSql(`
      CREATE TABLE "esco_skill_skill_relations" (
        "original_skill_uri" text NOT NULL,
        "related_skill_uri" text NOT NULL,
        "original_skill_type" text NOT NULL,
        "relation_type" text NOT NULL,
        "related_skill_type" text NOT NULL,
        CONSTRAINT "esco_skill_skill_relations_pkey" PRIMARY KEY ("original_skill_uri", "related_skill_uri"),
        CONSTRAINT "esco_ssr_original_fk" FOREIGN KEY ("original_skill_uri") REFERENCES "esco_skills" ("concept_uri") ON DELETE CASCADE,
        CONSTRAINT "esco_ssr_related_fk" FOREIGN KEY ("related_skill_uri") REFERENCES "esco_skills" ("concept_uri") ON DELETE CASCADE
      );
    `);
    this.addSql(
      `CREATE INDEX "esco_skill_skill_relations_related_skill_uri_idx" ON "esco_skill_skill_relations" ("related_skill_uri");`
    );

    // 9. Broader relations — occupation pillar (polymorphic, no FK)
    this.addSql(`
      CREATE TABLE "esco_broader_relations_occ_pillar" (
        "concept_uri" text NOT NULL,
        "broader_uri" text NOT NULL,
        "concept_type" text NOT NULL,
        "concept_label" text NOT NULL,
        "broader_type" text NOT NULL,
        "broader_label" text NOT NULL,
        CONSTRAINT "esco_broader_relations_occ_pillar_pkey" PRIMARY KEY ("concept_uri", "broader_uri")
      );
    `);

    // 10. Broader relations — skill pillar (polymorphic, no FK)
    this.addSql(`
      CREATE TABLE "esco_broader_relations_skill_pillar" (
        "concept_uri" text NOT NULL,
        "broader_uri" text NOT NULL,
        "concept_type" text NOT NULL,
        "concept_label" text NOT NULL,
        "broader_type" text NOT NULL,
        "broader_label" text NOT NULL,
        CONSTRAINT "esco_broader_relations_skill_pillar_pkey" PRIMARY KEY ("concept_uri", "broader_uri")
      );
    `);

    // 11. Skills hierarchy (auto-increment PK, no natural unique key)
    this.addSql(`
      CREATE TABLE "esco_skills_hierarchy" (
        "id" serial NOT NULL,
        "level0_uri" text NOT NULL,
        "level0_preferred_term" text NOT NULL,
        "level1_uri" text NULL,
        "level1_preferred_term" text NULL,
        "level2_uri" text NULL,
        "level2_preferred_term" text NULL,
        "level3_uri" text NULL,
        "level3_preferred_term" text NULL,
        "description" text NULL,
        "scope_note" text NULL,
        "level0_code" text NOT NULL,
        "level1_code" text NULL,
        "level2_code" text NULL,
        "level3_code" text NULL,
        CONSTRAINT "esco_skills_hierarchy_pkey" PRIMARY KEY ("id")
      );
    `);

    // 12. Skill collections (FK → skills, discriminated by collection_type)
    this.addSql(`
      CREATE TABLE "esco_skill_collections" (
        "concept_uri" text NOT NULL,
        "collection_type" text NOT NULL,
        "concept_type" text NOT NULL,
        "preferred_label" text NOT NULL,
        "status" text NOT NULL,
        "skill_type" text NULL,
        "reuse_level" text NULL,
        "alt_labels" text NULL,
        "description" text NULL,
        "broader_concept_uri" text NULL,
        "broader_concept_pt" text NULL,
        CONSTRAINT "esco_skill_collections_pkey" PRIMARY KEY ("concept_uri", "collection_type"),
        CONSTRAINT "esco_sc_skill_fk" FOREIGN KEY ("concept_uri") REFERENCES "esco_skills" ("concept_uri") ON DELETE CASCADE
      );
    `);

    // 13. Occupation collections (FK → occupations)
    this.addSql(`
      CREATE TABLE "esco_occupation_collections" (
        "concept_uri" text NOT NULL,
        "concept_type" text NOT NULL,
        "preferred_label" text NOT NULL,
        "status" text NOT NULL,
        "alt_labels" text NULL,
        "description" text NULL,
        "broader_concept_uri" text NULL,
        "broader_concept_pt" text NULL,
        CONSTRAINT "esco_occupation_collections_pkey" PRIMARY KEY ("concept_uri"),
        CONSTRAINT "esco_oc_occupation_fk" FOREIGN KEY ("concept_uri") REFERENCES "esco_occupations" ("concept_uri") ON DELETE CASCADE
      );
    `);

    // 14. Green share occupations (polymorphic, no FK)
    this.addSql(`
      CREATE TABLE "esco_green_share_occupations" (
        "concept_uri" text NOT NULL,
        "concept_type" text NOT NULL,
        "code" text NOT NULL,
        "preferred_label" text NOT NULL,
        "green_share" real NOT NULL,
        CONSTRAINT "esco_green_share_occupations_pkey" PRIMARY KEY ("concept_uri")
      );
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "esco_green_share_occupations";`);
    this.addSql(`DROP TABLE IF EXISTS "esco_occupation_collections";`);
    this.addSql(`DROP TABLE IF EXISTS "esco_skill_collections";`);
    this.addSql(`DROP TABLE IF EXISTS "esco_skills_hierarchy";`);
    this.addSql(`DROP TABLE IF EXISTS "esco_broader_relations_skill_pillar";`);
    this.addSql(`DROP TABLE IF EXISTS "esco_broader_relations_occ_pillar";`);
    this.addSql(`DROP TABLE IF EXISTS "esco_skill_skill_relations";`);
    this.addSql(`DROP TABLE IF EXISTS "esco_occupation_skill_relations";`);
    this.addSql(`DROP TABLE IF EXISTS "esco_occupations";`);
    this.addSql(`DROP TABLE IF EXISTS "esco_skills";`);
    this.addSql(`DROP TABLE IF EXISTS "esco_skill_groups";`);
    this.addSql(`DROP TABLE IF EXISTS "esco_isco_groups";`);
    this.addSql(`DROP TABLE IF EXISTS "esco_dictionary";`);
    this.addSql(`DROP TABLE IF EXISTS "esco_concept_schemes";`);
  }
}
