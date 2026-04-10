import { Migration } from '@mikro-orm/migrations';

export class Migration_20260503000000_cascade_delete_company extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "job_descriptions" DROP CONSTRAINT "job_descriptions_company_id_fkey";`);
    this.addSql(
      `ALTER TABLE "job_descriptions" ADD CONSTRAINT "job_descriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;`
    );

    this.addSql(`ALTER TABLE "applications" DROP CONSTRAINT "applications_company_id_fkey";`);
    this.addSql(
      `ALTER TABLE "applications" ADD CONSTRAINT "applications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;`
    );
  }

  public override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "job_descriptions" DROP CONSTRAINT "job_descriptions_company_id_fkey";`);
    this.addSql(
      `ALTER TABLE "job_descriptions" ADD CONSTRAINT "job_descriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id");`
    );

    this.addSql(`ALTER TABLE "applications" DROP CONSTRAINT "applications_company_id_fkey";`);
    this.addSql(
      `ALTER TABLE "applications" ADD CONSTRAINT "applications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id");`
    );
  }
}
