import { err, ok, type Result, type ResumeCompany, type ResumeCompanyRepository } from '@tailoredin/domain';

export type UpdateCompanyInput = {
  companyId: string;
  companyName?: string;
  companyMention?: string | null;
  websiteUrl?: string | null;
  businessDomain?: string;
  jobTitle?: string | null;
  joinedAt?: string;
  leftAt?: string;
  promotedAt?: string | null;
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
    if (input.jobTitle !== undefined) company.jobTitle = input.jobTitle;
    if (input.joinedAt !== undefined) company.joinedAt = input.joinedAt;
    if (input.leftAt !== undefined) company.leftAt = input.leftAt;
    if (input.promotedAt !== undefined) company.promotedAt = input.promotedAt;
    company.updatedAt = new Date();

    await this.companyRepository.save(company);
    return ok(undefined);
  }
}
