import { Migration } from '@mikro-orm/migrations';

export class Migration20260401000000_create_company_briefs extends Migration {
  public override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE company_briefs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        product_overview TEXT NOT NULL,
        tech_stack TEXT NOT NULL,
        culture TEXT NOT NULL,
        recent_news TEXT NOT NULL,
        key_people TEXT NOT NULL,
        created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE(company_id)
      );
    `);
  }

  public override async down(): Promise<void> {
    this.addSql('DROP TABLE company_briefs;');
  }
}
