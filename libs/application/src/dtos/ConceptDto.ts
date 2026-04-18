import type { Concept, ConceptKind } from '@tailoredin/domain';

export type ConceptDto = {
  readonly id: string;
  readonly label: string;
  readonly kind: ConceptKind;
  readonly category: string | null;
};

export function toConceptDto(concept: Concept): ConceptDto {
  return {
    id: concept.id,
    label: concept.label,
    kind: concept.kind,
    category: concept.category
  };
}
