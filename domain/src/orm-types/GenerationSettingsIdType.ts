import { GenerationSettingsId } from '../value-objects/GenerationSettingsId.js';
import { ValueObjectIdType } from './ValueObjectIdType.js';

export class GenerationSettingsIdType extends ValueObjectIdType<GenerationSettingsId> {
  public create(value: string) {
    return new GenerationSettingsId(value);
  }
}
