import { ValueObject } from '../ValueObject.js';

export class ArchetypePositionBulletRef extends ValueObject<{ bulletId: string; ordinal: number }> {
  constructor(bulletId: string, ordinal: number) {
    super({ bulletId, ordinal });
  }

  get bulletId(): string {
    return this.props.bulletId;
  }

  get ordinal(): number {
    return this.props.ordinal;
  }
}
