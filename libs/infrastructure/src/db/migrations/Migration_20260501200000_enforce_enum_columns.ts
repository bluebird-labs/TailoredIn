import { Migration } from '@mikro-orm/migrations';

export class Migration20260501200000_enforce_enum_columns extends Migration {
  public override async up(): Promise<void> {
    // applications.status — has existing default 'draft'::text, must drop before type change
    this.addSql(`ALTER TABLE applications ALTER COLUMN status DROP DEFAULT;`);
    this.addSql(`ALTER TABLE applications ALTER COLUMN status TYPE application_status USING status::application_status;`);
    this.addSql(`ALTER TABLE applications ALTER COLUMN status SET DEFAULT 'draft'::application_status;`);

    // companies — cast to enums + set NOT NULL (no existing defaults)
    this.addSql(`ALTER TABLE companies ALTER COLUMN business_type SET NOT NULL, ALTER COLUMN business_type TYPE business_type USING business_type::business_type;`);
    this.addSql(`ALTER TABLE companies ALTER COLUMN business_type SET DEFAULT 'unknown'::business_type;`);

    this.addSql(`ALTER TABLE companies ALTER COLUMN industry SET NOT NULL, ALTER COLUMN industry TYPE industry USING industry::industry;`);
    this.addSql(`ALTER TABLE companies ALTER COLUMN industry SET DEFAULT 'unknown'::industry;`);

    this.addSql(`ALTER TABLE companies ALTER COLUMN stage SET NOT NULL, ALTER COLUMN stage TYPE company_stage USING stage::company_stage;`);
    this.addSql(`ALTER TABLE companies ALTER COLUMN stage SET DEFAULT 'unknown'::company_stage;`);

    this.addSql(`ALTER TABLE companies ALTER COLUMN status SET NOT NULL, ALTER COLUMN status TYPE company_status USING status::company_status;`);
    this.addSql(`ALTER TABLE companies ALTER COLUMN status SET DEFAULT 'unknown'::company_status;`);

    // job_descriptions — cast to enums + set NOT NULL where needed
    this.addSql(`ALTER TABLE job_descriptions ALTER COLUMN level SET NOT NULL, ALTER COLUMN level TYPE job_level USING level::job_level;`);
    this.addSql(`ALTER TABLE job_descriptions ALTER COLUMN level SET DEFAULT 'unknown'::job_level;`);

    this.addSql(`ALTER TABLE job_descriptions ALTER COLUMN location_type SET NOT NULL, ALTER COLUMN location_type TYPE location_type USING location_type::location_type;`);
    this.addSql(`ALTER TABLE job_descriptions ALTER COLUMN location_type SET DEFAULT 'unknown'::location_type;`);

    this.addSql(`ALTER TABLE job_descriptions ALTER COLUMN source TYPE job_source USING source::job_source;`);

    // generation_settings.model_tier — has existing default 'balanced'::text
    this.addSql(`ALTER TABLE generation_settings ALTER COLUMN model_tier DROP DEFAULT;`);
    this.addSql(`ALTER TABLE generation_settings ALTER COLUMN model_tier TYPE model_tier USING model_tier::model_tier;`);
    this.addSql(`ALTER TABLE generation_settings ALTER COLUMN model_tier SET DEFAULT 'balanced'::model_tier;`);

    // generation_prompts.scope — drop old CHECK constraint, cast to enum
    this.addSql(`ALTER TABLE generation_prompts DROP CONSTRAINT IF EXISTS generation_prompts_scope_check;`);
    this.addSql(`ALTER TABLE generation_prompts ALTER COLUMN scope TYPE generation_scope USING scope::generation_scope;`);
  }

  public override async down(): Promise<void> {
    // Revert all columns back to text
    this.addSql(`ALTER TABLE applications ALTER COLUMN status DROP DEFAULT;`);
    this.addSql(`ALTER TABLE applications ALTER COLUMN status TYPE text USING status::text;`);
    this.addSql(`ALTER TABLE applications ALTER COLUMN status SET DEFAULT 'draft';`);

    this.addSql(`ALTER TABLE companies ALTER COLUMN business_type DROP DEFAULT, ALTER COLUMN business_type DROP NOT NULL, ALTER COLUMN business_type TYPE text USING business_type::text;`);
    this.addSql(`ALTER TABLE companies ALTER COLUMN industry DROP DEFAULT, ALTER COLUMN industry DROP NOT NULL, ALTER COLUMN industry TYPE text USING industry::text;`);
    this.addSql(`ALTER TABLE companies ALTER COLUMN stage DROP DEFAULT, ALTER COLUMN stage DROP NOT NULL, ALTER COLUMN stage TYPE text USING stage::text;`);
    this.addSql(`ALTER TABLE companies ALTER COLUMN status DROP DEFAULT, ALTER COLUMN status DROP NOT NULL, ALTER COLUMN status TYPE text USING status::text;`);

    this.addSql(`ALTER TABLE job_descriptions ALTER COLUMN level DROP DEFAULT, ALTER COLUMN level DROP NOT NULL, ALTER COLUMN level TYPE text USING level::text;`);
    this.addSql(`ALTER TABLE job_descriptions ALTER COLUMN location_type DROP DEFAULT, ALTER COLUMN location_type DROP NOT NULL, ALTER COLUMN location_type TYPE text USING location_type::text;`);
    this.addSql(`ALTER TABLE job_descriptions ALTER COLUMN source TYPE text USING source::text;`);

    this.addSql(`ALTER TABLE generation_settings ALTER COLUMN model_tier DROP DEFAULT;`);
    this.addSql(`ALTER TABLE generation_settings ALTER COLUMN model_tier TYPE text USING model_tier::text;`);
    this.addSql(`ALTER TABLE generation_settings ALTER COLUMN model_tier SET DEFAULT 'balanced';`);

    this.addSql(`ALTER TABLE generation_prompts ALTER COLUMN scope TYPE text USING scope::text;`);
    this.addSql(`ALTER TABLE generation_prompts ADD CONSTRAINT generation_prompts_scope_check CHECK (scope = ANY (ARRAY['resume'::text, 'headline'::text, 'experience'::text]));`);
  }
}
