/**
 * Strips markdown code fences (```json ... ```) from a string.
 * Claude CLI sometimes wraps JSON responses in code fences even when
 * asked to return raw JSON.
 */
export function stripCodeFences(text: string): string {
  if (typeof text !== 'string') return text;
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  return match ? match[1].trim() : trimmed;
}
