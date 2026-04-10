import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';

/**
 * Destructive seeder for E2E tests.
 *
 * Truncates all tables and re-seeds with full fixture data.
 * Do NOT run against a production or development database.
 *
 * Used by: infrastructure/dev/e2e-start-servers.ts
 */
export class E2eSeeder extends Seeder {
  public async run(em: EntityManager): Promise<void> {
    const conn = em.getConnection();

    await conn.execute(`
      TRUNCATE
        accomplishments, experiences,
        educations, profiles,
        job_descriptions, companies
      CASCADE
    `);

    // Profile
    await conn.execute(`
      INSERT INTO profiles (
        id, email, first_name, last_name, about,
        phone, location, linkedin_url, github_url, website_url,
        created_at, updated_at
      ) VALUES (
        'aaaaaaaa-0000-4000-8000-000000000001',
        'jane@example.com',
        'Jane',
        'Doe',
        'I am a full-stack engineer who thrives at the intersection of product and infrastructure. I write clear, maintainable code and care deeply about developer experience and system reliability.',
        '+1-555-123-4567',
        'San Francisco, CA',
        'https://linkedin.com/in/janedoe',
        'https://github.com/janedoe',
        'https://janedoe.dev',
        NOW(), NOW()
      )
    `);

    // Experiences
    await conn.execute(`
      INSERT INTO experiences (id, profile_id, title, company_name, company_website, company_accent, location, start_date, end_date, summary, ordinal, bullet_min, bullet_max, created_at, updated_at)
      VALUES
        (
          'bbbbbbbb-0000-4000-8000-000000000001',
          'aaaaaaaa-0000-4000-8000-000000000001',
          'Senior Engineer',
          'Acme Corp',
          'https://acme.com',
          NULL,
          'San Francisco, CA',
          '2022-01',
          '2024-06',
          'Led platform engineering efforts',
          0, 2, 5,
          NOW(), NOW()
        ),
        (
          'bbbbbbbb-0000-4000-8000-000000000002',
          'aaaaaaaa-0000-4000-8000-000000000001',
          'Software Engineer',
          'StartupCo',
          NULL,
          NULL,
          'Remote',
          '2020-03',
          '2022-01',
          'Full-stack development',
          1, 2, 5,
          NOW(), NOW()
        ),
        (
          'bbbbbbbb-0000-4000-8000-000000000003',
          'aaaaaaaa-0000-4000-8000-000000000001',
          'QA Analyst',
          'ScratchCorp',
          NULL,
          NULL,
          'Austin, TX',
          '2019-01',
          '2020-02',
          'Quality assurance',
          2, 2, 5,
          NOW(), NOW()
        )
    `);

    // Accomplishments for Acme Corp experience
    await conn.execute(`
      INSERT INTO accomplishments (id, experience_id, title, narrative, ordinal, created_at, updated_at)
      VALUES
        (
          'cccccccc-0000-4000-8000-000000000001',
          'bbbbbbbb-0000-4000-8000-000000000001',
          'Migrated to Kubernetes',
          'Led the migration from EC2 to Kubernetes, reducing deployment time from 45 minutes to under 5 minutes.',
          0,
          NOW(), NOW()
        ),
        (
          'cccccccc-0000-4000-8000-000000000002',
          'bbbbbbbb-0000-4000-8000-000000000001',
          'Reduced API latency by 40%',
          'Profiled and optimized critical database queries, cutting P99 latency from 800ms to 480ms.',
          1,
          NOW(), NOW()
        )
    `);

    // Accomplishment for StartupCo experience
    await conn.execute(`
      INSERT INTO accomplishments (id, experience_id, title, narrative, ordinal, created_at, updated_at)
      VALUES (
        'cccccccc-0000-4000-8000-000000000003',
        'bbbbbbbb-0000-4000-8000-000000000002',
        'Launched MVP in 3 months',
        'Designed and built the full-stack MVP that acquired the first 500 paying customers.',
        0,
        NOW(), NOW()
      )
    `);

    // Companies
    await conn.execute(`
      INSERT INTO companies (id, name, domain_name, description, website, logo_url, linkedin_link, business_type, industry, stage, created_at, updated_at)
      VALUES
        (
          'ffffffff-0000-4000-8000-000000000001',
          'Acme Corp',
          'acme.com',
          'Leading provider of innovative cloud solutions.',
          'https://acme.com',
          NULL,
          'https://linkedin.com/company/acme',
          'b2b',
          'software',
          'series_b',
          NOW(), NOW()
        ),
        (
          'ffffffff-0000-4000-8000-000000000002',
          'StartupCo',
          'startupco.io',
          'Early-stage fintech startup.',
          'https://startupco.io',
          NULL,
          NULL,
          'b2c',
          'finance',
          'seed',
          NOW(), NOW()
        ),
        (
          'ffffffff-0000-4000-8000-000000000003',
          'Big Bank Inc.',
          'bigbank.com',
          'Global financial services corporation.',
          'https://bigbank.com',
          NULL,
          'https://linkedin.com/company/bigbank',
          'b2b',
          'finance',
          'public',
          NOW(), NOW()
        )
    `);

    // Educations
    await conn.execute(`
      INSERT INTO educations (id, profile_id, degree_title, institution_name, graduation_year, location, honors, ordinal, hidden_by_default, created_at, updated_at)
      VALUES
        (
          'eeeeeeee-0000-4000-8000-000000000001',
          'aaaaaaaa-0000-4000-8000-000000000001',
          'B.S. Computer Science',
          'Stanford University',
          2020,
          'Stanford, CA',
          'Magna Cum Laude',
          0,
          false,
          NOW(), NOW()
        ),
        (
          'eeeeeeee-0000-4000-8000-000000000002',
          'aaaaaaaa-0000-4000-8000-000000000001',
          'M.S. Software Engineering',
          'Carnegie Mellon University',
          2022,
          'Pittsburgh, PA',
          NULL,
          1,
          false,
          NOW(), NOW()
        )
    `);
  }
}
