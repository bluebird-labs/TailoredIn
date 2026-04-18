/**
 * Pre-normalization map for C-family languages whose names contain symbols
 * that the general rule would collapse into ambiguous slugs.
 *
 * Without this, both "C" and "C++" would normalize to "c", and "C#" / "F#"
 * would also lose their distinguishing characters. The map runs on the exact
 * trimmed input (case-sensitive) before the general rule.
 */
const PRE_NORMALIZATION_MAP: Record<string, string> = {
  C: 'c-lang',
  'C++': 'cpp',
  'C#': 'csharp',
  'F#': 'fsharp',
  'Objective-C': 'objective-c',
  'Objective-C++': 'objective-cpp'
};

/**
 * Normalizes a label into a URL-safe, hyphen-separated slug for dedup matching.
 *
 * Rules (applied in order):
 * 1. trim() — remove leading/trailing whitespace
 * 2. Check the pre-normalization map for exact (case-sensitive) matches
 * 3. toLowerCase() — case-insensitive matching
 * 4. Replace any run of non-alphanumeric characters with a single hyphen
 * 5. Trim leading/trailing hyphens
 *
 * Examples:
 *   "TypeScript"                → "typescript"
 *   "Cloud & Infrastructure"    → "cloud-infrastructure"
 *   "DevOps & CI/CD"           → "devops-ci-cd"
 *   "AI & Machine Learning"    → "ai-machine-learning"
 *   "  Programming   Languages " → "programming-languages"
 *   "Node.js"                  → "node-js"
 *   "scikit-learn"             → "scikit-learn"
 *   "C++"                      → "cpp"  (pre-normalization map)
 */
export function normalizeLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed === '') return '';

  const mapped = PRE_NORMALIZATION_MAP[trimmed];
  if (mapped) return mapped;

  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
