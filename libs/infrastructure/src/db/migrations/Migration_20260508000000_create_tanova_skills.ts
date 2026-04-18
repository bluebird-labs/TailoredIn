import { Migration } from '@mikro-orm/migrations';

// TODO: This migration must run AFTER the Block 2 domain tables migration.
// Adjust the timestamp prefix once Block 2 has landed so ordering is correct.
export class Migration_20260508000000_create_tanova_skills extends Migration {
	override async up(): Promise<void> {
		this.addSql(`
			CREATE TABLE "tanova_skills" (
				"tanova_id"          text NOT NULL,
				"canonical_name"     text NOT NULL,
				"category"           text,
				"subcategory"        text,
				"tags"               jsonb DEFAULT '[]',
				"description"        text,
				"aliases"            jsonb DEFAULT '[]',
				"parent_skills"      jsonb DEFAULT '[]',
				"child_skills"       jsonb DEFAULT '[]',
				"related_skills"     jsonb DEFAULT '[]',
				"transferability"    jsonb,
				"proficiency_levels" jsonb,
				"typical_roles"      jsonb DEFAULT '[]',
				"industry_demand"    text,
				"prerequisites"      jsonb DEFAULT '[]',
				"tanova_version"     text NOT NULL,
				"created_at"         timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
				"updated_at"         timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
				CONSTRAINT "tanova_skills_pkey" PRIMARY KEY ("tanova_id")
			);
		`);
	}

	override async down(): Promise<void> {
		this.addSql('DROP TABLE IF EXISTS "tanova_skills";');
	}
}
