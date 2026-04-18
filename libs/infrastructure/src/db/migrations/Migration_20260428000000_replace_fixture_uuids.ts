import { Migration } from '@mikro-orm/migrations';

// ── Old fixture-style UUIDs ──────────────────────────────────────────
const OLD_PROFILE = '11111111-1111-4000-8000-000000000001';

const OLD_EXPS = [
  '22222222-0000-4000-8000-000000000001', // ResortPass
  '22222222-0000-4000-8000-000000000002', // Stealth
  '22222222-0000-4000-8000-000000000003', // Brightflow
  '22222222-0000-4000-8000-000000000004', // Volvo EM
  '22222222-0000-4000-8000-000000000005', // Volvo SSE
  '22222222-0000-4000-8000-000000000006', // Luxe
  '22222222-0000-4000-8000-000000000007', // StreamNation
  '22222222-0000-4000-8000-000000000008', // Planorama
  '22222222-0000-4000-8000-000000000009', // LuckyCart
];

// ── Replacement UUIDs (generated once, baked in) ─────────────────────
const NEW_PROFILE = '0da6b522-b757-4cdf-9234-e4155afc6379';

const NEW_EXPS = [
  '8b2d4ecf-d3cf-452f-82cf-859f4567238e', // ResortPass
  '971afabc-0a2d-4e6e-a203-70b6717bb004', // Stealth
  '5669e379-1cb2-4271-b2c0-3e6960bdf3ca', // Brightflow
  '71550b50-107a-4052-8a85-36566a834d1e', // Volvo EM
  'fb101e2f-24f0-48b4-ad53-fae70af976a0', // Volvo SSE
  'fae76d41-63ed-498d-8a9c-832646863b63', // Luxe
  '3a936c47-30e4-4fbd-830d-f2c027aacc59', // StreamNation
  '75b37d40-b8bd-4b15-9999-b1396deb67d5', // Planorama
  '08de959b-366c-488e-bc8e-3eb41d91c58d', // LuckyCart
];

function buildReplaceSql(
  oldProfile: string,
  newProfile: string,
  oldExps: string[],
  newExps: string[],
): string {
  // Build JSONB CASE branches for experience ID replacement
  const jsonbCaseBranches = oldExps
    .map((old, i) => `        WHEN elem->>'experienceId' = '${old}' THEN jsonb_set(elem, '{experienceId}', '"${newExps[i]}"'::jsonb)`)
    .join('\n');

  const oldExpList = oldExps.map((id) => `'${id}'`).join(', ');

  return `
DO $$
DECLARE
  r record;
BEGIN
  -- ── Step 1: Make FK constraints deferrable ──────────────────────
  FOR r IN
    SELECT con.conname, con.conrelid::regclass AS tbl
    FROM pg_constraint con
    WHERE con.confrelid IN ('profiles'::regclass, 'experiences'::regclass)
      AND con.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE %s ALTER CONSTRAINT %I DEFERRABLE INITIALLY DEFERRED', r.tbl, r.conname);
  END LOOP;

  SET CONSTRAINTS ALL DEFERRED;

  -- ── Step 2: Replace profile ID ──────────────────────────────────
  UPDATE profiles       SET id         = '${newProfile}' WHERE id         = '${oldProfile}';
  UPDATE experiences    SET profile_id = '${newProfile}' WHERE profile_id = '${oldProfile}';
  UPDATE educations     SET profile_id = '${newProfile}' WHERE profile_id = '${oldProfile}';
  UPDATE resume_contents SET profile_id = '${newProfile}' WHERE profile_id = '${oldProfile}';
  UPDATE applications   SET profile_id = '${newProfile}' WHERE profile_id = '${oldProfile}';

  -- ── Step 3: Replace experience IDs ──────────────────────────────
${oldExps.map((old, i) => `  UPDATE experiences    SET id            = '${newExps[i]}' WHERE id            = '${old}';\n  UPDATE accomplishments SET experience_id = '${newExps[i]}' WHERE experience_id = '${old}';`).join('\n')}

  -- ── Step 4: Update JSONB experienceId references ────────────────
  UPDATE resume_contents
  SET experiences = (
    SELECT jsonb_agg(
      CASE
${jsonbCaseBranches}
        ELSE elem
      END
      ORDER BY ordinality
    )
    FROM jsonb_array_elements(experiences::jsonb) WITH ORDINALITY AS t(elem, ordinality)
  )
  WHERE EXISTS (
    SELECT 1
    FROM jsonb_array_elements(experiences::jsonb) AS elem
    WHERE elem->>'experienceId' IN (${oldExpList})
  );

  -- ── Step 5: Force deferred checks to run ───────────────────────
  SET CONSTRAINTS ALL IMMEDIATE;

  -- ── Step 6: Restore FK constraints to NOT DEFERRABLE ────────────
  FOR r IN
    SELECT con.conname, con.conrelid::regclass AS tbl
    FROM pg_constraint con
    WHERE con.confrelid IN ('profiles'::regclass, 'experiences'::regclass)
      AND con.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE %s ALTER CONSTRAINT %I NOT DEFERRABLE', r.tbl, r.conname);
  END LOOP;
END $$;
`;
}

export class Migration_20260428000000_replace_fixture_uuids extends Migration {
  override async up(): Promise<void> {
    this.addSql(buildReplaceSql(OLD_PROFILE, NEW_PROFILE, OLD_EXPS, NEW_EXPS));
  }

  override async down(): Promise<void> {
    this.addSql(buildReplaceSql(NEW_PROFILE, OLD_PROFILE, NEW_EXPS, OLD_EXPS));
  }
}
