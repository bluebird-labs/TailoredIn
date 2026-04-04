import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '../../BaseEntity.js';
import { generateUuid, UuidPrimaryKey } from '../../helpers.js';
import { CompanyOrmRepository } from './CompanyOrmRepository.js';

export type CompanyProps = {
  id: string;
  name: string;
  website: string | null;
  logoUrl: string | null;
  linkedinLink: string | null;
  businessType: string | null;
  industry: string | null;
  stage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CompanyCreateProps = Omit<
  CompanyProps,
  'id' | 'createdAt' | 'updatedAt' | 'businessType' | 'industry' | 'stage'
>;

@Entity({ tableName: 'companies', repository: () => CompanyOrmRepository })
export class Company extends BaseEntity {
  public [EntityRepositoryType]?: CompanyOrmRepository;

  @UuidPrimaryKey({ fieldName: 'id' })
  public id: string;

  @Property({ fieldName: 'name', type: 'text' })
  public name: string;

  @Property({ fieldName: 'website', type: 'text', nullable: true })
  public website: string | null;

  @Property({ fieldName: 'logo_url', type: 'text', nullable: true })
  public logoUrl: string | null;

  @Property({ fieldName: 'linkedin_link', type: 'text', nullable: true, unique: 'companies_linkedin_link_key' })
  public linkedinLink: string | null;

  @Property({ fieldName: 'business_type', type: 'text', nullable: true })
  public businessType: string | null;

  @Property({ fieldName: 'industry', type: 'text', nullable: true })
  public industry: string | null;

  @Property({ fieldName: 'stage', type: 'text', nullable: true })
  public stage: string | null;

  public constructor(props: CompanyProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.name = props.name;
    this.website = props.website;
    this.logoUrl = props.logoUrl;
    this.linkedinLink = props.linkedinLink;
    this.businessType = props.businessType;
    this.industry = props.industry;
    this.stage = props.stage;
  }

  public static create(props: CompanyCreateProps): Company {
    const now = new Date();
    return new Company({
      ...props,
      id: generateUuid(),
      businessType: null,
      industry: null,
      stage: null,
      createdAt: now,
      updatedAt: now
    });
  }
}
