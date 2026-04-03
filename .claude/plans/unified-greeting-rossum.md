# Plan: Log Stack Trace on 500 Errors

## Context

When the API returns a 500, only the HTTP request line is logged (method, path, status, duration). The underlying error — including its message and stack trace — is silently swallowed. This makes debugging production 500s very painful.

## Change

**File:** `api/src/index.ts` — `onError` handler (line 139)

Add a `log.error(error)` call inside the `onError` hook, scoped to `statusCode === 500`. `tslog` will print the full stack trace in dev (pretty) and a structured JSON stack entry in production.

```diff
  .onError(({ request, error, set, code }) => {
    const err = error as unknown as { statusCode?: number; message?: string };
    const message = err.message ?? String(error);

    if (code === 'VALIDATION') return;

    const statusCode = err.statusCode ?? 500;
    set.status = statusCode;
    logRequest(request, statusCode, startTimes.get(request));
+   if (statusCode === 500) log.error(error);
    return {
      error: {
        code: statusCode === 500 ? 'INTERNAL_ERROR' : 'SERVER_ERROR',
        message: statusCode === 500 ? 'Internal server error' : message
      }
    };
  })
```

## Verification

Trigger a 500 (e.g. throw an unhandled error from a route or temporarily add `throw new Error('test')` in a handler) and confirm the stack trace appears in the terminal output.
