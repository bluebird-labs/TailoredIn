import { ProfileId } from '../value-objects/ProfileId.js';
import { ValueObjectIdType } from './ValueObjectIdType.js';

export class ProfileIdType extends ValueObjectIdType<ProfileId> {
  public create(value: string) {
    return new ProfileId(value);
  }
}
