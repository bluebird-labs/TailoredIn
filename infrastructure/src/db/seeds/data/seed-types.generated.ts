// AUTO-GENERATED — do not edit manually.
// Run `bun run db:seed:generate-types` to regenerate from ORM entity metadata.

export interface JobStatusUpdateRow {
  created_at: string;
  updated_at: string;
  id: string;
  job_id: string;
  status: string;
}

export interface JobRow {
  created_at: string;
  updated_at: string;
  id: string;
  status: string;
  apply_link: string | null;
  linkedin_id: string;
  title: string;
  linkedin_link: string;
  type: string | null;
  level: string | null;
  remote: string | null;
  posted_at: string | null;
  is_repost: boolean | null;
  location_raw: string;
  salary_low: number | null;
  salary_high: number | null;
  salary_raw: string | null;
  description: string;
  description_html: string;
  applicants_count: number | null;
  company_id: string;
}

export interface CompanyRow {
  created_at: string;
  updated_at: string;
  id: string;
  name: string;
  website: string | null;
  logo_url: string | null;
  linkedin_link: string;
  ignored: boolean;
  business_type: string | null;
  industry: string | null;
  stage: string | null;
}
