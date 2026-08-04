/**
 * The typed API client. Everything that talks to dibs-api goes through here.
 *
 * PURE TypeScript — deliberately no React Native or Firebase imports, so it is fully testable
 * in the Node jest project with a stubbed fetch. The app wires the real dependencies in
 * `src/api/index.ts`.
 *
 * Contract (MOBILE_MASTER_PLAN §3.2):
 *  • every request carries the Firebase ID token when a user is signed in;
 *  • every response is validated by a zod schema;
 *  • a schema mismatch throws in development and passes through in production;
 *  • errors normalize to `{ status, code, message, retriable }`;
 *  • 401 hands off to the sign-out flow exactly once per response.
 */
import type { ZodType } from 'zod';

import { ApiError, ApiSchemaError, classifyHttpStatus, extractServerMessage } from './errors';

export interface ApiClientOptions {
  /** Base URL including the /api/v2 suffix. Comes from the white-label studio config. */
  baseUrl: string;
  /**
   * Returns a fresh Firebase ID token, or null when signed out.
   * The Firebase SDK caches and refreshes these — never persist a raw token ourselves.
   */
  getIdToken: () => Promise<string | null>;
  /** Called when the server rejects our token. Wired to the sign-out flow. */
  onUnauthorized?: () => void;
  /** Throw on schema mismatch (dev) vs. log and pass through (prod). */
  strictSchemas?: boolean;
  /** Reported schema mismatches, so production can log without throwing. */
  onSchemaMismatch?: (endpoint: string, issues: string[]) => void;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface RequestOptions {
  /** Send the Authorization header even though the route does not strictly require it. */
  authenticated?: boolean;
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT_MS = 20_000;

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export class ApiClient {
  private readonly options: Required<Pick<ApiClientOptions, 'baseUrl' | 'getIdToken'>> &
    ApiClientOptions;

  constructor(options: ApiClientOptions) {
    this.options = options;
  }

  /**
   * dibs-api is POST-for-everything, apart from a couple of GET routes. `get` exists for those.
   */
  async post<T>(
    path: string,
    body: Record<string, unknown>,
    schema: ZodType<T>,
    requestOptions: RequestOptions = {},
  ): Promise<T> {
    return this.request(path, schema, requestOptions, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async get<T>(
    path: string,
    query: Record<string, string | number | undefined>,
    schema: ZodType<T>,
    requestOptions: RequestOptions = {},
  ): Promise<T> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return this.request(`${path}${suffix}`, schema, requestOptions, { method: 'GET' });
  }

  private async request<T>(
    path: string,
    schema: ZodType<T>,
    requestOptions: RequestOptions,
    init: { method: string; body?: string },
  ): Promise<T> {
    const doFetch = this.options.fetchImpl ?? fetch;
    const url = joinUrl(this.options.baseUrl, path);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // Attach the token whenever we have one. Sending it to a route that ignores it is free;
    // omitting it from a route that wants it is a 401 the user experiences as a broken screen.
    const token = await this.safeGetToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const timeoutMs = this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    // Honour a caller-supplied cancellation (TanStack Query passes one) alongside our timeout.
    const abortFromCaller = () => controller.abort();
    requestOptions.signal?.addEventListener('abort', abortFromCaller);

    let response: Response;
    try {
      response = await doFetch(url, { ...init, headers, signal: controller.signal });
    } catch (cause) {
      const aborted = requestOptions.signal?.aborted === true;
      throw new ApiError({
        status: null,
        // A caller-driven abort is not a network failure and must not be retried.
        code: aborted ? 'unknown' : 'network',
        message: aborted ? 'Request cancelled.' : `Could not reach ${url}.`,
        retriable: !aborted,
        body: cause,
      });
    } finally {
      clearTimeout(timer);
      requestOptions.signal?.removeEventListener('abort', abortFromCaller);
    }

    const raw = await this.readBody(response);

    if (!response.ok) {
      const { code, retriable } = classifyHttpStatus(response.status);
      if (code === 'unauthorized') this.options.onUnauthorized?.();
      throw new ApiError({
        status: response.status,
        code,
        message: extractServerMessage(raw) ?? `Request to ${path} failed (${response.status}).`,
        retriable,
        body: raw,
      });
    }

    const parsed = schema.safeParse(raw);
    if (parsed.success) return parsed.data;

    const issues = parsed.error.issues.map(
      (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
    );
    this.options.onSchemaMismatch?.(path, issues);
    if (this.options.strictSchemas) throw new ApiSchemaError(path, issues, raw);

    // Production: an additive backend change must not brick an app that cannot be updated for
    // days. Log it and let the screen render with whatever arrived.
    return raw as T;
  }

  private async safeGetToken(): Promise<string | null> {
    try {
      return await this.options.getIdToken();
    } catch {
      // Being unable to mint a token is not itself a request failure — plenty of routes are
      // public. Let the request go unauthenticated and let the server decide.
      return null;
    }
  }

  private async readBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      // Heroku/Railway error pages and proxy responses are HTML. Keep the text for the message.
      return text;
    }
  }
}
