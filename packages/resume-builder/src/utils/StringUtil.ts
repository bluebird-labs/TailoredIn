export namespace StringUtil {
  export const ensureEndsWith = (str: string, char: string): string => {
    return str.endsWith(char) ? str : `${str}${char}`;
  };
}
