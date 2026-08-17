/**
 * Central TanStack Query key registry (MOBILE_MASTER_PLAN §3.6).
 *
 * Keys live in one place so a mutation can invalidate precisely what it changed. Defining them
 * inline at call sites is how two screens end up disagreeing about whether the credit balance
 * is stale.
 *
 * `as const` on every key keeps the tuple types exact for TanStack's inference.
 */
export const queryKeys = {
  /** Studio config + branding. Keyed by studio because the aggregator mode will hold several. */
  config: (dibsStudioId: number) => ['config', dibsStudioId] as const,

  schedule: (dibsStudioId: number, range: string) => ['schedule', dibsStudioId, range] as const,

  /** The studio's bookable services (appointment types). Public studio data. */
  appointmentTypes: (dibsStudioId: number) => ['appointmentTypes', dibsStudioId] as const,
  /** The studio's provider roster. Public studio data. */
  providers: (dibsStudioId: number) => ['providers', dibsStudioId] as const,
  /**
   * One day's open slots for one (service, provider) pair. Deliberately fully keyed: a stale
   * slot grid surviving a date or service change is a double-booking waiting to happen.
   */
  availability: (
    dibsStudioId: number,
    serviceId: number,
    providerId: number | null,
    date: string,
  ) => ['availability', dibsStudioId, serviceId, providerId ?? 'any', date] as const,

  /**
   * The signed-in client's Dibs record, keyed by the EMAIL the session carries — because the
   * userid is the thing this query resolves, so it cannot also be the key. Keying on the live
   * session's email is what guarantees a second client signing in on the same phone reads their
   * own account rather than the previous one's cache entry.
   */
  accountByEmail: (email: string) => ['account', 'byEmail', email] as const,
  account: (userId: number) => ['account', userId] as const,
  passes: (userId: number, dibsStudioId: number) => ['passes', userId, dibsStudioId] as const,
  credit: (userId: number, dibsStudioId: number) => ['credit', userId, dibsStudioId] as const,
  packages: (dibsStudioId: number) => ['packages', dibsStudioId] as const,

  /**
   * Saved cards. NEVER persisted to disk — see the persist whitelist in the query client, and
   * the widget's hard-won rule that a rehydrated card list is not evidence a charge will work.
   */
  paymentMethods: (userId: number) => ['paymentMethods', userId] as const,

  upcoming: (userId: number, dibsStudioId: number) => ['upcoming', userId, dibsStudioId] as const,
  history: (userId: number) => ['history', userId] as const,
  /** Bundled billing timeline. Never persisted — it is account data. */
  accountActivity: (userId: number, dibsStudioId: number) =>
    ['accountActivity', userId, dibsStudioId] as const,
  upcomingPayments: (userId: number, dibsStudioId: number) =>
    ['upcomingPayments', userId, dibsStudioId] as const,
  subscriptions: (userId: number) => ['subscriptions', userId] as const,
  flashCredits: (userId: number, dibsStudioId: number) =>
    ['flashCredits', userId, dibsStudioId] as const,
  milestones: (userId: number) => ['milestones', userId] as const,
} as const;

/**
 * The ONLY query keys allowed to reach AsyncStorage.
 *
 * AsyncStorage is unencrypted. Config and schedule are public studio data and make cold start
 * feel instant; everything else — cards, account, credit, history — stays in memory for the
 * session. This is a whitelist, not a blacklist, so a new key is private until someone
 * deliberately adds it here.
 */
export const PERSISTED_QUERY_PREFIXES: readonly string[] = ['config', 'schedule', 'upcoming'];

export function isPersistableQueryKey(key: readonly unknown[]): boolean {
  return typeof key[0] === 'string' && PERSISTED_QUERY_PREFIXES.includes(key[0]);
}
