import { Inject, Injectable } from '@nestjs/common';
import type { CompanyRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { CompanyDto } from '../../dtos/CompanyDto.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';

export type GetCompanyInput = {
  companyId: string;
};

@Injectable()
export class GetCompany {
  public constructor(@Inject(DI.Company.Repository) private readonly companyRepository: CompanyRepository) {}

  public async execute(input: GetCompanyInput): Promise<CompanyDto> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new Error(`Company not found: ${input.companyId}`);
    }
    return toCompanyDto(company);
  }
}
