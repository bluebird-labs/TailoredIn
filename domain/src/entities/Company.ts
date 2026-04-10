import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { AggregateRoot } from '../AggregateRoot.js';
import { CompanyIdType } from '../orm-types/CompanyIdType.js';
import type { BusinessType } from '../value-objects/BusinessType.js';
import { CompanyId } from '../value-objects/CompanyId.js';
import type { CompanyStage } from '../value-objects/CompanyStage.js';
import { CompanyStatus } from '../value-objects/CompanyStatus.js';
import type { Industry } from '../value-objects/Industry.js';

export type CompanyCreateProps = {
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string | null;
  businessType?: BusinessType | null;
  industry?: Industry | null;
  stage?: CompanyStage | null;
  status?: CompanyStatus | null;
};

@Entity({ tableName: 'companies' })
export class Company extends AggregateRoot<CompanyId> {
  @PrimaryKey({ type: CompanyIdType, fieldName: 'id' })
  public readonly id!: CompanyId;

  @Property({ fieldName: 'name', type: 'text' })
  public name: string;

  @Property({ fieldName: 'description', type: 'text', nullable: true })
  public description: string | null;

  @Property({ fieldName: 'website', type: 'text', nullable: true, unique: 'companies_website_key' })
  public website: string | null;

  @Property({ fieldName: 'logo_url', type: 'text', nullable: true })
  public logoUrl: string | null;

  @Property({ fieldName: 'linkedin_link', type: 'text', nullable: true, unique: 'companies_linkedin_link_key' })
  public readonly linkedinLink: string | null;

  @Property({ fieldName: 'business_type', type: 'text', nullable: true })
  public businessType: BusinessType | null;

  @Property({ fieldName: 'industry', type: 'text', nullable: true })
  public industry: Industry | null;

  @Property({ fieldName: 'stage', type: 'text', nullable: true })
  public stage: CompanyStage | null;

  @Property({ fieldName: 'status', type: 'text', nullable: true })
  public status: CompanyStatus | null;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: CompanyId;
    name: string;
    description: string | null;
    website: string | null;
    logoUrl: string | null;
    linkedinLink: string | null;
    businessType: BusinessType | null;
    industry: Industry | null;
    stage: CompanyStage | null;
    status: CompanyStatus | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.website = props.website;
    this.logoUrl = props.logoUrl;
    this.linkedinLink = props.linkedinLink;
    this.businessType = props.businessType;
    this.industry = props.industry;
    this.stage = props.stage;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public setWebsite(value: string): void {
    this.website = value;
    this.updatedAt = new Date();
  }

  public setBusinessType(value: BusinessType | null): void {
    this.businessType = value;
    this.updatedAt = new Date();
  }

  public setIndustry(value: Industry | null): void {
    this.industry = value;
    this.updatedAt = new Date();
  }

  public setStage(value: CompanyStage | null): void {
    this.stage = value;
    this.updatedAt = new Date();
  }

  public setStatus(value: CompanyStatus | null): void {
    this.status = value;
    this.updatedAt = new Date();
  }

  public static create(props: CompanyCreateProps): Company {
    const now = new Date();
    return new Company({
      id: CompanyId.generate(),
      name: props.name,
      description: props.description ?? null,
      website: props.website,
      logoUrl: props.logoUrl,
      linkedinLink: props.linkedinLink,
      businessType: props.businessType ?? null,
      industry: props.industry ?? null,
      stage: props.stage ?? null,
      status: props.status ?? CompanyStatus.RUNNING,
      createdAt: now,
      updatedAt: now
    });
  }
}
