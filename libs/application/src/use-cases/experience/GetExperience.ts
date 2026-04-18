import { Inject, Injectable } from '@nestjs/common';
import type { CompanyRepository, ExperienceRepository, SkillRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';
import type { ExperienceSkillDto } from '../../dtos/ExperienceSkillDto.js';
import { toSkillDto } from '../../dtos/SkillDto.js';
import { toExperienceDto } from '../experience/ListExperiences.js';

export type GetExperienceInput = {
  experienceId: string;
};

@Injectable()
export class GetExperience {
  public constructor(
    @Inject(DI.Experience.Repository) private readonly experienceRepository: ExperienceRepository,
    @Inject(DI.Company.Repository) private readonly companyRepository: CompanyRepository,
    @Inject(DI.Skill.Repository) private readonly skillRepository: SkillRepository
  ) {}

  public async execute(input: GetExperienceInput): Promise<ExperienceDto> {
    const experience = await this.experienceRepository.findByIdOrFail(input.experienceId);
    const company = experience.companyId ? await this.companyRepository.findById(experience.companyId) : null;

    const experienceSkillItems = experience.skills.getItems();
    const skillIds = experienceSkillItems.map(es => es.skillId);
    const skills = skillIds.length > 0 ? await this.skillRepository.findByIds(skillIds) : [];
    const skillMap = new Map(skills.map(s => [s.id, s]));
    const experienceSkills: ExperienceSkillDto[] = experienceSkillItems.map(es => ({
      id: es.id,
      skillId: es.skillId,
      skill: toSkillDto(skillMap.get(es.skillId)!)
    }));

    return toExperienceDto(experience, company ? toCompanyDto(company) : null, experienceSkills);
  }
}
