import { ResumeCompany, type ResumeCompanyRepository, ResumeLocation } from '@tailoredin/domain';
import type { ResumeCompanyDto } from '../dtos/ResumeDataDto.js';
import { toCompanyDto } from './ListCompanies.js';

export type CreateCompanyInput = {
  userId: string;
  companyName: string;
  companyMention: string | null;
  websiteUrl: string | null;
  businessDomain: string;
  locations: { label: string; ordinal: number }[];
};

export class CreateCompany {
  public constructor(private readonly companyRepository: ResumeCompanyRepository) {}

  public async execute(input: CreateCompanyInput): Promise<ResumeCompanyDto> {
    const company = ResumeCompany.create({
      userId: input.userId,
      companyName: input.companyName,
      companyMention: input.companyMention,
      websiteUrl: input.websiteUrl,
      businessDomain: input.businessDomain,
      locations: input.locations.map(l => new ResumeLocation(l.label, l.ordinal))
    });
    await this.companyRepository.save(company);
    return toCompanyDto(company);
  }
}
