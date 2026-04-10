import { Migration } from '@mikro-orm/migrations';

export class Migration20260502000000_add_check_constraints extends Migration {
  public override async up(): Promise<void> {
    // ── profiles ──
    this.addSql(`ALTER TABLE profiles ADD CONSTRAINT profiles_email_check CHECK (email ~* '^.+@.+\\..+$');`);
    this.addSql(`ALTER TABLE profiles ADD CONSTRAINT profiles_first_name_check CHECK (length(first_name) BETWEEN 1 AND 500);`);
    this.addSql(`ALTER TABLE profiles ADD CONSTRAINT profiles_last_name_check CHECK (length(last_name) BETWEEN 1 AND 500);`);
    this.addSql(`ALTER TABLE profiles ADD CONSTRAINT profiles_about_check CHECK (about IS NULL OR length(about) <= 5000);`);
    this.addSql(`ALTER TABLE profiles ADD CONSTRAINT profiles_phone_check CHECK (phone IS NULL OR length(phone) BETWEEN 1 AND 30);`);
    this.addSql(`ALTER TABLE profiles ADD CONSTRAINT profiles_location_check CHECK (location IS NULL OR length(location) BETWEEN 1 AND 500);`);
    this.addSql(
      `ALTER TABLE profiles ADD CONSTRAINT profiles_linkedin_url_check CHECK (linkedin_url IS NULL OR length(linkedin_url) BETWEEN 1 AND 500);`
    );
    this.addSql(
      `ALTER TABLE profiles ADD CONSTRAINT profiles_github_url_check CHECK (github_url IS NULL OR length(github_url) BETWEEN 1 AND 500);`
    );
    this.addSql(
      `ALTER TABLE profiles ADD CONSTRAINT profiles_website_url_check CHECK (website_url IS NULL OR length(website_url) BETWEEN 1 AND 500);`
    );

    // ── companies ──
    this.addSql(`ALTER TABLE companies ADD CONSTRAINT companies_name_check CHECK (length(name) BETWEEN 1 AND 500);`);
    this.addSql(
      `ALTER TABLE companies ADD CONSTRAINT companies_description_check CHECK (description IS NULL OR length(description) <= 10000);`
    );
    this.addSql(
      `ALTER TABLE companies ADD CONSTRAINT companies_website_check CHECK (website IS NULL OR length(website) BETWEEN 1 AND 500);`
    );
    this.addSql(
      `ALTER TABLE companies ADD CONSTRAINT companies_logo_url_check CHECK (logo_url IS NULL OR length(logo_url) BETWEEN 1 AND 1000);`
    );
    this.addSql(
      `ALTER TABLE companies ADD CONSTRAINT companies_linkedin_link_check CHECK (linkedin_link IS NULL OR length(linkedin_link) BETWEEN 1 AND 500);`
    );

    // ── experiences ──
    this.addSql(`ALTER TABLE experiences ADD CONSTRAINT experiences_title_check CHECK (length(title) BETWEEN 1 AND 500);`);
    this.addSql(`ALTER TABLE experiences ADD CONSTRAINT experiences_company_name_check CHECK (length(company_name) BETWEEN 1 AND 500);`);
    this.addSql(
      `ALTER TABLE experiences ADD CONSTRAINT experiences_company_website_check CHECK (company_website IS NULL OR length(company_website) BETWEEN 1 AND 500);`
    );
    this.addSql(
      `ALTER TABLE experiences ADD CONSTRAINT experiences_company_accent_check CHECK (company_accent IS NULL OR length(company_accent) BETWEEN 1 AND 30);`
    );
    this.addSql(`ALTER TABLE experiences ADD CONSTRAINT experiences_location_check CHECK (length(location) BETWEEN 1 AND 500);`);
    this.addSql(`ALTER TABLE experiences ADD CONSTRAINT experiences_start_date_check CHECK (length(start_date) BETWEEN 1 AND 50);`);
    this.addSql(`ALTER TABLE experiences ADD CONSTRAINT experiences_end_date_check CHECK (length(end_date) BETWEEN 1 AND 50);`);
    this.addSql(
      `ALTER TABLE experiences ADD CONSTRAINT experiences_summary_check CHECK (summary IS NULL OR length(summary) <= 5000);`
    );
    this.addSql(`ALTER TABLE experiences ADD CONSTRAINT experiences_ordinal_check CHECK (ordinal >= 0);`);

    // ── accomplishments ──
    this.addSql(`ALTER TABLE accomplishments ADD CONSTRAINT accomplishments_title_check CHECK (length(title) BETWEEN 1 AND 500);`);
    this.addSql(
      `ALTER TABLE accomplishments ADD CONSTRAINT accomplishments_narrative_check CHECK (length(narrative) BETWEEN 1 AND 5000);`
    );
    this.addSql(`ALTER TABLE accomplishments ADD CONSTRAINT accomplishments_ordinal_check CHECK (ordinal >= 0);`);

    // ── educations ──
    this.addSql(`ALTER TABLE educations ADD CONSTRAINT educations_degree_title_check CHECK (length(degree_title) BETWEEN 1 AND 500);`);
    this.addSql(
      `ALTER TABLE educations ADD CONSTRAINT educations_institution_name_check CHECK (length(institution_name) BETWEEN 1 AND 500);`
    );
    this.addSql(`ALTER TABLE educations ADD CONSTRAINT educations_graduation_year_check CHECK (graduation_year BETWEEN 1900 AND 2100);`);
    this.addSql(
      `ALTER TABLE educations ADD CONSTRAINT educations_location_check CHECK (location IS NULL OR length(location) BETWEEN 1 AND 500);`
    );
    this.addSql(
      `ALTER TABLE educations ADD CONSTRAINT educations_honors_check CHECK (honors IS NULL OR length(honors) BETWEEN 1 AND 500);`
    );
    this.addSql(`ALTER TABLE educations ADD CONSTRAINT educations_ordinal_check CHECK (ordinal >= 0);`);

    // ── applications ──
    this.addSql(
      `ALTER TABLE applications ADD CONSTRAINT applications_notes_check CHECK (notes IS NULL OR length(notes) <= 10000);`
    );

    // ── job_descriptions ──
    // Fix existing rows with empty descriptions before adding constraint
    this.addSql(`UPDATE job_descriptions SET description = title WHERE length(description) = 0;`);
    this.addSql(`ALTER TABLE job_descriptions ADD CONSTRAINT job_descriptions_title_check CHECK (length(title) BETWEEN 1 AND 1000);`);
    this.addSql(
      `ALTER TABLE job_descriptions ADD CONSTRAINT job_descriptions_description_check CHECK (length(description) BETWEEN 1 AND 100000);`
    );
    this.addSql(
      `ALTER TABLE job_descriptions ADD CONSTRAINT job_descriptions_url_check CHECK (url IS NULL OR length(url) BETWEEN 1 AND 1000);`
    );
    this.addSql(
      `ALTER TABLE job_descriptions ADD CONSTRAINT job_descriptions_location_check CHECK (location IS NULL OR length(location) BETWEEN 1 AND 500);`
    );
    this.addSql(
      `ALTER TABLE job_descriptions ADD CONSTRAINT job_descriptions_salary_min_check CHECK (salary_min IS NULL OR salary_min >= 0);`
    );
    this.addSql(
      `ALTER TABLE job_descriptions ADD CONSTRAINT job_descriptions_salary_max_check CHECK (salary_max IS NULL OR salary_max >= 0);`
    );
    this.addSql(
      `ALTER TABLE job_descriptions ADD CONSTRAINT job_descriptions_salary_range_check CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min);`
    );
    this.addSql(
      `ALTER TABLE job_descriptions ADD CONSTRAINT job_descriptions_salary_currency_check CHECK (salary_currency IS NULL OR length(salary_currency) BETWEEN 1 AND 10);`
    );
    this.addSql(
      `ALTER TABLE job_descriptions ADD CONSTRAINT job_descriptions_resume_pdf_theme_check CHECK (resume_pdf_theme IS NULL OR length(resume_pdf_theme) BETWEEN 1 AND 100);`
    );

    // ── generation_settings ──
    this.addSql(`ALTER TABLE generation_settings ADD CONSTRAINT generation_settings_bullet_min_check CHECK (bullet_min > 0);`);
    this.addSql(
      `ALTER TABLE generation_settings ADD CONSTRAINT generation_settings_bullet_max_check CHECK (bullet_max >= bullet_min);`
    );

    // ── experience_generation_overrides ──
    this.addSql(
      `ALTER TABLE experience_generation_overrides ADD CONSTRAINT experience_generation_overrides_bullet_min_check CHECK (bullet_min > 0);`
    );
    this.addSql(
      `ALTER TABLE experience_generation_overrides ADD CONSTRAINT experience_generation_overrides_bullet_max_check CHECK (bullet_max >= bullet_min);`
    );

    // ── generation_prompts ──
    this.addSql(
      `ALTER TABLE generation_prompts ADD CONSTRAINT generation_prompts_content_check CHECK (length(content) BETWEEN 1 AND 10000);`
    );
  }

