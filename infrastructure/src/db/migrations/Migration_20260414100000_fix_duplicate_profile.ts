import { Migration } from '@mikro-orm/migrations';

const OLD_PROFILE_ID = '9f778bd6-9bdd-4123-9d06-29b5dbff1097';
const NEW_PROFILE_ID = '11111111-1111-4000-8000-000000000001';

/**
 * Fixes duplicate profile created by the seed migration.
 *
 * The seed migration inserted a new profile row instead of reusing the existing one.
 * This migration:
 * 1. Deletes the old profile's child data (accomplishments, experiences, educations)
 * 2. Re-parents headlines from old → new profile
 * 3. Deletes the old profile row
 */
export class Migration_20260414100000_fix_duplicate_profile extends Migration {
  override async up(): Promise<void> {
    // Delete old profile's child data
    this.addSql(`DELETE FROM "accomplishments" WHERE "experience_id" IN (SELECT "id" FROM "experiences" WHERE "profile_id" = '${OLD_PROFILE_ID}');`);
    this.addSql(`DELETE FROM "experiences" WHERE "profile_id" = '${OLD_PROFILE_ID}';`);
    this.addSql(`DELETE FROM "educations" WHERE "profile_id" = '${OLD_PROFILE_ID}';`);

    // Re-parent headlines to the new profile
    this.addSql(`UPDATE "headlines" SET "profile_id" = '${NEW_PROFILE_ID}' WHERE "profile_id" = '${OLD_PROFILE_ID}';`);

    // Delete the old profile
    this.addSql(`DELETE FROM "profiles" WHERE "id" = '${OLD_PROFILE_ID}';`);
  }

  override async down(): Promise<void> {
    // Not reversible — the old profile data is gone
  }
}
