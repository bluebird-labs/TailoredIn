import { ResumeCompany, type ResumeCompanyRepository, ResumeLocation } from '@tailoredin/domain';
import type { ResumeCompanyDto } from '../dtos/ResumeDataDto.js';

export type CreateCompanyInput = {
  userId: string;
  companyName: string;
  companyMention: string | null;
  websiteUrl: string | null;
  businessDomain: string;
  joinedAt: string;
  leftAt: string;
  promotedAt: string | null;
  locations: { label: string; ordinal: number }[];
  bullets: { content: string; ordinal: number }[];
};

export class CreateCompany {
  public constructor(private readonly companyRepository: ResumeCompanyRepository) {}

  public async execute(input: CreateCompanyInput): Promise<ResumeCompanyDto> {
    const company = ResumeCompany.create({
      userId: input.userId,
      companyName: input.companyName,
      companyMention: input.companyMention,
      websiteUrl: input.websiteUrl,
      businessDomain: input.businessDomain,
      joinedAt: input.joinedAt,
      leftAt: input.leftAt,
      promotedAt: input.promotedAt,
      locations: input.locations.map(l => new ResumeLocation(l.label, l.ordinal)),
      bullets: []
    });
    for (const b of input.bullets) {
      company.addBullet({ content: b.content, ordinal: b.ordinal });
    }
    await this.companyRepository.save(company);
    return {
      id: company.id.value,
      companyName: company.companyName,
      companyMention: company.companyMention,
      websiteUrl: company.websiteUrl,
      businessDomain: company.businessDomain,
      joinedAt: company.joinedAt,
      leftAt: company.leftAt,
      promotedAt: company.promotedAt,
      locations: company.locations.map(l => ({ label: l.label, ordinal: l.ordinal })),
      bullets: company.bullets.map(b => ({ id: b.id.value, content: b.content, ordinal: b.ordinal }))
    };
  }
}
