import { AccomplishmentId } from '../value-objects/AccomplishmentId.js';
import { ValueObjectIdType } from './ValueObjectIdType.js';

export class AccomplishmentIdType extends ValueObjectIdType<AccomplishmentId> {
  public create(value: string) {
    return new AccomplishmentId(value);
  }
}
