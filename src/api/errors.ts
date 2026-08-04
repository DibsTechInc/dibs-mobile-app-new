/**
 * One error shape for every API failure, so UI code branches on `retriable` and `status`
 * rather than sniffing messages.
 *
 * PURE TypeScript — no React Native imports, so it is jest-testable in the Node project.
 */

export type ApiErrorCode =
  | 'network' // the request never reached a server
  | 'timeout'
  | 'unauthorized' // 401 — the token is missing, expired, or rejected
  | 'forbidden' // 403
  | 'not_found' // 404
  | 'rate_limited' // 429
  | 'server' // 5xx
  | 'bad_request' // other 4xx
  | 'schema' // we got a 200 whose body is not what we expected
  | 'unknown';

export interface ApiErrorShape {
  status: number | null;
  code: ApiErrorCode;
  message: string;
  /** True when trying the same request again could plausibly succeed. */
  retriable: boolean;
}

export class ApiError extends Error implements ApiErrorShape {
  readonly status: number | null;
  readonly code: ApiErrorCode;
  readonly retriable: boolean;
  /** The raw body, kept for logging. Never render this — see describeApiError. */
  readonly body: unknown;

  constructor(shape: ApiErrorShape & { body?: unknown }) {
    super(shape.message);
    this.name = 'ApiError';
    this.status = shape.status;
    this.code = shape.code;
    this.retriable = shape.retriable;
    this.body = shape.body;
  }
}

/**
 * A 200 whose body does not match the schema we hold for it.
 *
 * Thrown in development so the mismatch is impossible to ignore. In production the client
 * logs and passes the raw data through instead: an additive backend change must never brick a
 * shipped app that cannot be updated for days.
 */
export class ApiSchemaError extends ApiError {
  readonly endpoint: string;
  readonly issues: string[];

  constructor(endpoint: string, issues: string[], body: unknown) {
    super({
      status: 200,
      code: 'schema',
      message: `Response from ${endpoint} did not match its schema:\n${issues.map((i) => `  • ${i}`).join('\n')}`,
      retriable: false,
      body,
    });
    this.name = 'ApiSchemaError';
    this.endpoint = endpoint;
    this.issues = issues;
  }
}

/** Map an HTTP status to our normalized code + retriability. */
export function classifyHttpStatus(status: number): { code: ApiErrorCode; retriable: boolean } {
  if (status === 401) return { code: 'unauthorized', retriable: false };
  if (status === 403) return { code: 'forbidden', retriable: false };
  if (status === 404) return { code: 'not_found', retriable: false };
  if (status === 408) return { code: 'timeout', retriable: true };
  if (status === 429) return { code: 'rate_limited', retriable: true };
  if (status >= 500) return { code: 'server', retriable: true };
  if (status >= 400) return { code: 'bad_request', retriable: false };
  return { code: 'unknown', retriable: false };
}

/**
 * dibs-api is inconsistent about where it puts an error message, and several routes answer
 * HTTP 200 with an error body (the `apiFailureWrapper` pattern the widget had to learn about
 * the hard way). Pull a message out of whatever shape arrived, without ever returning a raw
 * Stripe error — those carry the whole PaymentIntent plus request headers.
 */
export function extractServerMessage(body: unknown): string | null {
  if (typeof body === 'string') return body.trim() || null;
  if (!body || typeof body !== 'object') return null;

  const record = body as Record<string, unknown>;
  for (const key of ['msg', 'message', 'error', 'err', 'errorMessage']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    // `err` is sometimes an object; take its message but never the whole thing.
    if (value && typeof value === 'object') {
      const nested = (value as Record<string, unknown>).message;
      if (typeof nested === 'string' && nested.trim()) return nested.trim();
    }
  }
  return null;
}

/** Copy safe to put in front of a client. Never leaks a server or Stripe internal. */
export function describeApiError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Something went wrong. Please try again.';
  }
  switch (error.code) {
    case 'network':
      return 'No connection. Check your internet and try again.';
    case 'timeout':
      return 'That took too long. Please try again.';
    case 'unauthorized':
      return 'Your session expired. Please sign in again.';
    case 'forbidden':
      return "You don't have access to that.";
    case 'not_found':
      return "We couldn't find that.";
    case 'rate_limited':
      return 'Too many requests. Give it a moment and try again.';
    case 'server':
      return 'The studio’s system is having trouble. Please try again shortly.';
    case 'schema':
      return 'Something went wrong. Please try again.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}
