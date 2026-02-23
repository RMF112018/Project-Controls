/**
 * GraphBatchService — JSON batch wrapper for MSGraphClientV3 (Phase 5A).
 * Chunks requests at MAX_BATCH_SIZE=20 (Graph API hard limit).
 * Correlates responses by deterministic sequential ID.
 * Error classification: transient (429/5xx) vs permanent (400/401/403).
 */
import type { GraphAuditLogger } from './GraphService';
import { AuditAction, EntityType } from '../models/enums';

/** Maximum requests per $batch call — Graph API hard limit */
const MAX_BATCH_SIZE = 20;

export interface IBatchRequest {
  /** Unique ID within the batch (auto-assigned if not provided) */
  id?: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Relative URL (e.g., '/groups/{id}/members/$ref') */
  url: string;
  /** Request body for POST/PATCH */
  body?: unknown;
  /** Additional headers */
  headers?: Record<string, string>;
}

export interface IBatchResponse {
  id: string;
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface IBatchResult {
  responses: IBatchResponse[];
  /** Responses that succeeded (2xx) */
  succeeded: IBatchResponse[];
  /** Responses that failed permanently (4xx except 429) */
  permanentFailures: IBatchResponse[];
  /** Responses that failed transiently (429, 5xx) — candidates for retry */
  transientFailures: IBatchResponse[];
}

export class GraphBatchService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private graphClient: any;
  private auditLogger: GraphAuditLogger | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialize(graphClient: any): void {
    this.graphClient = graphClient;
  }

  setAuditLogger(logger: GraphAuditLogger): void {
    this.auditLogger = logger;
  }

  /**
   * Execute a batch of Graph API requests.
   * Auto-chunks when requests > MAX_BATCH_SIZE.
   * Returns aggregated results across all chunks.
   */
  async executeBatch(requests: IBatchRequest[]): Promise<IBatchResult> {
    if (!this.graphClient) throw new Error('Graph client not initialized');
    if (requests.length === 0) {
      return { responses: [], succeeded: [], permanentFailures: [], transientFailures: [] };
    }

    // Assign sequential IDs
    const numbered = requests.map((req, i) => ({
      ...req,
      id: req.id ?? String(i + 1),
    }));

    // Chunk into groups of MAX_BATCH_SIZE
    const chunks: typeof numbered[] = [];
    for (let i = 0; i < numbered.length; i += MAX_BATCH_SIZE) {
      chunks.push(numbered.slice(i, i + MAX_BATCH_SIZE));
    }

    const allResponses: IBatchResponse[] = [];

    for (const chunk of chunks) {
      const batchBody = {
        requests: chunk.map(req => ({
          id: req.id,
          method: req.method,
          url: req.url,
          ...(req.body ? { body: req.body } : {}),
          headers: {
            'Content-Type': 'application/json',
            ...req.headers,
          },
        })),
      };

      try {
        const result = await this.graphClient.api('/$batch').post(batchBody);
        const responses: IBatchResponse[] = (result.responses || []).map(
          (r: { id: string; status: number; headers?: Record<string, string>; body?: unknown }) => ({
            id: r.id,
            status: r.status,
            headers: r.headers,
            body: r.body,
          })
        );
        allResponses.push(...responses);
      } catch (err) {
        // Batch call itself failed — mark all chunk requests as transient failures
        this.logBatchCall(
          AuditAction.GraphApiCallFailed,
          `POST /$batch (${chunk.length} requests)`,
          `Batch call failed: ${err instanceof Error ? err.message : String(err)}`
        );
        for (const req of chunk) {
          allResponses.push({
            id: req.id!,
            status: 503,
            body: { error: { message: err instanceof Error ? err.message : String(err) } },
          });
        }
      }
    }

    // Classify responses
    const succeeded = allResponses.filter(r => r.status >= 200 && r.status < 300);
    const permanentFailures = allResponses.filter(r =>
      r.status >= 400 && r.status < 500 && r.status !== 429
    );
    const transientFailures = allResponses.filter(r =>
      r.status === 429 || r.status >= 500
    );

    // Audit log summary
    this.logBatchCall(
      succeeded.length === allResponses.length
        ? AuditAction.GraphApiCallSucceeded
        : AuditAction.GraphApiCallFailed,
      `POST /$batch (${requests.length} requests, ${chunks.length} chunk(s))`,
      `Succeeded: ${succeeded.length}, Permanent failures: ${permanentFailures.length}, Transient failures: ${transientFailures.length}`
    );

    return { responses: allResponses, succeeded, permanentFailures, transientFailures };
  }

  /** Fire-and-forget audit log for batch operations */
  private logBatchCall(action: AuditAction, endpoint: string, details: string): void {
    if (!this.auditLogger) return;
    this.auditLogger({
      Action: action,
      EntityType: EntityType.GraphApi,
      EntityId: endpoint,
      User: 'system',
      Details: details,
    }).catch(() => { /* audit is non-blocking */ });
  }
}

export const graphBatchService = new GraphBatchService();
