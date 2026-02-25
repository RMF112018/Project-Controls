/**
 * GraphBatchEnforcer — Mutation-Killing Supplement Tests
 *
 * Targets mutation-vulnerable code: exact constant values (coalescence window,
 * flush threshold, max queue depth), boundary conditions (2 vs 3 items, 49 vs 50),
 * timer mechanics, backpressure error properties, high water mark tracking,
 * dispose semantics, feature flag passthrough zero-overhead, and audit logger
 * fire-and-forget behavior.
 */
import { GraphBatchEnforcer, MAX_QUEUE_DEPTH, BackpressureError } from '../GraphBatchEnforcer';
import type { GraphBatchService, IBatchRequest, IBatchResult, IBatchResponse } from '../GraphBatchService';
import type { GraphAuditLogger } from '../GraphService';
import { AuditAction, EntityType } from '../../models/enums';

// ── Helpers ─────────────────────────────────────────────────────────────────

function createMockBatchService(
  responseFactory?: (requests: IBatchRequest[]) => IBatchResult,
): GraphBatchService {
  const defaultFactory = (requests: IBatchRequest[]): IBatchResult => {
    const responses: IBatchResponse[] = requests.map(r => ({
      id: r.id ?? '1',
      status: 200,
      body: { value: `result-${r.id}` },
    }));
    return {
      responses,
      succeeded: responses,
      permanentFailures: [],
      transientFailures: [],
    };
  };

  return {
    executeBatch: jest.fn().mockImplementation(responseFactory ?? defaultFactory),
    initialize: jest.fn(),
    setAuditLogger: jest.fn(),
  } as unknown as GraphBatchService;
}

