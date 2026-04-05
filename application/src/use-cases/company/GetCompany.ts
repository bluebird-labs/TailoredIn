import { CompanyId, type CompanyRepository } from '@tailoredin/domain';
import type { CompanyDto } from '../../dtos/CompanyDto.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';

export type GetCompanyInput = {
  companyId: string;
};

export class GetCompany {
  public constructor(private readonly companyRepository: CompanyRepository) {}

  public async execute(input: GetCompanyInput): Promise<CompanyDto> {
    const company = await this.companyRepository.findById(new CompanyId(input.companyId));
    if (!company) {
      throw new Error(`Company not found: ${input.companyId}`);
    }
    return toCompanyDto(company);
  }
}
