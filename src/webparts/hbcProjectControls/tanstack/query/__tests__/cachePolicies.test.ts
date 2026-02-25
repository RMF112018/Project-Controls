import { QUERY_STALE_TIMES, QUERY_GC_TIMES, QUERY_GC_TIME, INFINITE_QUERY_MAX_PAGES } from '../cachePolicies';

describe('cachePolicies', () => {
  describe('QUERY_STALE_TIMES', () => {
    it('has expected domain stale times', () => {
      expect(QUERY_STALE_TIMES.reference).toBe(15 * 60 * 1000); // 15 min
      expect(QUERY_STALE_TIMES.dashboard).toBe(2 * 60 * 1000);  // 2 min
      expect(QUERY_STALE_TIMES.permissions).toBe(30 * 1000);     // 30 sec
      expect(QUERY_STALE_TIMES.buyout).toBe(20 * 1000);          // 20 sec
      expect(QUERY_STALE_TIMES.leads).toBe(60 * 1000);           // 1 min
    });
  });

  describe('QUERY_GC_TIMES', () => {
    it('has default gc time of 20 minutes', () => {
      expect(QUERY_GC_TIMES.default).toBe(20 * 60 * 1000);
    });

    it('has reduced infinite query gc time of 5 minutes', () => {
      expect(QUERY_GC_TIMES.infinite).toBe(5 * 60 * 1000);
    });

    it('has audit log gc time of 3 minutes', () => {
      expect(QUERY_GC_TIMES.auditLog).toBe(3 * 60 * 1000);
    });

    it('has reference gc time of 30 minutes', () => {
      expect(QUERY_GC_TIMES.reference).toBe(30 * 60 * 1000);
    });

    it('infinite gc time is shorter than default to prevent page accumulation', () => {
      expect(QUERY_GC_TIMES.infinite).toBeLessThan(QUERY_GC_TIMES.default);
    });
  });

  describe('QUERY_GC_TIME (backward compat alias)', () => {
    it('equals QUERY_GC_TIMES.default', () => {
      expect(QUERY_GC_TIME).toBe(QUERY_GC_TIMES.default);
    });
  });

  describe('INFINITE_QUERY_MAX_PAGES', () => {
    it('is set to 50', () => {
      expect(INFINITE_QUERY_MAX_PAGES).toBe(50);
    });
  });
});
