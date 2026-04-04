import type { CompanyRepository } from '@tailoredin/domain';
import type { CompanyDto } from '../../dtos/CompanyDto.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';

export class ListCompanies {
  public constructor(private readonly companyRepository: CompanyRepository) {}

  public async execute(): Promise<CompanyDto[]> {
    const companies = await this.companyRepository.findAll();
    return companies.map(toCompanyDto);
  }
}
