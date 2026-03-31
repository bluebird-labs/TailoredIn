import {
  type BusinessType,
  CompanyId,
  type CompanyRepository,
  type CompanyStage,
  type Industry
} from '@tailoredin/domain';

export type UpdateJobCompanyInput = {
  companyId: string;
  businessType?: BusinessType | null;
  industry?: Industry | null;
  stage?: CompanyStage | null;
};

export class UpdateJobCompany {
  public constructor(private readonly companyRepository: CompanyRepository) {}

  public async execute(input: UpdateJobCompanyInput): Promise<void> {
    const company = await this.companyRepository.findById(new CompanyId(input.companyId));
    if (!company) throw new Error(`Company not found: ${input.companyId}`);

    if (input.businessType !== undefined) company.setBusinessType(input.businessType);
    if (input.industry !== undefined) company.setIndustry(input.industry);
    if (input.stage !== undefined) company.setStage(input.stage);

    await this.companyRepository.save(company);
  }
}
