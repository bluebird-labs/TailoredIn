import { MikroORM } from '@mikro-orm/postgresql';
import { inject, injectable } from '@needle-di/core';
import { Concept, type ConceptRepository } from '@tailoredin/domain';

@injectable()
export class PostgresConceptRepository implements ConceptRepository {
  public constructor(private readonly orm: MikroORM = inject(MikroORM)) {}

  public async findAll(): Promise<Concept[]> {
    return this.orm.em.find(Concept, {}, { orderBy: { label: 'ASC' } });
  }
}
