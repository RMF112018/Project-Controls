export const QUERY_STALE_TIMES = {
  reference: 15 * 60 * 1000,
  dashboard: 2 * 60 * 1000,
  projectOperational: 60 * 1000,
  dataMart: 5 * 60 * 1000,
  compliance: 3 * 60 * 1000,
  permissions: 30 * 1000,
  buyout: 20 * 1000,
} as const;

export const QUERY_GC_TIME = 20 * 60 * 1000;
