import { err, ok, type Result, type ResumeCompany, type ResumeCompanyRepository } from '@tailoredin/domain';

export type UpdateCompanyInput = {
  companyId: string;
  companyName?: string;
  companyMention?: string | null;
  websiteUrl?: string | null;
  businessDomain?: string;
};

export class UpdateCompany {
  public constructor(private readonly companyRepository: ResumeCompanyRepository) {}

  public async execute(input: UpdateCompanyInput): Promise<Result<void, Error>> {
    let company: ResumeCompany;
    try {
      company = await this.companyRepository.findByIdOrFail(input.companyId);
    } catch {
      return err(new Error(`Company not found: ${input.companyId}`));
    }

    if (input.companyName !== undefined) company.companyName = input.companyName;
    if (input.companyMention !== undefined) company.companyMention = input.companyMention;
    if (input.websiteUrl !== undefined) company.websiteUrl = input.websiteUrl;
    if (input.businessDomain !== undefined) company.businessDomain = input.businessDomain;
    company.updatedAt = new Date();

    await this.companyRepository.save(company);
    return ok(undefined);
  }
}
