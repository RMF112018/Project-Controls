import { ProcoreAdapter } from '../ProcoreAdapter';
import { isTransientError } from '../IConnectorAdapter';

describe('ProcoreAdapter', () => {
  let adapter: ProcoreAdapter;

  beforeEach(() => {
    adapter = new ProcoreAdapter();
  });

  it('connectorType is Procore', () => {
    expect(adapter.connectorType).toBe('Procore');
  });

  describe('retryPolicy', () => {
    it('has correct retryable statuses', () => {
      expect(adapter.retryPolicy.retryableStatuses).toEqual(
        expect.arrayContaining([429, 500, 502, 503, 504])
      );
      expect(adapter.retryPolicy.retryableStatuses).toHaveLength(5);
    });

    it('maxRetries is 3', () => {
      expect(adapter.retryPolicy.maxRetries).toBe(3);
    });

    it('baseDelayMs is 1000', () => {
      expect(adapter.retryPolicy.baseDelayMs).toBe(1000);
    });

    it('maxDelayMs is 30000', () => {
      expect(adapter.retryPolicy.maxDelayMs).toBe(30000);
    });
  });

  describe('testConnection', () => {
    it('succeeds', async () => {
      const result = await adapter.testConnection({ apiUrl: 'https://app.procore.com' });
      expect(result.success).toBe(true);
    });

    it('includes apiUrl in message', async () => {
      const result = await adapter.testConnection({ apiUrl: 'https://app.procore.com' });
      expect(result.message).toContain('https://app.procore.com');
    });
  });

  describe('sync', () => {
    it('returns records', async () => {
      const result = await adapter.sync({}, 'Inbound');
      expect(result.recordsSynced).toBeGreaterThan(0);
      expect(result.errors).toBe(0);
    });

    it('supports both directions', async () => {
      const inbound = await adapter.sync({}, 'Inbound');
      const outbound = await adapter.sync({}, 'Outbound');
      expect(inbound.recordsSynced).toBeGreaterThan(0);
      expect(outbound.recordsSynced).toBeGreaterThan(0);
    });
  });

  describe('getStatus', () => {
    it('returns Idle', async () => {
      const status = await adapter.getStatus({});
      expect(status.status).toBe('Idle');
    });
  });

  describe('mapToInternal', () => {
    it('is identity', () => {
      const data = { id: 1, name: 'Project Alpha' };
      expect(adapter.mapToInternal(data)).toBe(data);
    });
  });

  describe('mapToExternal', () => {
    it('is identity', () => {
      const data = { id: 2, title: 'Budget Item' };
      expect(adapter.mapToExternal(data)).toBe(data);
    });
  });

  describe('isTransientError', () => {
    it('429 is transient', () => {
      expect(isTransientError(429, adapter.retryPolicy)).toBe(true);
    });

    it('400 is NOT transient', () => {
      expect(isTransientError(400, adapter.retryPolicy)).toBe(false);
    });

    it('503 is transient', () => {
      expect(isTransientError(503, adapter.retryPolicy)).toBe(true);
    });
  });
});
