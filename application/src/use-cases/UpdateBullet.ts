import { err, ok, type Result, type ResumeCompany, type ResumeCompanyRepository } from '@tailoredin/domain';

export type UpdateBulletInput = {
  companyId: string;
  bulletId: string;
  content?: string;
  ordinal?: number;
};

export class UpdateBullet {
  public constructor(private readonly companyRepository: ResumeCompanyRepository) {}

  public async execute(input: UpdateBulletInput): Promise<Result<void, Error>> {
    let company: ResumeCompany;
    try {
      company = await this.companyRepository.findByIdOrFail(input.companyId);
    } catch {
      return err(new Error(`Company not found: ${input.companyId}`));
    }

    try {
      company.updateBullet(input.bulletId, { content: input.content, ordinal: input.ordinal });
    } catch (e) {
      return err(e as Error);
    }

    await this.companyRepository.save(company);
    return ok(undefined);
  }
}
