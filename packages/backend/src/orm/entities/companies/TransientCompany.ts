import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../BaseEntity';
import { TransientCompanyCreateProps, TransientCompanyProps } from './TransientCompany.types';
import { ObjectUtil } from '../../../utils/ObjectUtil';
import { TypeUtil } from '../../../utils/TypeUtil';

@Entity({ abstract: true })
export class TransientCompany extends BaseEntity {
  @Property({ fieldName: 'name', type: 'text' })
  public name: string;

  @Property({ fieldName: 'website', type: 'text', nullable: true })
  public website: string | null;

  @Property({ fieldName: 'logo_url', type: 'text', nullable: true })
  public logoUrl: string | null;

  @Property({ fieldName: 'linkedin_link', type: 'text', unique: 'companies_linkedin_link_key' })
  public linkedinLink: string;

  protected constructor(props: TransientCompanyProps) {
    super(props);
    this.name = props.name;
    this.website = props.website;
    this.logoUrl = props.logoUrl;
    this.linkedinLink = props.linkedinLink;
  }

  public static generateCreateProps(
    overrides: TypeUtil.DeepPartial<TransientCompanyCreateProps> = {}
  ): TransientCompanyCreateProps {
    return ObjectUtil.mergeWithOverrides(
      {
        name: 'Test Company',
        website: 'https://example.com',
        logoUrl: 'https://example.com/logo.png',
        linkedinLink: 'https://linkedin.com/company/test-company'
      },
      overrides
    );
  }

  public static create(props: TransientCompanyCreateProps): TransientCompany {
    return new TransientCompany({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  public static generate(overrides: TypeUtil.DeepPartial<TransientCompanyCreateProps> = {}): TransientCompany {
    return TransientCompany.create(TransientCompany.generateCreateProps(overrides));
  }

  public setWebsite(value: string) {
    this.website = value;
    this.updatedAt = new Date();
  }

  public toProps(): TransientCompanyProps {
    return {
      name: this.name,
      website: this.website,
      logoUrl: this.logoUrl,
      linkedinLink: this.linkedinLink,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
