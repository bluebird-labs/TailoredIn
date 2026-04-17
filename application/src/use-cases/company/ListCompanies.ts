import { Inject, Injectable } from '@nestjs/common';
import type { CompanyRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { CompanyDto } from '../../dtos/CompanyDto.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';

@Injectable()
export class ListCompanies {
  public constructor(@Inject(DI.Company.Repository) private readonly companyRepository: CompanyRepository) {}

  public async execute(): Promise<CompanyDto[]> {
    const companies = await this.companyRepository.findAll();
    return companies.map(toCompanyDto);
  }
}
