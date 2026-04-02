import { Migration } from '@mikro-orm/migrations';

export class Migration_20260408000000_remove_bullet_variants extends Migration {
  override async up(): Promise<void> {
    // 1. Copy approved variant text into bullets.content (preserve user-facing text)
    this.addSql(`
      UPDATE "bullets" b
      SET "content" = bv."text"
      FROM (
        SELECT DISTINCT ON (bullet_id) bullet_id, text
        FROM "bullet_variants"
        WHERE "approval_status" = 'APPROVED'
        ORDER BY bullet_id, created_at ASC
      ) bv
      WHERE b."id" = bv."bullet_id"
    `);

    // 2. Rewrite archetypes.content_selection JSON:
    //    Map bulletVariantIds → bulletIds using bullet_variants.bullet_id lookup
    this.addSql(`
      WITH variant_to_bullet AS (
        SELECT id AS variant_id, bullet_id FROM bullet_variants
      ),
      rewritten AS (
        SELECT
          a.id,
          jsonb_set(
            a.content_selection,
            '{experienceSelections}',
            COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'experienceId', es->>'experienceId',
                    'bulletIds', COALESCE(
                      (
                        SELECT jsonb_agg(DISTINCT vtb.bullet_id)
                        FROM jsonb_array_elements_text(es->'bulletVariantIds') AS vid(id)
                        JOIN variant_to_bullet vtb ON vtb.variant_id = vid.id::uuid
                      ),
                      '[]'::jsonb
                    )
                  )
                )
                FROM jsonb_array_elements(a.content_selection->'experienceSelections') AS es
              ),
              '[]'::jsonb
            )
          ) AS new_cs
        FROM archetypes a
        WHERE a.content_selection ? 'experienceSelections'
          AND jsonb_array_length(COALESCE(a.content_selection->'experienceSelections', '[]'::jsonb)) > 0
      )
      UPDATE archetypes a
      SET content_selection = r.new_cs
      FROM rewritten r
      WHERE a.id = r.id
    `);

    // 3. Drop variant tables (tags first due to FK)
    this.addSql('DROP TABLE IF EXISTS "bullet_variant_tags" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "bullet_variants" CASCADE;');
  }

  override async down(): Promise<void> {
    // Recreate bullet_variants table
    this.addSql(`
      CREATE TABLE "bullet_variants" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "bullet_id" uuid NOT NULL REFERENCES "bullets"("id") ON DELETE CASCADE,
        "text" text NOT NULL,
        "angle" text NOT NULL,
        "source" text NOT NULL CHECK ("source" IN ('llm', 'manual')),
        "approval_status" text NOT NULL DEFAULT 'PENDING' CHECK ("approval_status" IN ('PENDING', 'APPROVED', 'REJECTED')),
        CONSTRAINT "bullet_variants_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "bullet_variants_bullet_id_idx" ON "bullet_variants"("bullet_id");`);

    this.addSql(`
      CREATE TABLE "bullet_variant_tags" (
        "bullet_variant_id" uuid NOT NULL REFERENCES "bullet_variants"("id") ON DELETE CASCADE,
        "tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        CONSTRAINT "bullet_variant_tags_pkey" PRIMARY KEY ("bullet_variant_id", "tag_id")
      );
    `);
  }
}
