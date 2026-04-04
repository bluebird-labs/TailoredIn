import { AggregateRoot } from '../AggregateRoot.js';
import type { BusinessType } from '../value-objects/BusinessType.js';
import { CompanyId } from '../value-objects/CompanyId.js';
import type { CompanyStage } from '../value-objects/CompanyStage.js';
import type { Industry } from '../value-objects/Industry.js';

export type CompanyCreateProps = {
  name: string;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string | null;
  businessType?: BusinessType | null;
  industry?: Industry | null;
  stage?: CompanyStage | null;
};

export class Company extends AggregateRoot<CompanyId> {
  public name: string;
  public website: string | null;
  public logoUrl: string | null;
  public readonly linkedinLink: string | null;
  public businessType: BusinessType | null;
  public industry: Industry | null;
  public stage: CompanyStage | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: CompanyId;
    name: string;
    website: string | null;
    logoUrl: string | null;
    linkedinLink: string | null;
    businessType: BusinessType | null;
    industry: Industry | null;
    stage: CompanyStage | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.name = props.name;
    this.website = props.website;
    this.logoUrl = props.logoUrl;
    this.linkedinLink = props.linkedinLink;
    this.businessType = props.businessType;
    this.industry = props.industry;
    this.stage = props.stage;
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

  public static create(props: CompanyCreateProps): Company {
    const now = new Date();
    return new Company({
      id: CompanyId.generate(),
      name: props.name,
      website: props.website,
      logoUrl: props.logoUrl,
      linkedinLink: props.linkedinLink,
      businessType: props.businessType ?? null,
      industry: props.industry ?? null,
      stage: props.stage ?? null,
      createdAt: now,
      updatedAt: now
    });
  }
}
