import * as Crypto from 'node:crypto';
import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Property } from '@mikro-orm/decorators/es';
import { ObjectUtil, type TypeUtil } from '@tailoredin/shared';
import { UuidPrimaryKey } from '../../helpers.js';
import type { CompanyCreateProps, CompanyProps } from './Company.types.js';
import { CompanyRepository } from './CompanyRepository.js';
import { TransientCompany } from './TransientCompany.js';
import type { TransientCompanyCreateProps } from './TransientCompany.types.js';

@Entity({ tableName: 'companies', repository: () => CompanyRepository })
export class Company extends TransientCompany {
  public [EntityRepositoryType]?: CompanyRepository;

  @UuidPrimaryKey({ fieldName: 'id' })
  public id: string;

  @Property({ fieldName: 'ignored', type: 'boolean', default: false })
  public ignored: boolean;

  constructor(props: CompanyProps) {
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
