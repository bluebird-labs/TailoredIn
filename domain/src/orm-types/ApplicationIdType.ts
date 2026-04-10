import { ApplicationId } from '../value-objects/ApplicationId.js';
import { ValueObjectIdType } from './ValueObjectIdType.js';

export class ApplicationIdType extends ValueObjectIdType<ApplicationId> {
  public create(value: string) {
    return new ApplicationId(value);
  }
}