function makeRequest(id: string): IBatchRequest {
  return { id, method: 'GET', url: `/test/${id}` };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('GraphBatchEnforcer — Mutation-Killing Supplement', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── Exported Constant Assertions ──

  describe('exported constants', () => {
    it('MAX_QUEUE_DEPTH is exactly 50', () => {
      expect(MAX_QUEUE_DEPTH).toBe(50);
      expect(MAX_QUEUE_DEPTH).not.toBe(49);
      expect(MAX_QUEUE_DEPTH).not.toBe(51);
    });
  });

  // ── Coalescence Window Boundary ──

  describe('coalescence window timing', () => {
    it('does NOT flush at 9ms (1ms before window)', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      const p = enforcer.enqueue(makeRequest('1'));
      p.catch(() => { /* disposed below */ });
      jest.advanceTimersByTime(9);

      expect(batchService.executeBatch).not.toHaveBeenCalled();
      expect(enforcer.getPendingCount()).toBe(1);

      // Clean up
      enforcer.dispose();
    });

    it('flushes at exactly 10ms (coalescence window)', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      const promise = enforcer.enqueue(makeRequest('1'));
      jest.advanceTimersByTime(10);

      const result = await promise;
      expect(result.status).toBe(200);
      expect(batchService.executeBatch).toHaveBeenCalledTimes(1);
    });

    it('timer fires only once even with multiple sub-threshold enqueues', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      // Enqueue 2 items (below threshold of 3)
      enforcer.enqueue(makeRequest('1'));
      jest.advanceTimersByTime(3);
      enforcer.enqueue(makeRequest('2'));

      // The timer was set on the first enqueue; it should fire at the 10ms mark
      // (from first enqueue, not from second)
      jest.advanceTimersByTime(7); // total 10ms from first enqueue

      await jest.advanceTimersByTimeAsync(0); // flush microtasks
      expect(batchService.executeBatch).toHaveBeenCalledTimes(1);
      expect((batchService.executeBatch as jest.Mock).mock.calls[0][0]).toHaveLength(2);
    });
  });

  // ── Flush Threshold Boundary ──

  describe('flush threshold boundary', () => {
    it('2 items do NOT trigger immediate flush', () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      const p1 = enforcer.enqueue(makeRequest('1'));
      const p2 = enforcer.enqueue(makeRequest('2'));
      p1.catch(() => { /* disposed below */ });
      p2.catch(() => { /* disposed below */ });

      // Should NOT have flushed immediately
      expect(batchService.executeBatch).not.toHaveBeenCalled();
      expect(enforcer.getPendingCount()).toBe(2);

      enforcer.dispose();
    });

    it('3rd item triggers immediate flush (threshold = 3)', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      enforcer.enqueue(makeRequest('1'));
      enforcer.enqueue(makeRequest('2'));
      expect(batchService.executeBatch).not.toHaveBeenCalled();

      const p3 = enforcer.enqueue(makeRequest('3'));
      // Flush is triggered synchronously (though executeBatch is async)
      await p3;
      expect(batchService.executeBatch).toHaveBeenCalledTimes(1);
      expect((batchService.executeBatch as jest.Mock).mock.calls[0][0]).toHaveLength(3);
    });

    it('4th item starts a new batch cycle after threshold flush', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      const p1 = enforcer.enqueue(makeRequest('1'));
      const p2 = enforcer.enqueue(makeRequest('2'));
      const p3 = enforcer.enqueue(makeRequest('3'));
      await Promise.all([p1, p2, p3]);

      // Queue should be empty after flush
      expect(enforcer.getPendingCount()).toBe(0);

      // 4th item starts fresh cycle
      const p4 = enforcer.enqueue(makeRequest('4'));
      p4.catch(() => { /* disposed below */ });
      expect(enforcer.getPendingCount()).toBe(1);

      enforcer.dispose();
    });
  });

  // ── Backpressure Boundary ──

  describe('backpressure boundary conditions', () => {
    function fillQueueInternally(enforcer: GraphBatchEnforcer, count: number): void {
      const internalQueue = (enforcer as unknown as { queue: unknown[] }).queue;
      for (let i = 0; i < count; i++) {
        internalQueue.push({
          request: makeRequest(`fill-${i}`),
          resolve: () => {},
          reject: () => {},
        });
      }
    }

    it('enqueue succeeds when queue has 49 items (below MAX_QUEUE_DEPTH)', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);
      fillQueueInternally(enforcer, 49);

      // queue.length is 49, which is < MAX_QUEUE_DEPTH (50), so enqueue should NOT reject
      // (After accepting, threshold flush triggers since 50 >= 3, clearing the queue)
      const result = await enforcer.enqueue(makeRequest('50th'));

      // Should have succeeded (not rejected with BackpressureError)
      expect(result.status).toBe(200);
      // Flush cleared the queue
      expect(enforcer.getPendingCount()).toBe(0);
    });

    it('rejects when queue length equals MAX_QUEUE_DEPTH', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);
      fillQueueInternally(enforcer, MAX_QUEUE_DEPTH);

      // Now queue.length === 50, >= MAX_QUEUE_DEPTH, so next enqueue rejects
      await expect(enforcer.enqueue(makeRequest('overflow'))).rejects.toThrow('backpressure');

      enforcer.dispose();
    });

    it('BackpressureError has correct pendingCount and maxDepth properties', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);
      fillQueueInternally(enforcer, MAX_QUEUE_DEPTH);

      try {
        await enforcer.enqueue(makeRequest('over'));
        fail('Expected BackpressureError');
      } catch (err) {
        expect(err).toBeInstanceOf(BackpressureError);
        const bpErr = err as BackpressureError;
        expect(bpErr.pendingCount).toBe(MAX_QUEUE_DEPTH);
        expect(bpErr.maxDepth).toBe(MAX_QUEUE_DEPTH);
        expect(bpErr.name).toBe('BackpressureError');
        expect(bpErr.message).toContain(`${MAX_QUEUE_DEPTH}/${MAX_QUEUE_DEPTH}`);
      }

      enforcer.dispose();
    });

    it('BackpressureError constructor sets exact message format', () => {
      const err = new BackpressureError(42, 50);
      expect(err.pendingCount).toBe(42);
      expect(err.maxDepth).toBe(50);
      expect(err.message).toBe('GraphBatchEnforcer backpressure: queue full (42/50)');
      expect(err.name).toBe('BackpressureError');
      expect(err).toBeInstanceOf(Error);
    });
  });

  // ── High Water Mark ──

  describe('high water mark tracking', () => {
    it('starts at 0', () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);
      expect(enforcer.getHighWaterMark()).toBe(0);
      enforcer.dispose();
    });

    it('increases as queue grows', () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      const p1 = enforcer.enqueue(makeRequest('1'));
      p1.catch(() => { /* disposed below */ });
      expect(enforcer.getHighWaterMark()).toBe(1);

      const p2 = enforcer.enqueue(makeRequest('2'));
      p2.catch(() => { /* disposed below */ });
      expect(enforcer.getHighWaterMark()).toBe(2);

      enforcer.dispose();
    });

    it('does NOT decrease after flush', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      const p1 = enforcer.enqueue(makeRequest('1'));
      const p2 = enforcer.enqueue(makeRequest('2'));
      const p3 = enforcer.enqueue(makeRequest('3'));
      await Promise.all([p1, p2, p3]);

      // Queue is empty after flush
      expect(enforcer.getPendingCount()).toBe(0);
      // But high water mark retains the peak
      expect(enforcer.getHighWaterMark()).toBe(3);
    });

    it('tracks across multiple flush cycles', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      // First cycle: 3 items
      const a = Promise.all([
        enforcer.enqueue(makeRequest('1')),
        enforcer.enqueue(makeRequest('2')),
        enforcer.enqueue(makeRequest('3')),
      ]);
      await a;
      expect(enforcer.getHighWaterMark()).toBe(3);

      // Second cycle: only 2 items (below previous high)
      const p4 = enforcer.enqueue(makeRequest('4'));
      const p5 = enforcer.enqueue(makeRequest('5'));
      p4.catch(() => { /* disposed below */ });
      p5.catch(() => { /* disposed below */ });
      // High water mark stays at 3, not reduced to 2
      expect(enforcer.getHighWaterMark()).toBe(3);

      enforcer.dispose();
    });
  });

  // ── Dispose Semantics ──

  describe('dispose semantics', () => {
    it('dispose rejects with exact message "GraphBatchEnforcer disposed"', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      const p1 = enforcer.enqueue(makeRequest('1'));
      enforcer.dispose();

      await expect(p1).rejects.toThrow('GraphBatchEnforcer disposed');
    });

    it('dispose clears queue to 0 pending', () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      const p1 = enforcer.enqueue(makeRequest('1'));
      const p2 = enforcer.enqueue(makeRequest('2'));
      p1.catch(() => { /* disposed below */ });
      p2.catch(() => { /* disposed below */ });
      expect(enforcer.getPendingCount()).toBe(2);

      enforcer.dispose();
      expect(enforcer.getPendingCount()).toBe(0);
    });

    it('dispose during pending timer does not throw', () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      const p = enforcer.enqueue(makeRequest('1'));
      p.catch(() => { /* disposed below */ });
      // Timer is pending (10ms window)
      expect(() => enforcer.dispose()).not.toThrow();
    });

    it('timer does not fire after dispose (no stale flush)', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      const p = enforcer.enqueue(makeRequest('1'));
      p.catch(() => { /* disposed below */ });
      enforcer.dispose();

      // Advance past coalescence window
      jest.advanceTimersByTime(20);
      await jest.advanceTimersByTimeAsync(0);

      // executeBatch should NOT have been called (timer was cleared)
      expect(batchService.executeBatch).not.toHaveBeenCalled();
    });
  });

  // ── Feature Off Passthrough ──

  describe('feature OFF passthrough', () => {
    it('executes immediately with single-item array (no batching)', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => false);

      await enforcer.enqueue(makeRequest('1'));

      expect(batchService.executeBatch).toHaveBeenCalledTimes(1);
      // Should be called with array of exactly 1 request
      expect((batchService.executeBatch as jest.Mock).mock.calls[0][0]).toHaveLength(1);
    });

    it('queue is never populated in passthrough mode', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => false);

      await enforcer.enqueue(makeRequest('1'));
      expect(enforcer.getPendingCount()).toBe(0);

      await enforcer.enqueue(makeRequest('2'));
      expect(enforcer.getPendingCount()).toBe(0);
    });

    it('high water mark stays 0 in passthrough mode', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => false);

      await enforcer.enqueue(makeRequest('1'));
      await enforcer.enqueue(makeRequest('2'));
      await enforcer.enqueue(makeRequest('3'));

      expect(enforcer.getHighWaterMark()).toBe(0);
    });

    it('no timer is created in passthrough mode', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => false);

      await enforcer.enqueue(makeRequest('1'));
      // Verify internal timer is null
      const timer = (enforcer as unknown as { timer: unknown }).timer;
      expect(timer).toBeNull();
    });
  });

  // ── Audit Logger ──

  describe('audit logger fire-and-forget', () => {
    it('logCoalescence fires with correct Action and EntityType', async () => {
      const batchService = createMockBatchService();
      const auditLogger = jest.fn().mockResolvedValue(undefined);
      const enforcer = new GraphBatchEnforcer(batchService, () => true, auditLogger);

      const p1 = enforcer.enqueue(makeRequest('1'));
      const p2 = enforcer.enqueue(makeRequest('2'));
      const p3 = enforcer.enqueue(makeRequest('3'));
      await Promise.all([p1, p2, p3]);

      expect(auditLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: AuditAction.BatchEnforcerCoalesced,
          EntityType: EntityType.GraphApi,
          EntityId: 'GraphBatchEnforcer',
          User: 'system',
        })
      );
    });

    it('logCoalescence Details includes exact request count', async () => {
      const batchService = createMockBatchService();
      const auditLogger = jest.fn().mockResolvedValue(undefined);
      const enforcer = new GraphBatchEnforcer(batchService, () => true, auditLogger);

      const p1 = enforcer.enqueue(makeRequest('1'));
      const p2 = enforcer.enqueue(makeRequest('2'));
      const p3 = enforcer.enqueue(makeRequest('3'));
      await Promise.all([p1, p2, p3]);

      const details = (auditLogger.mock.calls[0][0] as Record<string, unknown>).Details as string;
      expect(details).toMatch(/^Coalesced 3 requests in \d+ms window$/);
    });

    it('logBackpressure fires on queue full rejection', async () => {
      const batchService = createMockBatchService();
      const auditLogger = jest.fn().mockResolvedValue(undefined);
      const enforcer = new GraphBatchEnforcer(batchService, () => true, auditLogger);

      // Fill internal queue to MAX_QUEUE_DEPTH
      const internalQueue = (enforcer as unknown as { queue: unknown[] }).queue;
      for (let i = 0; i < MAX_QUEUE_DEPTH; i++) {
        internalQueue.push({
          request: makeRequest(`fill-${i}`),
          resolve: () => {},
          reject: () => {},
        });
      }

      try {
        await enforcer.enqueue(makeRequest('overflow'));
      } catch {
        // expected
      }

      expect(auditLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          Action: AuditAction.BackpressureRejected,
          EntityType: EntityType.GraphApi,
          EntityId: 'GraphBatchEnforcer',
        })
      );

      enforcer.dispose();
    });

    it('no audit log when auditLogger is not provided', async () => {
      const batchService = createMockBatchService();
      // No auditLogger parameter
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      const p1 = enforcer.enqueue(makeRequest('1'));
      const p2 = enforcer.enqueue(makeRequest('2'));
      const p3 = enforcer.enqueue(makeRequest('3'));

      // Should resolve without errors even without auditLogger
      const results = await Promise.all([p1, p2, p3]);
      expect(results).toHaveLength(3);
    });
  });

  // ── getPendingCount Precision ──

  describe('getPendingCount precision', () => {
    it('returns 0 when newly constructed', () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);
      expect(enforcer.getPendingCount()).toBe(0);
      enforcer.dispose();
    });

    it('returns exact count after sequential enqueues', () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      const pa = enforcer.enqueue(makeRequest('a'));
      pa.catch(() => { /* disposed below */ });
      expect(enforcer.getPendingCount()).toBe(1);

      const pb = enforcer.enqueue(makeRequest('b'));
      pb.catch(() => { /* disposed below */ });
      expect(enforcer.getPendingCount()).toBe(2);

      enforcer.dispose();
    });

    it('returns 0 immediately after threshold flush', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      const p1 = enforcer.enqueue(makeRequest('1'));
      const p2 = enforcer.enqueue(makeRequest('2'));
      const p3 = enforcer.enqueue(makeRequest('3'));
      await Promise.all([p1, p2, p3]);

      expect(enforcer.getPendingCount()).toBe(0);
    });
  });

  // ── flush() Idempotency ──

  describe('flush() idempotency', () => {
    it('calling flush() on empty queue does not call executeBatch', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      await enforcer.flush();
      await enforcer.flush();
      await enforcer.flush();

      expect(batchService.executeBatch).not.toHaveBeenCalled();
    });

    it('manual flush() clears queue and resolves deferred promises', async () => {
      const batchService = createMockBatchService();
      const enforcer = new GraphBatchEnforcer(batchService, () => true);

      const p1 = enforcer.enqueue(makeRequest('1'));
      const p2 = enforcer.enqueue(makeRequest('2'));
      expect(enforcer.getPendingCount()).toBe(2);

      await enforcer.flush();

      expect(enforcer.getPendingCount()).toBe(0);
      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
    });
  });
});
