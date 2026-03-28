import { BaseEntityProps } from '../../BaseEntity.types';

export type TransientCompanyProps = {
  name: string;
  logoUrl: string | null;
  linkedinLink: string;
  website: string | null;
} & BaseEntityProps;

export type TransientCompanyCreateProps = Omit<TransientCompanyProps, 'createdAt' | 'updatedAt'>;
