import { Migration } from '@mikro-orm/migrations';

export class Migration_20260411000000_replace_bullets_with_accomplishments extends Migration {
  override async up(): Promise<void> {
    // 1. Drop bullet pivot and bullet tables
    this.addSql('DROP TABLE IF EXISTS "bullet_tags" CASCADE;');
    this.addSql('DROP TABLE IF EXISTS "bullets" CASCADE;');

    // 2. Create accomplishments table
    this.addSql(`
      CREATE TABLE "accomplishments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "experience_id" uuid NOT NULL REFERENCES "experiences"("id") ON DELETE CASCADE,
        "title" text NOT NULL DEFAULT '',
        "narrative" text NOT NULL DEFAULT '',
        "skill_tags" jsonb NOT NULL DEFAULT '[]',
        "ordinal" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "accomplishments_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "accomplishments_experience_id_idx" ON "accomplishments"("experience_id");`);

    // 3. Migrate tailored_resumes.content_selection: rename bulletIds → accomplishmentIds
    //    Old accomplishmentIds are gone (bullet IDs don't map to anything), so set to [].
    this.addSql(`
      UPDATE tailored_resumes
      SET content_selection = jsonb_set(
        content_selection,
        '{experienceSelections}',
        COALESCE(
          (
            SELECT jsonb_agg(
              (exp - 'bulletIds') || jsonb_build_object('accomplishmentIds', '[]'::jsonb)
            )
            FROM jsonb_array_elements(content_selection->'experienceSelections') AS exp
          ),
          '[]'::jsonb
        )
      )
    `);

    // 4. Migrate tailored_resumes.llm_proposals: rename rankedExperiences[].rankedBulletIds
    //    → selectedExperiences[].selectedAccomplishmentIds
    this.addSql(`
      UPDATE tailored_resumes
      SET llm_proposals = llm_proposals
        - 'rankedExperiences'
        || jsonb_build_object(
             'selectedExperiences',
             COALESCE(
               (
                 SELECT jsonb_agg(
                   (exp - 'rankedBulletIds') || jsonb_build_object('selectedAccomplishmentIds', '[]'::jsonb)
                 )
                 FROM jsonb_array_elements(llm_proposals->'rankedExperiences') AS exp
               ),
               '[]'::jsonb
             )
           )
      WHERE llm_proposals IS NOT NULL
        AND llm_proposals ? 'rankedExperiences'
    `);
  }

  override async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS "accomplishments" CASCADE;');

    this.addSql(`
      CREATE TABLE "bullets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "experience_id" uuid NOT NULL REFERENCES "experiences"("id") ON DELETE CASCADE,
        "content" text NOT NULL DEFAULT '',
        "verbose_description" text NULL,
        "status" text NOT NULL DEFAULT 'active',
        "ordinal" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "bullets_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX "bullets_experience_id_idx" ON "bullets"("experience_id");`);

    this.addSql(`
      CREATE TABLE "bullet_tags" (
        "bullet_id" uuid NOT NULL REFERENCES "bullets"("id") ON DELETE CASCADE,
        "tag_id" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        CONSTRAINT "bullet_tags_pkey" PRIMARY KEY ("bullet_id", "tag_id")
      );
    `);
  }
}
