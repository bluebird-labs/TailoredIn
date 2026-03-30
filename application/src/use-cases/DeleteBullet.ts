import { err, ok, type Result, type ResumeCompany, type ResumeCompanyRepository } from '@tailoredin/domain';

export type DeleteBulletInput = {
  companyId: string;
  bulletId: string;
};

export class DeleteBullet {
  public constructor(private readonly companyRepository: ResumeCompanyRepository) {}

  public async execute(input: DeleteBulletInput): Promise<Result<void, Error>> {
    let company: ResumeCompany;
    try {
      company = await this.companyRepository.findByIdOrFail(input.companyId);
    } catch {
      return err(new Error(`Company not found: ${input.companyId}`));
    }

    try {
      company.removeBullet(input.bulletId);
    } catch (e) {
      return err(e as Error);
    }

    await this.companyRepository.save(company);
    return ok(undefined);
  }
}
