import { Inject, Injectable } from '@nestjs/common';
import type { ConceptRepository } from '@tailoredin/domain';
import { DI } from '../../DI.js';
import type { ConceptDto } from '../../dtos/ConceptDto.js';
import { toConceptDto } from '../../dtos/ConceptDto.js';

@Injectable()
export class ListConcepts {
  public constructor(@Inject(DI.Skill.ConceptRepository) private readonly conceptRepository: ConceptRepository) {}

  public async execute(): Promise<ConceptDto[]> {
    const concepts = await this.conceptRepository.findAll();
    return concepts.map(toConceptDto);
  }
}
