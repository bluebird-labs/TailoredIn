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
  linkedinLink: string;
  ignored: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CompanyCreateProps = Omit<CompanyProps, 'id' | 'createdAt' | 'updatedAt' | 'ignored'>;

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

  @Property({ fieldName: 'linkedin_link', type: 'text', unique: 'companies_linkedin_link_key' })
  public linkedinLink: string;

  @Property({ fieldName: 'ignored', type: 'boolean', default: false })
  public ignored: boolean;

  constructor(props: CompanyProps) {
    super({ createdAt: props.createdAt, updatedAt: props.updatedAt });
    this.id = props.id;
    this.name = props.name;
    this.website = props.website;
    this.logoUrl = props.logoUrl;
    this.linkedinLink = props.linkedinLink;
    this.ignored = props.ignored;
  }

  static create(props: CompanyCreateProps): Company {
    const now = new Date();
    return new Company({
      ...props,
      id: generateUuid(),
      ignored: false,
      createdAt: now,
      updatedAt: now
    });
  }
}
