import { LockMode } from '@mikro-orm/postgresql';
import { QueryOpts } from '../../helpers.js';
import { Skill } from './Skill.js';
import { TransientSkill } from './TransientSkill.js';
import { BaseRepository } from '../../BaseRepository.js';

export type SkillRepositoryRefreshOutput = {
  createdCount: number;
  deletedCount: number;
  updatedCount: number;
  totalCount: number;
};

export class SkillRepository extends BaseRepository<Skill> {
  public async refreshAll(
    transientSkills: TransientSkill[],
    opts: QueryOpts = {}
  ): Promise<SkillRepositoryRefreshOutput> {
    if (transientSkills.length === 0) {
      throw new Error(`Empty skills list not allowed for safety.`);
    }

    const transientSkillsMap = new Map<string, TransientSkill>();

    for (const transientSkill of transientSkills) {
      transientSkillsMap.set(transientSkill.key, transientSkill);
    }

    const totalCount = transientSkillsMap.size;

    return this.getEm(opts).transactional(async em => {
      let createdCount = 0;
      let deletedCount = 0;
      let updatedCount = 0;

      // Find and lock all skills.
      const existingSkills = await em.findAll(Skill, {
        lockMode: LockMode.PESSIMISTIC_WRITE
      });

      // Remove existing from input list.
      for (const skill of existingSkills) {
        if (transientSkillsMap.has(skill.key)) {
          const transientSkill = transientSkillsMap.get(skill.key)!;
          skill.refresh({
            name: transientSkill.name,
            affinity: transientSkill.affinity,
            variants: transientSkill.variants
          });

          if (skill.isTouched()) {
            em.persist(skill);
            updatedCount++;
          }

          transientSkillsMap.delete(skill.key); // Won't be inserted.
        } else {
          // Needs to be deleted.
          em.remove(skill);
          deletedCount++;
        }
      }

      // Create new skills.
      for (const transientSkill of transientSkillsMap.values()) {
        const skill = Skill.fromTransient(transientSkill);
        em.persist(skill);
        createdCount++;
      }

      // Save changes.
      await em.flush();

      return {
        createdCount: createdCount,
        deletedCount: deletedCount,
        updatedCount: updatedCount,
        totalCount: totalCount
      } satisfies SkillRepositoryRefreshOutput;
    });
  }
}
