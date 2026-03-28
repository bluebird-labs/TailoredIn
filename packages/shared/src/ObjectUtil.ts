import { cloneDeep, mergeWith } from 'lodash';
import { TypeUtil } from './TypeUtil.js';

export namespace ObjectUtil {
  export const mergeWithOverrides = <T extends object>(source: T, overrides: TypeUtil.DeepPartial<T>): T => {
    // _@ts-expect-error TS thinks the type might be too complex,
    // yet we're guarded by TDepth.
    return mergeWith(cloneDeep(source), overrides, (sourceValue, overrideValue) => {
      if (Array.isArray(sourceValue) && Array.isArray(overrideValue)) {
        return overrideValue;
      }
    });
  };

  export const assignIfDefined = <T extends object, K extends keyof T>(
    target: T,
    key: K,
    val: T[K] | undefined
  ): boolean => {
    if (val !== undefined) {
      target[key] = val;
      return true;
    }

    return false;
  };

  export const assignAllIfDefined = <T extends object>(target: T, source: Partial<T>): void => {
    for (const key in source) {
      assignIfDefined(target, key, source[key]);
    }
  };
}
