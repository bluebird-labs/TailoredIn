import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { AggregateRoot } from '../AggregateRoot.js';
import { BusinessType } from '../value-objects/BusinessType.js';
import { CompanyStage } from '../value-objects/CompanyStage.js';
import { CompanyStatus } from '../value-objects/CompanyStatus.js';
import { Industry } from '../value-objects/Industry.js';

export type CompanyCreateProps = {
  name: string;
  domainName: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string | null;
  businessType?: BusinessType;
  industry?: Industry;
  stage?: CompanyStage;
  status?: CompanyStatus;
};

@Entity({ tableName: 'companies' })
export class Company extends AggregateRoot {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'name', type: 'text' })
  public name: string;

  @Property({ fieldName: 'domain_name', type: 'text', unique: 'companies_domain_name_key' })
  public domainName: string;

  @Property({ fieldName: 'description', type: 'text', nullable: true })
  public description: string | null;

  @Property({ fieldName: 'website', type: 'text', nullable: true, unique: 'companies_website_key' })
  public website: string | null;

  @Property({ fieldName: 'logo_url', type: 'text', nullable: true })
  public logoUrl: string | null;

  @Property({ fieldName: 'linkedin_link', type: 'text', nullable: true, unique: 'companies_linkedin_link_key' })
  public readonly linkedinLink: string | null;

  @Property({ fieldName: 'business_type', type: 'text' })
  public businessType: BusinessType;

  @Property({ fieldName: 'industry', type: 'text' })
  public industry: Industry;

  @Property({ fieldName: 'stage', type: 'text' })
  public stage: CompanyStage;

  @Property({ fieldName: 'status', type: 'text' })
  public status: CompanyStatus;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  @Property({ fieldName: 'updated_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public updatedAt: Date;

  public constructor(props: {
    id: string;
    name: string;
    domainName: string;
    description: string | null;
    website: string | null;
    logoUrl: string | null;
    linkedinLink: string | null;
    businessType: BusinessType;
    industry: Industry;
    stage: CompanyStage;
    status: CompanyStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    this.id = props.id;
    this.name = props.name;
    this.domainName = props.domainName;
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

  public setDomainName(value: string): void {
    this.domainName = value;
    this.updatedAt = new Date();
  }

  public setWebsite(value: string): void {
    this.website = value;
    this.updatedAt = new Date();
  }

  public setBusinessType(value: BusinessType): void {
    this.businessType = value;
    this.updatedAt = new Date();
  }

  public setIndustry(value: Industry): void {
    this.industry = value;
    this.updatedAt = new Date();
  }

  public setStage(value: CompanyStage): void {
    this.stage = value;
    this.updatedAt = new Date();
  }

  public setStatus(value: CompanyStatus): void {
    this.status = value;
    this.updatedAt = new Date();
  }

  public static create(props: CompanyCreateProps): Company {
    const now = new Date();
    return new Company({
      id: crypto.randomUUID(),
      name: props.name,
      domainName: props.domainName,
      description: props.description ?? null,
      website: props.website,
      logoUrl: props.logoUrl,
      linkedinLink: props.linkedinLink,
      businessType: props.businessType ?? BusinessType.UNKNOWN,
      industry: props.industry ?? Industry.UNKNOWN,
      stage: props.stage ?? CompanyStage.UNKNOWN,
      status: props.status ?? CompanyStatus.RUNNING,
      createdAt: now,
      updatedAt: now
    });
  }
}
