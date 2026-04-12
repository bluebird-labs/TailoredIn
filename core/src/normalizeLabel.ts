/**
 * Normalizes a label for dedup matching.
 *
 * Rules (applied in order):
 * 1. trim() — remove leading/trailing whitespace
 * 2. toLowerCase() — case-insensitive matching
 * 3. Strip whitespace (spaces, tabs)
 * 4. Strip hyphens/dashes
 * 5. Strip underscores
 * 6. Preserve all other characters: +, #, ., /, @, &, etc.
 */
export function normalizeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]/g, '');
}
