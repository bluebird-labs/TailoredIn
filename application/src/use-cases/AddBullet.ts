import { err, ok, type Result, type ResumeCompany, type ResumeCompanyRepository } from '@tailoredin/domain';
import type { ResumeBulletDto } from '../dtos/ResumeDataDto.js';

export type AddBulletInput = {
  companyId: string;
  content: string;
  ordinal: number;
};

export class AddBullet {
  public constructor(private readonly companyRepository: ResumeCompanyRepository) {}

  public async execute(input: AddBulletInput): Promise<Result<ResumeBulletDto, Error>> {
    let company: ResumeCompany;
    try {
      company = await this.companyRepository.findByIdOrFail(input.companyId);
    } catch {
      return err(new Error(`Company not found: ${input.companyId}`));
    }

    const bullet = company.addBullet({ content: input.content, ordinal: input.ordinal });
    await this.companyRepository.save(company);

    return ok({ id: bullet.id.value, content: bullet.content, ordinal: bullet.ordinal });
  }
}
