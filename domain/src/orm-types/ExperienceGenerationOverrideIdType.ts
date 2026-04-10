import { ExperienceGenerationOverrideId } from '../value-objects/ExperienceGenerationOverrideId.js';
import { ValueObjectIdType } from './ValueObjectIdType.js';

export class ExperienceGenerationOverrideIdType extends ValueObjectIdType<ExperienceGenerationOverrideId> {
  public create(value: string) {
    return new ExperienceGenerationOverrideId(value);
  }
}
