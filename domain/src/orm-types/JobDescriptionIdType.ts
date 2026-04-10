import { JobDescriptionId } from '../value-objects/JobDescriptionId.js';
import { ValueObjectIdType } from './ValueObjectIdType.js';

export class JobDescriptionIdType extends ValueObjectIdType<JobDescriptionId> {
  public create(value: string) {
    return new JobDescriptionId(value);
  }
}
