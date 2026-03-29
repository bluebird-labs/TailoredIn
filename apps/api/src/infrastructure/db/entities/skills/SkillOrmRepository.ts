import { LockMode } from '@mikro-orm/postgresql';
import { BaseRepository } from '../../BaseRepository.js';
import { Skill } from './Skill.js';

export class SkillOrmRepository extends BaseRepository<Skill> {
  async refreshAll(newSkills: Skill[]): Promise<{
    createdCount: number;
    deletedCount: number;
    updatedCount: number;
    totalCount: number;
  }> {
    if (newSkills.length === 0) {
      throw new Error('Empty skills list not allowed for safety.');
    }

    const skillsMap = new Map<string, Skill>(newSkills.map(s => [s.key, s]));
    const totalCount = skillsMap.size;

    return this.em.transactional(async em => {
      let createdCount = 0;
      let deletedCount = 0;
      let updatedCount = 0;

      const existingSkills = await em.findAll(Skill, { lockMode: LockMode.PESSIMISTIC_WRITE });

      for (const skill of existingSkills) {
        if (skillsMap.has(skill.key)) {
          const incoming = skillsMap.get(skill.key)!;
          skill.refresh({ name: incoming.name, affinity: incoming.affinity, variants: incoming.variants });
          em.persist(skill);
          updatedCount++;
          skillsMap.delete(skill.key);
        } else {
          em.remove(skill);
          deletedCount++;
        }
      }

      for (const skill of skillsMap.values()) {
        em.persist(skill);
        createdCount++;
      }

      await em.flush();

      return { createdCount, deletedCount, updatedCount, totalCount };
    });
  }
}
