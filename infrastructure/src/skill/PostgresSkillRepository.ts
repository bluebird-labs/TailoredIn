import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { Skill, type SkillRepository } from '@tailoredin/domain';

@injectable()
export class PostgresSkillRepository implements SkillRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findByIds(ids: string[]): Promise<Skill[]> {
    if (ids.length === 0) return [];
    // biome-ignore lint/style/useNamingConvention: MikroORM query operator
    return this.orm.em.find(Skill, { id: { $in: ids } });
  }

  public async search(query: string, limit: number): Promise<Skill[]> {
    const conn = this.orm.em.getConnection();
    const rows = await conn.execute<{ id: string }[]>(
      `SELECT id FROM skills
       WHERE search_text % ? OR search_text ILIKE ?
       ORDER BY similarity(search_text, ?) DESC
       LIMIT ?`,
      [query, `${query}%`, query, limit]
    );

    if (rows.length === 0) return [];

    const ids = rows.map(r => r.id);
    // biome-ignore lint/style/useNamingConvention: MikroORM query operator
    const skills = await this.orm.em.find(Skill, { id: { $in: ids } });

    // Preserve similarity ranking from the raw query
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
