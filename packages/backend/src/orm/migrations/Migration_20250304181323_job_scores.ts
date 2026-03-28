import { Migration } from '@mikro-orm/migrations';
import { getMigrationSql } from '../helpers';

export class Migration20250304181323_job_scores extends Migration {
  public override async up(): Promise<void> {
    const sql = await getMigrationSql(this);
    this.addSql(sql);
  }

  public override async down(): Promise<void> {
    throw new Error('Down migration not implemented');
  }
}
