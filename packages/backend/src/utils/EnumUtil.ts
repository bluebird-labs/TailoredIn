export namespace EnumUtil {
  export const is = <E extends Record<string, string>>(val: string, enumType: E): val is E[keyof E] => {
    return Object.values(enumType).includes(val);
  };

  export const values = <E extends Record<string, string>>(enumType: E): E[keyof E][] => {
    return Object.values(enumType) as E[keyof E][];
  };
}
