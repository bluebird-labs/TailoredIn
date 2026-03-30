import { ValueObject } from '../ValueObject.js';

export class ArchetypePositionBulletRef extends ValueObject<{ bulletId: string; ordinal: number }> {
  public constructor(bulletId: string, ordinal: number) {
    super({ bulletId, ordinal });
  }

  public get bulletId(): string {
    return this.props.bulletId;
  }

  public get ordinal(): number {
    return this.props.ordinal;
  }
}
