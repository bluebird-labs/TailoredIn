import { err, ok, type Result, type ResumeCompany, type ResumeCompanyRepository } from '@tailoredin/domain';

export type DeletePositionInput = {
  companyId: string;
  positionId: string;
};

export class DeletePosition {
  public constructor(private readonly companyRepository: ResumeCompanyRepository) {}

  public async execute(input: DeletePositionInput): Promise<Result<void, Error>> {
    let company: ResumeCompany;
    try {
      company = await this.companyRepository.findByIdOrFail(input.companyId);
    } catch {
      return err(new Error(`Company not found: ${input.companyId}`));
    }

    try {
      company.removePosition(input.positionId);
    } catch (e) {
      return err(e as Error);
    }

    await this.companyRepository.save(company);
    return ok(undefined);
  }
}
