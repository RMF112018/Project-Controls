/**
 * ConnectorResilienceE2E.test.ts — Phase 5A.1 Connector Resilience Jest tests.
 *
 * Validates AuditAction enum values, ConnectorRegistry policy enforcement,
 * adapter retry policy correctness, isTransientError helper, and
 * optional GraphBatchEnforcer constructor acceptance.
 */
import { AuditAction } from '../../models/enums';
import { connectorRegistry } from '../ConnectorRegistry';
import { ProcoreAdapter } from '../ProcoreAdapter';
import { BambooHRAdapter } from '../BambooHRAdapter';
import { isTransientError } from '../IConnectorAdapter';
import type { IConnectorAdapter, IConnectorRetryPolicy } from '../IConnectorAdapter';
import type { GraphBatchEnforcer } from '../GraphBatchEnforcer';

describe('Phase 5A.1: Connector Resilience', () => {
  // ── AuditAction Enum Values ───────────────────────────────────────────────

  describe('AuditAction enum values', () => {
    it('includes RetryAttempt', () => {
      expect(AuditAction.RetryAttempt).toBe('Connector.RetryAttempt');
    });

    it('includes CircuitBreak', () => {
      expect(AuditAction.CircuitBreak).toBe('Connector.CircuitBreak');
    });

    it('includes BatchFallback', () => {
      expect(AuditAction.BatchFallback).toBe('Connector.BatchFallback');
    });
  });

  // ── ConnectorRegistry Policy Enforcement ──────────────────────────────────

  describe('ConnectorRegistry policy enforcement', () => {
    beforeEach(() => {
      connectorRegistry.clear();
    });

    it('rejects adapter without retryPolicy', () => {
      const badFactory = () => ({
        connectorType: 'TestBad' as const,
        retryPolicy: undefined as unknown as IConnectorRetryPolicy,
        testConnection: jest.fn(),
        sync: jest.fn(),
        getStatus: jest.fn(),
        mapToInternal: jest.fn(),
        mapToExternal: jest.fn(),
      }) as unknown as IConnectorAdapter;

      expect(() =>
        connectorRegistry.register('TestBad' as never, badFactory),
      ).toThrow('must provide a valid IConnectorRetryPolicy');
    });

    it('rejects adapter with negative maxRetries', () => {
      const badFactory = () => ({
        connectorType: 'TestNeg' as const,
        retryPolicy: {
          retryableStatuses: [500],
          maxRetries: -1,
          baseDelayMs: 1000,
          maxDelayMs: 5000,
        },
        testConnection: jest.fn(),
        sync: jest.fn(),
        getStatus: jest.fn(),
        mapToInternal: jest.fn(),
        mapToExternal: jest.fn(),
      }) as unknown as IConnectorAdapter;

      expect(() =>
        connectorRegistry.register('TestNeg' as never, badFactory),
      ).toThrow('must provide a valid IConnectorRetryPolicy');
    });

    it('accepts adapter with valid retryPolicy', () => {
      const goodFactory = () => new ProcoreAdapter();
      expect(() =>
        connectorRegistry.register('Procore', goodFactory),
      ).not.toThrow();
      expect(connectorRegistry.has('Procore')).toBe(true);
    });
  });

  // ── Adapter Retry Policy Values ───────────────────────────────────────────

  describe('ProcoreAdapter retryPolicy', () => {
    it('has correct retry values (3 retries, 429/5xx)', () => {
      const adapter = new ProcoreAdapter();
      expect(adapter.retryPolicy.maxRetries).toBe(3);
      expect(adapter.retryPolicy.retryableStatuses).toEqual([429, 500, 502, 503, 504]);
      expect(adapter.retryPolicy.baseDelayMs).toBe(1000);
      expect(adapter.retryPolicy.maxDelayMs).toBe(30000);
    });
  });

  describe('BambooHRAdapter retryPolicy', () => {
    it('has correct retry values (2 retries, 5xx only)', () => {
      const adapter = new BambooHRAdapter();
      expect(adapter.retryPolicy.maxRetries).toBe(2);
      expect(adapter.retryPolicy.retryableStatuses).toEqual([500, 502, 503]);
      expect(adapter.retryPolicy.baseDelayMs).toBe(1000);
      expect(adapter.retryPolicy.maxDelayMs).toBe(15000);
    });
  });

  // ── isTransientError Helper ───────────────────────────────────────────────

  describe('isTransientError', () => {
    const policy: IConnectorRetryPolicy = {
      retryableStatuses: [429, 500, 502, 503, 504],
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
    };

    it('returns true for retryable status codes', () => {
      expect(isTransientError(429, policy)).toBe(true);
      expect(isTransientError(500, policy)).toBe(true);
      expect(isTransientError(503, policy)).toBe(true);
    });

    it('returns false for non-retryable status codes', () => {
      expect(isTransientError(200, policy)).toBe(false);
      expect(isTransientError(400, policy)).toBe(false);
      expect(isTransientError(401, policy)).toBe(false);
      expect(isTransientError(403, policy)).toBe(false);
      expect(isTransientError(404, policy)).toBe(false);
    });
  });

  // ── Optional Enforcer Constructor ─────────────────────────────────────────

  describe('Adapter constructor accepts optional enforcer', () => {
    const mockEnforcer = {
      enqueue: jest.fn().mockRejectedValue(new Error('mock')),
      flush: jest.fn(),
      dispose: jest.fn(),
      getPendingCount: jest.fn().mockReturnValue(0),
    } as unknown as GraphBatchEnforcer;

    it('ProcoreAdapter accepts optional enforcer', () => {
      const withEnforcer = new ProcoreAdapter(mockEnforcer);
      expect(withEnforcer.connectorType).toBe('Procore');

      const withoutEnforcer = new ProcoreAdapter();
      expect(withoutEnforcer.connectorType).toBe('Procore');
    });

    it('BambooHRAdapter accepts optional enforcer', () => {
      const withEnforcer = new BambooHRAdapter(mockEnforcer);
      expect(withEnforcer.connectorType).toBe('BambooHR');

      const withoutEnforcer = new BambooHRAdapter();
      expect(withoutEnforcer.connectorType).toBe('BambooHR');
    });
  });
});
