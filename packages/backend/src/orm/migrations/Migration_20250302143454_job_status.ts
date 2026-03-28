import { Migration } from '@mikro-orm/migrations';

export class Migration20250302143454_job_status extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`alter type "job_status" add value if not exists 'high_applicants' after 'duplicate';`);

    this.addSql(`alter type "job_status" add value if not exists 'location_unfit' after 'high_applicants';`);

    this.addSql(`alter type "job_status" add value if not exists 'posted_too_long_ago' after 'location_unfit';`);
  }
}
