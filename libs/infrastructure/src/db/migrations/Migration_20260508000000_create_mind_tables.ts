// TODO: This migration must run AFTER the Block 2 domain tables migration.
// Reorder the timestamp prefix once Block 2 lands.

import { Migration } from '@mikro-orm/migrations';

export class Migration_20260508000000_create_mind_tables extends Migration {
  override async up(): Promise<void> {
    // 1. Skills (aggregated from all skills/*.json files)
    this.addSql(`
      CREATE TABLE "mind_skills" (
        "mind_name"                         text NOT NULL,
        "mind_type"                         jsonb NOT NULL,
        "synonyms"                          jsonb NOT NULL DEFAULT '[]',
        "technical_domains"                 jsonb NOT NULL DEFAULT '[]',
        "implies_knowing_skills"            jsonb NOT NULL DEFAULT '[]',
        "implies_knowing_concepts"          jsonb NOT NULL DEFAULT '[]',
        "conceptual_aspects"                jsonb NOT NULL DEFAULT '[]',
        "architectural_patterns"            jsonb NOT NULL DEFAULT '[]',
        "supported_programming_languages"   jsonb NOT NULL DEFAULT '[]',
        "specific_to_frameworks"            jsonb NOT NULL DEFAULT '[]',
        "adapter_for_tool_or_service"       jsonb NOT NULL DEFAULT '[]',
        "implements_patterns"               jsonb NOT NULL DEFAULT '[]',
        "associated_to_application_domains" jsonb NOT NULL DEFAULT '[]',
        "solves_application_tasks"          jsonb NOT NULL DEFAULT '[]',
        "build_tools"                       jsonb NOT NULL DEFAULT '[]',
        "runtime_environments"              jsonb NOT NULL DEFAULT '[]',
        "mind_source_file"                  text NOT NULL,
        "mind_version"                      text NOT NULL,
        "created_at"                        timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"                        timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "mind_skills_pkey" PRIMARY KEY ("mind_name")
      );
    `);

    // 2. Concepts (from concepts/*.json files)
    this.addSql(`
      CREATE TABLE "mind_concepts" (
        "mind_name"      text NOT NULL,
        "mind_type"      text NOT NULL,
        "category"       text NULL,
        "mind_version"   text NOT NULL,
        "created_at"     timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"     timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "mind_concepts_pkey" PRIMARY KEY ("mind_name")
      );
    `);

    // 3. Relations (derived from impliesKnowingSkills / impliesKnowingConcepts arrays)
    this.addSql(`
      CREATE TABLE "mind_relations" (
        "mind_source_name" text NOT NULL,
        "mind_target_name" text NOT NULL,
        "relation_type"    text NOT NULL,
        "mind_version"     text NOT NULL,
        "created_at"       timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "mind_relations_pkey" PRIMARY KEY ("mind_source_name", "mind_target_name", "relation_type")
      );
    `);
  }

  override async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS "mind_relations";');
    this.addSql('DROP TABLE IF EXISTS "mind_concepts";');
    this.addSql('DROP TABLE IF EXISTS "mind_skills";');
  }
}
