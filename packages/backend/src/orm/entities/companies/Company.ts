import { Entity, EntityRepositoryType, Property } from '@mikro-orm/core';
import * as Crypto from 'crypto';
import { CompanyRepository } from './CompanyRepository';
import { TransientCompany } from './TransientCompany';
import { CompanyCreateProps, CompanyProps } from './Company.types';
import { TransientCompanyCreateProps } from './TransientCompany.types';
import { TypeUtil } from '../../../utils/TypeUtil';
import { ObjectUtil } from '../../../utils/ObjectUtil';
import { UuidPrimaryKey } from '../../helpers';

@Entity({ tableName: 'companies', repository: () => CompanyRepository })
export class Company extends TransientCompany {
  public [EntityRepositoryType]?: CompanyRepository;

  @UuidPrimaryKey({ fieldName: 'id' })
  public id: string;

  @Property({ fieldName: 'ignored', type: 'boolean', default: false })
  public ignored: boolean;

  protected constructor(props: CompanyProps) {
    super(props);
    this.id = props.id;
    this.ignored = props.ignored;
  }

  public static generateCreateProps(overrides: TypeUtil.DeepPartial<CompanyCreateProps> = {}): CompanyCreateProps {
    return ObjectUtil.mergeWithOverrides(
      {
        name: 'Company',
        website: null,
        logoUrl: null,
        linkedinLink: 'https://www.linkedin.com/company/company'
      },
      overrides
    );
  }

  public static generate(overrides: TypeUtil.DeepPartial<CompanyCreateProps> = {}): Company {
    return Company.create(Company.generateCreateProps(overrides));
  }

  public static createTransient(props: TransientCompanyCreateProps): TransientCompany {
    return TransientCompany.create(props);
  }

  public static create(props: CompanyCreateProps): Company {
    return new Company({
      ...props,
      id: Crypto.randomUUID(),
      ignored: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}
