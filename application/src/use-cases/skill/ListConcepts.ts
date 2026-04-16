import type { ConceptRepository } from '@tailoredin/domain';
import type { ConceptDto } from '../../dtos/ConceptDto.js';
import { toConceptDto } from '../../dtos/ConceptDto.js';

export class ListConcepts {
  public constructor(private readonly conceptRepository: ConceptRepository) {}

  public async execute(): Promise<ConceptDto[]> {
    const concepts = await this.conceptRepository.findAll();
    return concepts.map(toConceptDto);
  }
}
