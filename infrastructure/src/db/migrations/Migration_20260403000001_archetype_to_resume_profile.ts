import { Migration } from '@mikro-orm/migrations';

export class Migration_20260403000001_archetype_to_resume_profile extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE resume_profiles (
        profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
        content_selection jsonb NOT NULL DEFAULT '{}',
        headline_text text NOT NULL DEFAULT '',
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    this.addSql(`
      CREATE TABLE tailored_resumes (
        id uuid PRIMARY KEY,
        profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        jd_content text NOT NULL DEFAULT '',
        llm_proposals jsonb NOT NULL DEFAULT '{}',
        content_selection jsonb NOT NULL DEFAULT '{}',
        headline_text text NOT NULL DEFAULT '',
        status text NOT NULL DEFAULT 'draft',
        pdf_path text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    this.addSql(`
      INSERT INTO resume_profiles (profile_id, content_selection, headline_text, updated_at)
      SELECT a.profile_id, a.content_selection, COALESCE(a.headline_text, ''), now()
      FROM archetypes a
      WHERE a.key = 'leader_individual_contributor'
      ON CONFLICT DO NOTHING;
    `);

    this.addSql('DROP TABLE IF EXISTS archetype_tag_weights;');
    this.addSql('DROP TABLE IF EXISTS archetypes;');
  }

  override async down(): Promise<void> {
    this.addSql(`
      CREATE TABLE archetypes (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        key text NOT NULL,
        label text NOT NULL,
        headline_id uuid,
        headline_text text,
        content_selection jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT archetypes_pkey PRIMARY KEY (id)
      );
    `);

    this.addSql(`
      CREATE TABLE archetype_tag_weights (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        archetype_id uuid NOT NULL REFERENCES archetypes(id) ON DELETE CASCADE,
        tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        weight numeric NOT NULL,
        CONSTRAINT archetype_tag_weights_pkey PRIMARY KEY (id)
      );
    `);

    this.addSql('DROP TABLE IF EXISTS tailored_resumes;');
    this.addSql('DROP TABLE IF EXISTS resume_profiles;');
  }
}
