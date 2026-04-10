import { EducationId } from '../value-objects/EducationId.js';
import { ValueObjectIdType } from './ValueObjectIdType.js';

export class EducationIdType extends ValueObjectIdType<EducationId> {
  public create(value: string) {
    return new EducationId(value);
  }
}
