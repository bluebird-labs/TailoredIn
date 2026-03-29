import type { TransientCompanyProps } from './TransientCompany.types.js';

export type CompanyProps = TransientCompanyProps & {
  id: string;
  ignored: boolean;
};

export type CompanyCreateProps = Omit<CompanyProps, 'id' | 'createdAt' | 'updatedAt' | 'ignored'>;