  public override async down(): Promise<void> {
    // ── profiles ──
    this.addSql(`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_check;`);
    this.addSql(`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_first_name_check;`);
    this.addSql(`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_last_name_check;`);
    this.addSql(`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_about_check;`);
    this.addSql(`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_phone_check;`);
    this.addSql(`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_location_check;`);
    this.addSql(`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_linkedin_url_check;`);
    this.addSql(`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_github_url_check;`);
    this.addSql(`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_website_url_check;`);

    // ── companies ──
    this.addSql(`ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_name_check;`);
    this.addSql(`ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_description_check;`);
    this.addSql(`ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_website_check;`);
    this.addSql(`ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_logo_url_check;`);
    this.addSql(`ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_linkedin_link_check;`);

    // ── experiences ──
    this.addSql(`ALTER TABLE experiences DROP CONSTRAINT IF EXISTS experiences_title_check;`);
    this.addSql(`ALTER TABLE experiences DROP CONSTRAINT IF EXISTS experiences_company_name_check;`);
    this.addSql(`ALTER TABLE experiences DROP CONSTRAINT IF EXISTS experiences_company_website_check;`);
    this.addSql(`ALTER TABLE experiences DROP CONSTRAINT IF EXISTS experiences_company_accent_check;`);
    this.addSql(`ALTER TABLE experiences DROP CONSTRAINT IF EXISTS experiences_location_check;`);
    this.addSql(`ALTER TABLE experiences DROP CONSTRAINT IF EXISTS experiences_start_date_check;`);
    this.addSql(`ALTER TABLE experiences DROP CONSTRAINT IF EXISTS experiences_end_date_check;`);
    this.addSql(`ALTER TABLE experiences DROP CONSTRAINT IF EXISTS experiences_summary_check;`);
    this.addSql(`ALTER TABLE experiences DROP CONSTRAINT IF EXISTS experiences_ordinal_check;`);

    // ── accomplishments ──
    this.addSql(`ALTER TABLE accomplishments DROP CONSTRAINT IF EXISTS accomplishments_title_check;`);
    this.addSql(`ALTER TABLE accomplishments DROP CONSTRAINT IF EXISTS accomplishments_narrative_check;`);
    this.addSql(`ALTER TABLE accomplishments DROP CONSTRAINT IF EXISTS accomplishments_ordinal_check;`);

    // ── educations ──
    this.addSql(`ALTER TABLE educations DROP CONSTRAINT IF EXISTS educations_degree_title_check;`);
    this.addSql(`ALTER TABLE educations DROP CONSTRAINT IF EXISTS educations_institution_name_check;`);
    this.addSql(`ALTER TABLE educations DROP CONSTRAINT IF EXISTS educations_graduation_year_check;`);
    this.addSql(`ALTER TABLE educations DROP CONSTRAINT IF EXISTS educations_location_check;`);
    this.addSql(`ALTER TABLE educations DROP CONSTRAINT IF EXISTS educations_honors_check;`);
    this.addSql(`ALTER TABLE educations DROP CONSTRAINT IF EXISTS educations_ordinal_check;`);

    // ── applications ──
    this.addSql(`ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_notes_check;`);

    // ── job_descriptions ──
    this.addSql(`ALTER TABLE job_descriptions DROP CONSTRAINT IF EXISTS job_descriptions_title_check;`);
    this.addSql(`ALTER TABLE job_descriptions DROP CONSTRAINT IF EXISTS job_descriptions_description_check;`);
    this.addSql(`ALTER TABLE job_descriptions DROP CONSTRAINT IF EXISTS job_descriptions_url_check;`);
    this.addSql(`ALTER TABLE job_descriptions DROP CONSTRAINT IF EXISTS job_descriptions_location_check;`);
    this.addSql(`ALTER TABLE job_descriptions DROP CONSTRAINT IF EXISTS job_descriptions_salary_min_check;`);
    this.addSql(`ALTER TABLE job_descriptions DROP CONSTRAINT IF EXISTS job_descriptions_salary_max_check;`);
    this.addSql(`ALTER TABLE job_descriptions DROP CONSTRAINT IF EXISTS job_descriptions_salary_range_check;`);
    this.addSql(`ALTER TABLE job_descriptions DROP CONSTRAINT IF EXISTS job_descriptions_salary_currency_check;`);
    this.addSql(`ALTER TABLE job_descriptions DROP CONSTRAINT IF EXISTS job_descriptions_resume_pdf_theme_check;`);

    // ── generation_settings ──
    this.addSql(`ALTER TABLE generation_settings DROP CONSTRAINT IF EXISTS generation_settings_bullet_min_check;`);
    this.addSql(`ALTER TABLE generation_settings DROP CONSTRAINT IF EXISTS generation_settings_bullet_max_check;`);

    // ── experience_generation_overrides ──
    this.addSql(`ALTER TABLE experience_generation_overrides DROP CONSTRAINT IF EXISTS experience_generation_overrides_bullet_min_check;`);
    this.addSql(`ALTER TABLE experience_generation_overrides DROP CONSTRAINT IF EXISTS experience_generation_overrides_bullet_max_check;`);

    // ── generation_prompts ──
    this.addSql(`ALTER TABLE generation_prompts DROP CONSTRAINT IF EXISTS generation_prompts_content_check;`);
  }
}
