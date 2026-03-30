import { ValueObject } from '../ValueObject.js';

export class ArchetypeEducationSelection extends ValueObject<{ educationId: string; ordinal: number }> {
  public constructor(educationId: string, ordinal: number) {
    super({ educationId, ordinal });
  }

  public get educationId(): string {
    return this.props.educationId;
  }

  public get ordinal(): number {
    return this.props.ordinal;
  }
}

export class ArchetypeSkillCategorySelection extends ValueObject<{ categoryId: string; ordinal: number }> {
  public constructor(categoryId: string, ordinal: number) {
    super({ categoryId, ordinal });
  }

  public get categoryId(): string {
    return this.props.categoryId;
  }

  public get ordinal(): number {
    return this.props.ordinal;
  }
}

export class ArchetypeSkillItemSelection extends ValueObject<{ itemId: string; ordinal: number }> {
  public constructor(itemId: string, ordinal: number) {
    super({ itemId, ordinal });
  }

  public get itemId(): string {
    return this.props.itemId;
  }

  public get ordinal(): number {
    return this.props.ordinal;
  }
}
