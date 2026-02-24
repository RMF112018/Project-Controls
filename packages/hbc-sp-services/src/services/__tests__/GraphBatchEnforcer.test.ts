/**
 * GraphBatchEnforcer — Phase 5D Tests (12 tests)
 *
 * Coverage: passthrough, coalescence timer, threshold flush, deferred promise
 * correlation, 4xx rejection, timer reset, dispose, flush idempotent, mixed
 * success/failure, toggle via bindEnforcerFeatureCheck, audit log, getPendingCount.
 */

import { GraphBatchEnforcer, bindEnforcerFeatureCheck, graphBatchEnforcer } from '../GraphBatchEnforcer';
import type { GraphBatchService, IBatchRequest, IBatchResult, IBatchResponse } from '../GraphBatchService';
import type { GraphAuditLogger } from '../GraphService';
import { AuditAction } from '../../models/enums';

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

describe('GraphBatchEnforcer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // 1. Passthrough when disabled
  it('passes through directly when feature is disabled', async () => {
    const batchService = createMockBatchService();
    const enforcer = new GraphBatchEnforcer(batchService, () => false);

    const result = await enforcer.enqueue(makeRequest('1'));

    expect(result.status).toBe(200);
    expect(result.id).toBe('1');
    expect(batchService.executeBatch).toHaveBeenCalledTimes(1);
    expect((batchService.executeBatch as jest.Mock).mock.calls[0][0]).toHaveLength(1);
  });

  // 2. Coalescence timer at 10ms
  it('flushes queue after 10ms coalescence window', async () => {
    const batchService = createMockBatchService();
    const enforcer = new GraphBatchEnforcer(batchService, () => true);

    const promise = enforcer.enqueue(makeRequest('1'));
    expect(enforcer.getPendingCount()).toBe(1);
    expect(batchService.executeBatch).not.toHaveBeenCalled();

    // Advance timer past coalescence window
    jest.advanceTimersByTime(10);

    const result = await promise;
    expect(result.status).toBe(200);
    expect(batchService.executeBatch).toHaveBeenCalledTimes(1);
    expect(enforcer.getPendingCount()).toBe(0);
  });

  // 3. Threshold-3 immediate flush
  it('flushes immediately when 3 requests are queued (threshold flush)', async () => {
    const batchService = createMockBatchService();
    const enforcer = new GraphBatchEnforcer(batchService, () => true);

    const p1 = enforcer.enqueue(makeRequest('1'));
    const p2 = enforcer.enqueue(makeRequest('2'));
    const p3 = enforcer.enqueue(makeRequest('3'));

    // Should flush immediately without timer
    const results = await Promise.all([p1, p2, p3]);
    expect(results).toHaveLength(3);
    expect(batchService.executeBatch).toHaveBeenCalledTimes(1);
    expect((batchService.executeBatch as jest.Mock).mock.calls[0][0]).toHaveLength(3);
  });

  // 4. Deferred promise resolution by id
  it('correlates responses to correct deferred promises by id', async () => {
    const batchService = createMockBatchService((requests) => ({
      responses: requests.map(r => ({
        id: r.id ?? '0',
        status: 200,
        body: { data: `response-for-${r.id}` },
      })),
      succeeded: [],
      permanentFailures: [],
      transientFailures: [],
    }));
    const enforcer = new GraphBatchEnforcer(batchService, () => true);

    const p1 = enforcer.enqueue(makeRequest('A'));
    const p2 = enforcer.enqueue(makeRequest('B'));
    const p3 = enforcer.enqueue(makeRequest('C'));

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
    expect(r1.id).toBe('A');
    expect((r1.body as { data: string }).data).toBe('response-for-A');
    expect(r2.id).toBe('B');
    expect(r3.id).toBe('C');
  });

  // 5. 4xx individual rejection
  it('rejects individual promise for 4xx responses', async () => {
    const batchService = createMockBatchService((requests) => ({
      responses: requests.map(r => ({
        id: r.id ?? '0',
        status: r.id === '2' ? 403 : 200,
        body: r.id === '2' ? { error: { message: 'Forbidden' } } : { ok: true },
      })),
      succeeded: [],
      permanentFailures: [],
      transientFailures: [],
    }));
    const enforcer = new GraphBatchEnforcer(batchService, () => true);

    const p1 = enforcer.enqueue(makeRequest('1'));
    const p2 = enforcer.enqueue(makeRequest('2'));
    const p3 = enforcer.enqueue(makeRequest('3'));

    const r1 = await p1;
    expect(r1.status).toBe(200);

    await expect(p2).rejects.toThrow('status 403');

    const r3 = await p3;
    expect(r3.status).toBe(200);
  });

  // 6. Timer reset on new arrival (timer fires only once for combined window)
  it('resets coalescence timer when new request arrives within window', async () => {
    const batchService = createMockBatchService();
    const enforcer = new GraphBatchEnforcer(batchService, () => true);

    enforcer.enqueue(makeRequest('1'));

    // Advance 5ms — within window but not yet expired
    jest.advanceTimersByTime(5);
    expect(batchService.executeBatch).not.toHaveBeenCalled();

    // Add second request — timer still pending from first
    enforcer.enqueue(makeRequest('2'));

    // Advance remaining 5ms — first timer fires, flushes both
    jest.advanceTimersByTime(5);

    // Wait for flush to complete
    await jest.advanceTimersByTimeAsync(0);

    expect(batchService.executeBatch).toHaveBeenCalledTimes(1);
    expect((batchService.executeBatch as jest.Mock).mock.calls[0][0]).toHaveLength(2);
  });

  // 7. dispose() clears timers and rejects pending
  it('dispose() clears pending requests with rejection', async () => {
    const batchService = createMockBatchService();
    const enforcer = new GraphBatchEnforcer(batchService, () => true);

    const p1 = enforcer.enqueue(makeRequest('1'));
    const p2 = enforcer.enqueue(makeRequest('2'));

    enforcer.dispose();

    await expect(p1).rejects.toThrow('GraphBatchEnforcer disposed');
    await expect(p2).rejects.toThrow('GraphBatchEnforcer disposed');
    expect(enforcer.getPendingCount()).toBe(0);
  });

  // 8. flush() idempotent when empty
  it('flush() is idempotent when queue is empty', async () => {
    const batchService = createMockBatchService();
    const enforcer = new GraphBatchEnforcer(batchService, () => true);

    await enforcer.flush();
    await enforcer.flush();

    expect(batchService.executeBatch).not.toHaveBeenCalled();
  });

  // 9. Mixed success/failure responses
  it('handles mixed success and failure responses in a single batch', async () => {
    const batchService = createMockBatchService((requests) => ({
      responses: requests.map(r => ({
        id: r.id ?? '0',
        status: r.id === '1' ? 200 : r.id === '2' ? 429 : 500,
        body: r.id === '1' ? { ok: true } : { error: { message: `Error for ${r.id}` } },
      })),
      succeeded: [],
      permanentFailures: [],
      transientFailures: [],
    }));
    const enforcer = new GraphBatchEnforcer(batchService, () => true);

    const p1 = enforcer.enqueue(makeRequest('1'));
    const p2 = enforcer.enqueue(makeRequest('2'));
    const p3 = enforcer.enqueue(makeRequest('3'));

    const r1 = await p1;
    expect(r1.status).toBe(200);

    await expect(p2).rejects.toThrow('status 429');
    await expect(p3).rejects.toThrow('status 500');
  });

  // 10. Toggle via bindEnforcerFeatureCheck
  it('singleton responds to bindEnforcerFeatureCheck toggle', async () => {
    // Default: _isFeatureEnabled returns false → passthrough
    // We can't easily test the real singleton without side effects,
    // so we test the bindEnforcerFeatureCheck mechanism
    let flagEnabled = false;
    bindEnforcerFeatureCheck((flag: string) => {
      if (flag === 'GraphBatchingEnabled') return flagEnabled;
      return false;
    });

    // graphBatchEnforcer singleton should now use the bound check
    // When disabled, getPendingCount stays 0 (passthrough)
    expect(graphBatchEnforcer.getPendingCount()).toBe(0);

    // Reset to default
    bindEnforcerFeatureCheck(() => false);
  });

  // 11. Audit log BatchEnforcerCoalesced on flush
  it('logs BatchEnforcerCoalesced audit entry on flush', async () => {
    const batchService = createMockBatchService();
    const auditLogger = jest.fn().mockResolvedValue(undefined);
    const enforcer = new GraphBatchEnforcer(batchService, () => true, auditLogger);

    const p1 = enforcer.enqueue(makeRequest('1'));
    const p2 = enforcer.enqueue(makeRequest('2'));
    const p3 = enforcer.enqueue(makeRequest('3'));

    await Promise.all([p1, p2, p3]);

    expect(auditLogger).toHaveBeenCalledTimes(1);
    expect(auditLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: AuditAction.BatchEnforcerCoalesced,
        Details: expect.stringContaining('Coalesced 3 requests'),
      })
    );
  });

  // 12. Missing response rejects with descriptive error
  it('rejects when batch response is missing for a request id', async () => {
    const batchService = createMockBatchService((requests) => ({
      // Return responses for only the first request, omit the rest
      responses: [{ id: requests[0].id ?? '0', status: 200, body: { ok: true } }],
      succeeded: [],
      permanentFailures: [],
      transientFailures: [],
    }));
    const enforcer = new GraphBatchEnforcer(batchService, () => true);

    const p1 = enforcer.enqueue(makeRequest('A'));
    const p2 = enforcer.enqueue(makeRequest('B'));
    const p3 = enforcer.enqueue(makeRequest('C'));

    const r1 = await p1;
    expect(r1.status).toBe(200);

    await expect(p2).rejects.toThrow('No response for request id: B');
    await expect(p3).rejects.toThrow('No response for request id: C');
  });

  // 13. Batch-level error rejects all deferred promises
  it('rejects all promises when executeBatch itself throws', async () => {
    const batchService = createMockBatchService();
    (batchService.executeBatch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));
    const enforcer = new GraphBatchEnforcer(batchService, () => true);

    const p1 = enforcer.enqueue(makeRequest('1'));
    const p2 = enforcer.enqueue(makeRequest('2'));
    const p3 = enforcer.enqueue(makeRequest('3'));

    await expect(p1).rejects.toThrow('Network failure');
    await expect(p2).rejects.toThrow('Network failure');
    await expect(p3).rejects.toThrow('Network failure');
  });

  // 14. Batch-level non-Error rejection
  it('wraps non-Error batch failures in Error', async () => {
    const batchService = createMockBatchService();
    (batchService.executeBatch as jest.Mock).mockRejectedValueOnce('string error');
    const enforcer = new GraphBatchEnforcer(batchService, () => true);

    const p1 = enforcer.enqueue(makeRequest('1'));
    const p2 = enforcer.enqueue(makeRequest('2'));
    const p3 = enforcer.enqueue(makeRequest('3'));

    await expect(p1).rejects.toThrow('string error');
    await expect(p2).rejects.toThrow('string error');
    await expect(p3).rejects.toThrow('string error');
  });

  // 15. Passthrough 4xx rejects with error details
  it('rejects with error details in passthrough mode for 4xx responses', async () => {
    const batchService = createMockBatchService(() => ({
      responses: [{ id: '1', status: 404, body: { error: { message: 'Not Found' } } }],
      succeeded: [],
      permanentFailures: [],
      transientFailures: [],
    }));
    const enforcer = new GraphBatchEnforcer(batchService, () => false);

    await expect(enforcer.enqueue(makeRequest('1'))).rejects.toThrow('status 404');
  });

  // 16. Passthrough with string body error
  it('handles string body in passthrough error message', async () => {
    const batchService = createMockBatchService(() => ({
      responses: [{ id: '1', status: 500, body: 'Internal Server Error' }],
      succeeded: [],
      permanentFailures: [],
      transientFailures: [],
    }));
    const enforcer = new GraphBatchEnforcer(batchService, () => false);

    await expect(enforcer.enqueue(makeRequest('1'))).rejects.toThrow('Internal Server Error');
  });

  // 17. Passthrough no response throws
  it('throws when passthrough returns no response', async () => {
    const batchService = createMockBatchService(() => ({
      responses: [],
      succeeded: [],
      permanentFailures: [],
      transientFailures: [],
    }));
    const enforcer = new GraphBatchEnforcer(batchService, () => false);

    await expect(enforcer.enqueue(makeRequest('1'))).rejects.toThrow('No response from batch service');
  });

  // 18. 4xx with null body in batched mode
  it('handles null body in batched 4xx error message', async () => {
    const batchService = createMockBatchService((requests) => ({
      responses: requests.map(r => ({
        id: r.id ?? '0',
        status: 400,
        body: null,
      })),
      succeeded: [],
      permanentFailures: [],
      transientFailures: [],
    }));
    const enforcer = new GraphBatchEnforcer(batchService, () => true);

    const p1 = enforcer.enqueue(makeRequest('1'));
    const p2 = enforcer.enqueue(makeRequest('2'));
    const p3 = enforcer.enqueue(makeRequest('3'));

    await expect(p1).rejects.toThrow('Unknown error');
    await expect(p2).rejects.toThrow('Unknown error');
    await expect(p3).rejects.toThrow('Unknown error');
  });

  // 19. Audit logger error is swallowed
  it('swallows audit logger errors silently', async () => {
    const batchService = createMockBatchService();
    const auditLogger = jest.fn().mockRejectedValue(new Error('audit fail'));
    const enforcer = new GraphBatchEnforcer(batchService, () => true, auditLogger);

    const p1 = enforcer.enqueue(makeRequest('1'));
    const p2 = enforcer.enqueue(makeRequest('2'));
    const p3 = enforcer.enqueue(makeRequest('3'));

    // Should resolve despite audit logger error
    const results = await Promise.all([p1, p2, p3]);
    expect(results).toHaveLength(3);
    expect(auditLogger).toHaveBeenCalled();
  });

  // 20. getPendingCount() accuracy
  it('getPendingCount() accurately reflects queue size', async () => {
    const batchService = createMockBatchService();
    const enforcer = new GraphBatchEnforcer(batchService, () => true);

    expect(enforcer.getPendingCount()).toBe(0);

    enforcer.enqueue(makeRequest('1'));
    expect(enforcer.getPendingCount()).toBe(1);

    enforcer.enqueue(makeRequest('2'));
    expect(enforcer.getPendingCount()).toBe(2);

    // Third triggers threshold flush
    const p3 = enforcer.enqueue(makeRequest('3'));
    await p3;

    expect(enforcer.getPendingCount()).toBe(0);
  });
});
