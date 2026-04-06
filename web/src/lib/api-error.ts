/**
 * Eden Treaty error handling utilities.
 *
 * Eden Treaty wraps API errors as `{ value: { error: { code, message } } }`.
 * Parameterized route segments (e.g. `api.experiences({ id })`) lose type
 * inference — `EdenRouteSegment` provides an explicit escape hatch.
 */

// biome-ignore lint/suspicious/noExplicitAny: Eden Treaty parameterized route segments lose type inference
export type EdenRouteSegment = any;

// biome-ignore lint/suspicious/noExplicitAny: Eden Treaty error shape is untyped
type EdenError = any;

export function extractApiError(error: EdenError, context: string): string {
  const serverMessage = error?.value?.error?.message;
  if (typeof serverMessage === 'string' && serverMessage.length > 0) {
    return serverMessage;
  }
  return context;
}
