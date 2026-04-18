import { Migration } from '@mikro-orm/migrations';

export class Migration_20260416000000_create_accounts extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE "accounts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" text NOT NULL,
        "password_hash" text NOT NULL,
        "profile_id" uuid NOT NULL,
        "created_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "accounts_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "accounts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles" ("id") ON DELETE CASCADE,
        CONSTRAINT "accounts_profile_id_unique" UNIQUE ("profile_id")
      );
    `);
    this.addSql(`CREATE UNIQUE INDEX "accounts_email_unique" ON "accounts" ("email");`);
  }

  public override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "accounts";`);
  }
}
