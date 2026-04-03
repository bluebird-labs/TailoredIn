/** Escape characters that have special meaning in Typst content brackets [...]. */
export const escapeTypst = (str: string): string =>
  str.replace(/\$/g, '\\$').replace(/</g, '\\<').replace(/>/g, '\\>').replace(/@/g, '\\@');
