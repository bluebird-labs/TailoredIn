import { MikroORM } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { Skill, type SkillRepository } from '@tailoredin/domain';

@Injectable()
export class PostgresSkillRepository implements SkillRepository {
  public constructor(@Inject(MikroORM) private readonly orm: MikroORM) {}

  public async findByIds(ids: string[]): Promise<Skill[]> {
    if (ids.length === 0) return [];
    return this.orm.em.find(Skill, { id: { $in: ids } });
  }

  public async search(query: string, limit: number): Promise<Skill[]> {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];

    const conn = this.orm.em.getConnection();
    const rows: { id: string }[] = await conn.execute(
      `SELECT matched.skill_id AS id
       FROM (
         SELECT skill_id, SUM(word_similarity(?, word)) AS score, MIN(word) AS first_word
         FROM skill_search_terms
         WHERE ? <% word
         GROUP BY skill_id
       ) matched
       JOIN (
         SELECT skill_id, COUNT(*) AS label_word_count
         FROM skill_search_terms
         WHERE kind = 'label'
         GROUP BY skill_id
       ) totals ON totals.skill_id = matched.skill_id
       ORDER BY matched.score DESC, totals.label_word_count ASC, matched.first_word ASC
       LIMIT ?`,
      [q, q, limit]
    );

    if (rows.length === 0) return [];

    const ids = rows.map(r => r.id);
    const skills = await this.orm.em.find(Skill, { id: { $in: ids } });

    const idOrder = new Map(ids.map((id, i) => [id, i]));
    return skills.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));
  }

  public async findAll(): Promise<Skill[]> {
    return this.orm.em.find(Skill, {}, { orderBy: { label: 'ASC' } });
  }

  public async findByNormalizedLabel(normalizedLabel: string): Promise<Skill | null> {
    return this.orm.em.findOne(Skill, { normalizedLabel });
  }
}
