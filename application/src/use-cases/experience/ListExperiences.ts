import type { Bullet, BulletVariant, Experience, ExperienceRepository } from '@tailoredin/domain';
import type { BulletDto, BulletVariantDto, ExperienceDto } from '../../dtos/ExperienceDto.js';

export class ListExperiences {
  public constructor(private readonly experienceRepository: ExperienceRepository) {}

  public async execute(): Promise<ExperienceDto[]> {
    const experiences = await this.experienceRepository.findAll();
    return experiences.map(toExperienceDto);
  }
}

export function toExperienceDto(exp: Experience): ExperienceDto {
  return {
    id: exp.id.value,
    title: exp.title,
    companyName: exp.companyName,
    companyWebsite: exp.companyWebsite,
    location: exp.location,
    startDate: exp.startDate,
    endDate: exp.endDate,
    summary: exp.summary,
    ordinal: exp.ordinal,
    bullets: exp.bullets.map(toBulletDto)
  };
}

function toBulletDto(bullet: Bullet): BulletDto {
  return {
    id: bullet.id.value,
    content: bullet.content,
    ordinal: bullet.ordinal,
    roleTags: [...bullet.tags.roleTags].map(name => ({ id: '', name, dimension: 'ROLE' })),
    skillTags: [...bullet.tags.skillTags].map(name => ({ id: '', name, dimension: 'SKILL' })),
    variants: bullet.variants.map(toVariantDto)
  };
}

function toVariantDto(v: BulletVariant): BulletVariantDto {
  return {
    id: v.id.value,
    text: v.text,
    angle: v.angle,
    source: v.source,
    approvalStatus: v.approvalStatus,
    roleTags: [...v.tags.roleTags].map(name => ({ id: '', name, dimension: 'ROLE' })),
    skillTags: [...v.tags.skillTags].map(name => ({ id: '', name, dimension: 'SKILL' }))
  };
}
