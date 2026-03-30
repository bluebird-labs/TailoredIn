import { ValueObject } from '../ValueObject.js';

export class ArchetypeEducationSelection extends ValueObject<{ educationId: string; ordinal: number }> {
  constructor(educationId: string, ordinal: number) {
    super({ educationId, ordinal });
  }

  get educationId(): string {
    return this.props.educationId;
  }

  get ordinal(): number {
    return this.props.ordinal;
  }
}

export class ArchetypeSkillCategorySelection extends ValueObject<{ categoryId: string; ordinal: number }> {
  constructor(categoryId: string, ordinal: number) {
    super({ categoryId, ordinal });
  }

  get categoryId(): string {
    return this.props.categoryId;
  }

  get ordinal(): number {
    return this.props.ordinal;
  }
}

export class ArchetypeSkillItemSelection extends ValueObject<{ itemId: string; ordinal: number }> {
  constructor(itemId: string, ordinal: number) {
    super({ itemId, ordinal });
  }

  get itemId(): string {
    return this.props.itemId;
  }

  get ordinal(): number {
    return this.props.ordinal;
  }
}
