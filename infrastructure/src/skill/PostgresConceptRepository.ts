import { MikroORM } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { Concept, type ConceptRepository } from '@tailoredin/domain';

@Injectable()
export class PostgresConceptRepository implements ConceptRepository {
  public constructor(@Inject(MikroORM) private readonly orm: MikroORM) {}

  public async findAll(): Promise<Concept[]> {
    return this.orm.em.find(Concept, {}, { orderBy: { label: 'ASC' } });
  }
}
