import { ObjectUtil } from '../src/ObjectUtil.js';

describe('ObjectUtil', () => {
  describe('mergeWithOverrides', () => {
    test('deep merges objects', () => {
      const source = { a: 1, b: { c: 2, d: 3 } };
      const result = ObjectUtil.mergeWithOverrides(source, { b: { c: 10 } });
      expect(result).toEqual({ a: 1, b: { c: 10, d: 3 } });
    });

    test('does not mutate the source', () => {
      const source = { a: 1, b: { c: 2 } };
      ObjectUtil.mergeWithOverrides(source, { b: { c: 10 } });
      expect(source.b.c).toBe(2);
    });

    test('replaces arrays instead of merging them', () => {
      const source = { items: [1, 2, 3] };
      const result = ObjectUtil.mergeWithOverrides(source, { items: [4, 5] });
      expect(result.items).toEqual([4, 5]);
    });
  });

  describe('assignIfDefined', () => {
    test('assigns when value is defined', () => {
      const obj = { name: 'old' };
      const changed = ObjectUtil.assignIfDefined(obj, 'name', 'new');
      expect(obj.name).toBe('new');
      expect(changed).toBe(true);
    });

    test('does not assign when value is undefined', () => {
      const obj = { name: 'old' };
      const changed = ObjectUtil.assignIfDefined(obj, 'name', undefined);
      expect(obj.name).toBe('old');
      expect(changed).toBe(false);
    });

    test('assigns null (null is defined)', () => {
      const obj: { name: string | null } = { name: 'old' };
      const changed = ObjectUtil.assignIfDefined(obj, 'name', null);
      expect(obj.name).toBeNull();
      expect(changed).toBe(true);
    });
  });

  describe('assignAllIfDefined', () => {
    test('assigns only defined properties', () => {
      const obj = { a: 1, b: 2, c: 3 };
      ObjectUtil.assignAllIfDefined(obj, { a: 10, b: undefined });
      expect(obj).toEqual({ a: 10, b: 2, c: 3 });
    });
  });
});
