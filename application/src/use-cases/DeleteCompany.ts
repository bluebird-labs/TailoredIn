import { err, ok, type Result, type ResumeCompanyRepository } from '@tailoredin/domain';

export type DeleteCompanyInput = { companyId: string };

export class DeleteCompany {
  public constructor(private readonly companyRepository: ResumeCompanyRepository) {}

  public async execute(input: DeleteCompanyInput): Promise<Result<void, Error>> {
    try {
      await this.companyRepository.findByIdOrFail(input.companyId);
    } catch {
      return err(new Error(`Company not found: ${input.companyId}`));
    }
    await this.companyRepository.delete(input.companyId);
    return ok(undefined);
  }
}
