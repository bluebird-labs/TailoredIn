import { ExperienceId } from '../value-objects/ExperienceId.js';
import { ValueObjectIdType } from './ValueObjectIdType.js';

export class ExperienceIdType extends ValueObjectIdType<ExperienceId> {
  public create(value: string) {
    return new ExperienceId(value);
  }
}
