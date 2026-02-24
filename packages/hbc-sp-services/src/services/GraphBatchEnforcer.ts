/**
 * GraphBatchEnforcer — Phase 5D Cross-cutting Governance
 *
 * Composition wrapper around GraphBatchService that auto-coalesces
 * individual Graph API calls into batches.
 *
 * - 10ms coalescence window (setTimeout)
 * - Threshold of 3 for immediate flush
 * - Feature-gated via GraphBatchingEnabled (passthrough when OFF)
 * - Direct constructor-injected isFeatureEnabled callback
 *
 * No setter methods on the class. The isFeatureEnabled callback is a required
 * constructor parameter. The singleton captures a closure that dynamically
 * evaluates the flag at call time.
 */

import type { GraphBatchService, IBatchRequest, IBatchResponse } from './GraphBatchService';
import { graphBatchService } from './GraphBatchService';
import type { GraphAuditLogger } from './GraphService';
import { AuditAction, EntityType } from '../models/enums';

// ── Constants ───────────────────────────────────────────────────────────────

const COALESCENCE_WINDOW_MS = 10;
const FLUSH_THRESHOLD = 3;

// ── Queued Request ──────────────────────────────────────────────────────────

interface IQueuedRequest {
  request: IBatchRequest;
  resolve: (response: IBatchResponse) => void;
  reject: (error: Error) => void;
}

// ── GraphBatchEnforcer Class ────────────────────────────────────────────────

export class GraphBatchEnforcer {
  private queue: IQueuedRequest[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private batchService: GraphBatchService,
    private isFeatureEnabled: () => boolean,
    private auditLogger?: GraphAuditLogger,
  ) {}

  /**
   * Enqueue a Graph API request.
   *
   * When GraphBatchingEnabled is OFF → passthrough (immediate executeBatch with single request).
   * When ON → queue with deferred promise, flush at threshold 3 or after 10ms window.
   */
  enqueue(request: IBatchRequest): Promise<IBatchResponse> {
    // Feature gate: passthrough when disabled (zero-overhead)
    if (!this.isFeatureEnabled()) {
      return this.passthrough(request);
    }

    return new Promise<IBatchResponse>((resolve, reject) => {
      this.queue.push({ request, resolve, reject });

      // Threshold flush: immediate when queue reaches 3
      if (this.queue.length >= FLUSH_THRESHOLD) {
        this.clearTimer();
        this.flush().catch(() => { /* handled per-request */ });
        return;
      }

      // Coalescence timer: flush after 10ms if no more requests arrive
      if (this.timer === null) {
        this.timer = setTimeout(() => {
          this.timer = null;
          this.flush().catch(() => { /* handled per-request */ });
        }, COALESCENCE_WINDOW_MS);
      }
    });
  }

  /**
   * Force-flush the queue. Exposed for test determinism.
   * Idempotent when queue is empty.
   */
  async flush(): Promise<void> {
    this.clearTimer();

    if (this.queue.length === 0) return;

    // Snapshot and clear queue atomically
    const snapshot = [...this.queue];
    this.queue = [];
    const flushStart = Date.now();

    const requests = snapshot.map(q => q.request);

    try {
      const result = await this.batchService.executeBatch(requests);
      const flushDuration = Date.now() - flushStart;

      // Audit log: BatchEnforcerCoalesced
      this.logCoalescence(snapshot.length, flushDuration);

      // Correlate responses by id back to deferred promises
      for (const queued of snapshot) {
        const requestId = queued.request.id;
        const response = result.responses.find(r => r.id === requestId);

        if (!response) {
          queued.reject(new Error(`No response for request id: ${requestId}`));
          continue;
        }

        // Individual rejection for 4xx/5xx
        if (response.status >= 400) {
          queued.reject(new Error(
            `Graph API request ${requestId} failed with status ${response.status}: ${
              typeof response.body === 'object' && response.body !== null
                ? JSON.stringify(response.body)
                : String(response.body ?? 'Unknown error')
            }`
          ));
        } else {
          queued.resolve(response);
        }
      }
    } catch (err) {
      // Batch call itself failed — reject all deferred promises
      for (const queued of snapshot) {
        queued.reject(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  /**
   * Dispose: clear timers, reject all pending requests.
   */
  dispose(): void {
    this.clearTimer();
    const pending = [...this.queue];
    this.queue = [];
    for (const queued of pending) {
      queued.reject(new Error('GraphBatchEnforcer disposed'));
    }
  }

  /**
   * Number of requests currently queued (observability).
   */
  getPendingCount(): number {
    return this.queue.length;
  }

  // ── Private ─────────────────────────────────────────────────────────────

  /** Passthrough: single request directly to executeBatch (feature disabled) */
  private async passthrough(request: IBatchRequest): Promise<IBatchResponse> {
    const result = await this.batchService.executeBatch([request]);
    const response = result.responses[0];
    if (!response) throw new Error('No response from batch service');
    if (response.status >= 400) {
      throw new Error(
        `Graph API request failed with status ${response.status}: ${
          typeof response.body === 'object' && response.body !== null
            ? JSON.stringify(response.body)
            : String(response.body ?? 'Unknown error')
        }`
      );
    }
    return response;
  }

  /** Clear the coalescence timer */
  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** Fire-and-forget audit log for coalescence events */
  private logCoalescence(count: number, durationMs: number): void {
    if (!this.auditLogger) return;
    this.auditLogger({
      Action: AuditAction.BatchEnforcerCoalesced,
      EntityType: EntityType.GraphApi,
      EntityId: 'GraphBatchEnforcer',
      User: 'system',
      Details: `Coalesced ${count} requests in ${durationMs}ms window`,
    }).catch(() => { /* audit is non-blocking */ });
  }
}

// ── Module-level late-binding for feature flag ──────────────────────────────

/**
 * Module-level feature check — resolved lazily at enqueue() time, not at import time.
 * Safe default: () => false (enforcer disabled until real flag accessor is bound).
 */
let _isFeatureEnabled: (flag: string) => boolean = () => false;

/**
 * Called once during app initialization (in GraphService.initialize()) to bind
 * the real feature flag accessor.
 */
export function initializeEnforcerFeatureCheck(fn: (flag: string) => boolean): void {
  _isFeatureEnabled = fn;
}

// ── Singleton ───────────────────────────────────────────────────────────────

/**
 * Default singleton — closure evaluates dynamically on every enqueue() call.
 * When _isFeatureEnabled hasn't been bound yet, defaults to passthrough (safe).
 */
export const graphBatchEnforcer = new GraphBatchEnforcer(
  graphBatchService,
  () => _isFeatureEnabled('GraphBatchingEnabled'),
);
