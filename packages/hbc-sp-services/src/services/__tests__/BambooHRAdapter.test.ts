import { BambooHRAdapter } from '../BambooHRAdapter';
import { isTransientError } from '../IConnectorAdapter';

describe('BambooHRAdapter', () => {
  let adapter: BambooHRAdapter;

  beforeEach(() => {
    adapter = new BambooHRAdapter();
  });

  it('connectorType is BambooHR', () => {
    expect(adapter.connectorType).toBe('BambooHR');
  });

  describe('retryPolicy', () => {
    it('has correct retryable statuses', () => {
      expect(adapter.retryPolicy.retryableStatuses).toContain(500);
      expect(adapter.retryPolicy.retryableStatuses).toContain(502);
      expect(adapter.retryPolicy.retryableStatuses).toContain(503);
    });

    it('does NOT include 429', () => {
      expect(adapter.retryPolicy.retryableStatuses).not.toContain(429);
    });

    it('maxRetries is 2', () => {
      expect(adapter.retryPolicy.maxRetries).toBe(2);
    });

    it('maxDelayMs is 15000', () => {
      expect(adapter.retryPolicy.maxDelayMs).toBe(15000);
    });
  });

  describe('testConnection', () => {
    it('succeeds', async () => {
      const result = await adapter.testConnection({});
      expect(result.success).toBe(true);
    });
  });

  describe('sync', () => {
    it('Inbound returns records', async () => {
      const result = await adapter.sync({}, 'Inbound');
      expect(result.recordsSynced).toBe(25);
      expect(result.errors).toBe(0);
    });

    it('Outbound returns error', async () => {
      const result = await adapter.sync({}, 'Outbound');
      expect(result.errors).toBe(1);
      expect(result.errorDetails).toContain('inbound-only');
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
      const data = { id: 1, name: 'Test Employee' };
      expect(adapter.mapToInternal(data)).toBe(data);
    });
  });

  describe('mapToExternal', () => {
    it('throws for inbound-only', () => {
      expect(() => adapter.mapToExternal({ id: 1 })).toThrow('inbound-only');
    });
  });

  describe('isTransientError with BambooHR retryPolicy', () => {
    it('500 is transient', () => {
      expect(isTransientError(500, adapter.retryPolicy)).toBe(true);
    });

    it('429 is NOT transient for BambooHR', () => {
      expect(isTransientError(429, adapter.retryPolicy)).toBe(false);
    });
  });
});
