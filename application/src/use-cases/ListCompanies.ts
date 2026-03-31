import type { ResumeCompany, ResumeCompanyRepository } from '@tailoredin/domain';
import type { ResumeCompanyDto } from '../dtos/ResumeDataDto.js';

export type ListCompaniesInput = { userId: string };

export class ListCompanies {
  public constructor(private readonly companyRepository: ResumeCompanyRepository) {}

  public async execute(input: ListCompaniesInput): Promise<ResumeCompanyDto[]> {
    const companies = await this.companyRepository.findAllByUserId(input.userId);
    return companies.map(toCompanyDto);
  }
}

export function toCompanyDto(company: ResumeCompany): ResumeCompanyDto {
  return {
    id: company.id.value,
    companyName: company.companyName,
    companyMention: company.companyMention,
    websiteUrl: company.websiteUrl,
    businessDomain: company.businessDomain,
    locations: company.locations.map(l => ({ label: l.label, ordinal: l.ordinal })),
    positions: company.positions.map(p => ({
      id: p.id.value,
      title: p.title,
      startDate: p.startDate,
      endDate: p.endDate,
      summary: p.summary,
      ordinal: p.ordinal,
      bullets: p.bullets.map(b => ({ id: b.id.value, content: b.content, ordinal: b.ordinal }))
    }))
  };
}
