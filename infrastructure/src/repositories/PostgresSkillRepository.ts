import type { MikroORM } from '@mikro-orm/postgresql';
import { injectable } from '@needle-di/core';
import {
  Skill as DomainSkill,
  type SkillAffinity,
  type SkillCreateProps,
  SkillId,
  type SkillRefreshOutput,
  type SkillRepository
} from '@tailoredin/domain';
import { Skill as OrmSkill, type SkillCreateProps as OrmSkillCreateProps } from '../db/entities/skills/Skill.js';
import type { SkillOrmRepository } from '../db/entities/skills/SkillOrmRepository.js';

@injectable()
export class PostgresSkillRepository implements SkillRepository {
  public constructor(private readonly orm: MikroORM) {}

  public async refreshAll(skills: SkillCreateProps[]): Promise<SkillRefreshOutput> {
    const repo = this.orm.em.getRepository(OrmSkill) as SkillOrmRepository;
    const ormSkills = skills.map(s => OrmSkill.create(s as OrmSkillCreateProps));
    return repo.refreshAll(ormSkills);
  }

  public async findAll(): Promise<DomainSkill[]> {
    const ormSkills = await this.orm.em.findAll(OrmSkill);
    return ormSkills.map(s => this.toDomain(s));
  }

  private toDomain(orm: OrmSkill): DomainSkill {
    return new DomainSkill({
      id: new SkillId(orm.id),
      name: orm.name,
      key: orm.key,
      affinity: orm.affinity as unknown as SkillAffinity,
      variants: orm.variants,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt
    });
  }
}
