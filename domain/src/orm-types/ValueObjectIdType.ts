import { type Platform, type TransformContext, Type } from '@mikro-orm/core';

export abstract class ValueObjectIdType<T extends { value: string }> extends Type<T, string> {
  public abstract create(value: string): T;

  public override convertToDatabaseValue(value: T | string, _platform: Platform, _context?: TransformContext): string {
    if (value == null) return value as unknown as string;
    return typeof value === 'string' ? value : value.value;
  }

  public override convertToJSValue(value: string, _platform: Platform, _context?: TransformContext): T {
    if (value == null) return value as unknown as T;
    return this.create(value);
  }

  public override getColumnType(): string {
    return 'uuid';
  }
}
