import { Migration } from '@mikro-orm/migrations';

export class Migration20260501100000_create_enum_types extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`CREATE TYPE application_status AS ENUM ('draft', 'applied', 'screening', 'interviewing', 'offered', 'rejected', 'withdrawn', 'accepted', 'archived');`);
    this.addSql(`CREATE TYPE business_type AS ENUM ('b2b', 'b2c', 'b2b2c', 'b2g', 'd2c', 'marketplace', 'platform', 'enterprise', 'unknown');`);
    this.addSql(`CREATE TYPE company_stage AS ENUM ('pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'series_d_plus', 'late_stage', 'ipo', 'public', 'private_equity', 'bootstrapped', 'unknown');`);
    this.addSql(`CREATE TYPE company_status AS ENUM ('running', 'acquired', 'merged', 'defunct', 'stealth', 'unknown');`);
    this.addSql(`CREATE TYPE generation_scope AS ENUM ('resume', 'headline', 'experience');`);
    this.addSql(`CREATE TYPE industry AS ENUM ('automobile', 'cybersecurity', 'finance', 'healthcare', 'education', 'e_commerce', 'real_estate', 'media', 'logistics', 'energy', 'agriculture', 'travel', 'food', 'legal', 'hr_tech', 'martech', 'software', 'ai', 'gaming', 'telecom', 'insurance', 'retail', 'construction', 'government', 'biotech', 'pharma', 'aerospace_defense', 'manufacturing', 'entertainment', 'nonprofit', 'consulting', 'semiconductor', 'climate_tech', 'fintech', 'crypto_web3', 'transportation', 'unknown');`);
    this.addSql(`CREATE TYPE job_level AS ENUM ('internship', 'entry_level', 'associate', 'senior', 'staff', 'principal', 'manager', 'director', 'vp', 'executive', 'unknown');`);
    this.addSql(`CREATE TYPE job_source AS ENUM ('linkedin', 'paraform', 'greenhouse', 'lever', 'workday', 'wellfound', 'ashby', 'company_website', 'referral', 'upload');`);
    this.addSql(`CREATE TYPE location_type AS ENUM ('remote', 'remote_first', 'hybrid', 'flexible', 'onsite', 'unknown');`);
    this.addSql(`CREATE TYPE model_tier AS ENUM ('fast', 'balanced', 'best');`);
  }

  public override async down(): Promise<void> {
    this.addSql(`DROP TYPE IF EXISTS application_status;`);
    this.addSql(`DROP TYPE IF EXISTS business_type;`);
    this.addSql(`DROP TYPE IF EXISTS company_stage;`);
    this.addSql(`DROP TYPE IF EXISTS company_status;`);
    this.addSql(`DROP TYPE IF EXISTS generation_scope;`);
    this.addSql(`DROP TYPE IF EXISTS industry;`);
    this.addSql(`DROP TYPE IF EXISTS job_level;`);
    this.addSql(`DROP TYPE IF EXISTS job_source;`);
    this.addSql(`DROP TYPE IF EXISTS location_type;`);
    this.addSql(`DROP TYPE IF EXISTS model_tier;`);
  }
}
