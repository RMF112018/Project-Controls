export const QUERY_STALE_TIMES = {
  reference: 15 * 60 * 1000,
  dashboard: 2 * 60 * 1000,
  projectOperational: 60 * 1000,
  dataMart: 5 * 60 * 1000,
  compliance: 3 * 60 * 1000,
  permissions: 30 * 1000,
  buyout: 20 * 1000,
  // Wave 2
  leads: 60 * 1000,
  gonogo: 30 * 1000,
  schedule: 2 * 60 * 1000,
  riskCost: 60 * 1000,
  monthlyReview: 2 * 60 * 1000,
  workflows: 30 * 1000,
  turnover: 5 * 60 * 1000,
  closeout: 2 * 60 * 1000,
  actionInbox: 60 * 1000,
  connectors: 60 * 1000,
} as const;

/** Per-domain garbage collection times. */
export const QUERY_GC_TIMES = {
  /** Default gcTime for standard queries (20 min). */
  default: 20 * 60 * 1000,
  /** Reduced gcTime for infinite/cursor-paged queries to prevent page accumulation (5 min). */
  infinite: 5 * 60 * 1000,
  /** Shorter gcTime for high-volume audit log queries (3 min). */
  auditLog: 3 * 60 * 1000,
  /** Longer gcTime for reference data that rarely changes (30 min). */
  reference: 30 * 60 * 1000,
} as const;

/** Backward-compatible alias — use QUERY_GC_TIMES.default for new code. */
export const QUERY_GC_TIME = QUERY_GC_TIMES.default;

/** Maximum pages to retain in infinite query cache before evicting oldest. */
export const INFINITE_QUERY_MAX_PAGES = 50;
