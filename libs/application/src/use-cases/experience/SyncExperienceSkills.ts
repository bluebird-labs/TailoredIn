import { Inject, Injectable } from '@nestjs/common';
import type { CompanyRepository, ExperienceRepository, SkillRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { CompanyDto } from '../../dtos/CompanyDto.js';
import { toCompanyDto } from '../../dtos/CompanyDto.js';
import type { ExperienceDto } from '../../dtos/ExperienceDto.js';
import type { ExperienceSkillDto } from '../../dtos/ExperienceSkillDto.js';
import { toSkillDto } from '../../dtos/SkillDto.js';
import { toExperienceDto } from './ListExperiences.js';

export type SyncExperienceSkillsInput = {
  experienceId: string;
  skillIds: string[];
};

@Injectable()
export class SyncExperienceSkills {
  public constructor(
    @Inject(DI.Experience.Repository) private readonly experienceRepository: ExperienceRepository,
    @Inject(DI.Skill.Repository) private readonly skillRepository: SkillRepository,
    @Inject(DI.Company.Repository) private readonly companyRepository: CompanyRepository
  ) {}

  public async execute(input: SyncExperienceSkillsInput): Promise<ExperienceDto> {
    const experience = await this.experienceRepository.findByIdOrFail(input.experienceId);

    const skills = await this.skillRepository.findByIds(input.skillIds);
    const foundIds = new Set(skills.map(s => s.id));
    const missing = input.skillIds.filter(id => !foundIds.has(id));
    if (missing.length > 0) {
      throw new Error(`Skills not found: ${missing.join(', ')}`);
    }

    experience.syncSkills(input.skillIds);
    await this.experienceRepository.save(experience);

    let company: CompanyDto | null = null;
    if (experience.companyId) {
      const companyEntity = await this.companyRepository.findById(experience.companyId);
      company = companyEntity ? toCompanyDto(companyEntity) : null;
    }

    const skillMap = new Map(skills.map(s => [s.id, s]));
    const experienceSkills: ExperienceSkillDto[] = experience.skills.getItems().map(es => ({
      id: es.id,
      skillId: es.skillId,
      skill: toSkillDto(skillMap.get(es.skillId)!)
    }));

    return toExperienceDto(experience, company, experienceSkills);
  }
}
