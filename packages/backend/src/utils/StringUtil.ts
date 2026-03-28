export namespace StringUtil {
  export const ensureEndsWith = (str: string, char: string): string => {
    return str.endsWith(char) ? str : `${str}${char}`;
  };

  export const toLowerSnakeCase = (str: string): string => {
    // Convert to lowercase
    const lowercase = str.toLowerCase();
    // Replace non-alphanumeric characters with underscores
    const normalized = lowercase.replace(/[^a-z0-9]/gi, '_');
    // Remove consecutive underscores
    const singleUnderscores = normalized.replace(/_+/g, '_');
    // Trim leading and trailing underscores
    return singleUnderscores.replace(/^_|_$/g, '');
  };
}
