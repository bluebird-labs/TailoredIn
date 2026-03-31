import { err, ok, type Result, type ResumeCompany, type ResumeCompanyRepository } from '@tailoredin/domain';

export type DeleteBulletInput = {
  positionId: string;
  bulletId: string;
};

export class DeleteBullet {
  public constructor(private readonly companyRepository: ResumeCompanyRepository) {}

  public async execute(input: DeleteBulletInput): Promise<Result<void, Error>> {
    let company: ResumeCompany;
    try {
      company = await this.companyRepository.findByPositionIdOrFail(input.positionId);
    } catch {
      return err(new Error(`Position not found: ${input.positionId}`));
    }

    try {
      const position = company.findPositionOrFail(input.positionId);
      position.removeBullet(input.bulletId);
    } catch (e) {
      return err(e as Error);
    }

    await this.companyRepository.save(company);
    return ok(undefined);
  }
}
