/**
 * TelemetryService.test.ts — unit tests for telemetry service layer
 *
 * Tests the MockTelemetryService fully and the TelemetryService guard behaviour
 * (no-ops before init, idempotency).
 */
import { MockTelemetryService } from '../MockTelemetryService';
import { TelemetryService } from '../TelemetryService';

// ---------------------------------------------------------------------------
// MockTelemetryService
// ---------------------------------------------------------------------------
describe('MockTelemetryService', () => {
  let svc: MockTelemetryService;

  beforeEach(() => {
    svc = new MockTelemetryService();
  });

  it('starts uninitialized', () => {
    expect(svc.isInitialized()).toBe(false);
  });

  it('becomes initialized after initialize()', () => {
    svc.initialize('', 'user123', 'Dev');
    expect(svc.isInitialized()).toBe(true);
  });

  it('initialize() is idempotent — second call is a no-op', () => {
    svc.initialize('', 'user1', 'Dev');
    svc.initialize('', 'user2', 'Prod'); // should not re-initialize
    expect(svc.isInitialized()).toBe(true);
  });

  it('trackEvent() stores events in memory', () => {
    svc.initialize('', 'u', 'Dev');
    svc.trackEvent({ name: 'Audit.Lead.Created', properties: { projectCode: 'HBC-001' } });
    svc.trackEvent({ name: 'Audit.GoNoGo.DecisionMade', properties: { decision: 'Go' } });
    expect(svc.getEvents()).toHaveLength(2);
    expect(svc.getEvents()[0].name).toBe('Audit.Lead.Created');
  });

  it('trackEvent() before init still stores the event (graceful)', () => {
    // MockTelemetryService does not guard — it always stores; test confirms no throw
    expect(() => {
      svc.trackEvent({ name: 'test.event' });
    }).not.toThrow();
  });

  it('clearEvents() empties the in-memory store', () => {
    svc.initialize('', 'u', 'Dev');
    svc.trackEvent({ name: 'ev1' });
    svc.clearEvents();
    expect(svc.getEvents()).toHaveLength(0);
  });

  it('trackMetric() does not throw', () => {
    svc.initialize('', 'u', 'Dev');
    expect(() => svc.trackMetric('webpart.LoadMs', 1234)).not.toThrow();
  });

  it('trackException() does not throw', () => {
    svc.initialize('', 'u', 'Dev');
    expect(() => svc.trackException(new Error('oops'))).not.toThrow();
  });

  it('trackPageView() does not throw', () => {
    svc.initialize('', 'u', 'Dev');
    expect(() => svc.trackPageView('/admin/telemetry')).not.toThrow();
  });

  it('flush() does not throw', () => {
    expect(() => svc.flush()).not.toThrow();
  });

  it('getEvents() returns a copy, not the internal array', () => {
    svc.initialize('', 'u', 'Dev');
    svc.trackEvent({ name: 'ev1' });
    const copy = svc.getEvents();
    copy.push({ name: 'injected' }); // mutate the copy
    expect(svc.getEvents()).toHaveLength(1); // original unaffected
  });

  it('injects correlation IDs into recent telemetry items', () => {
    svc.initialize('', 'u', 'Dev');
    svc.trackEvent({ name: 'corr:event:test' });
    const items = svc.getRecentTelemetryItems(1);
    expect(items[0]?.properties?.corr_session_id).toBeTruthy();
    expect(items[0]?.properties?.corr_operation_id).toBeTruthy();
  });

  it('applies retention window pruning for recent telemetry items', () => {
    svc.initialize('', 'u', 'Dev');
    svc.trackEvent({ name: 'retention:event:test' });
    svc.setRetentionDays(1);
    const payload = svc.getMonitoringExportPayload({
      fromDate: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString(),
      toDate: new Date().toISOString(),
    });
    expect(payload.metadata.retentionDays).toBe(1);
    expect(payload.metadata.rowCount).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// TelemetryService — guard behaviour (no App Insights SDK in node env)
// ---------------------------------------------------------------------------
describe('TelemetryService', () => {
  let svc: TelemetryService;

  beforeEach(() => {
    svc = new TelemetryService();
  });

  it('starts uninitialized', () => {
    expect(svc.isInitialized()).toBe(false);
  });

  it('trackEvent() before initialize() is a no-op (no throw)', () => {
    expect(() => svc.trackEvent({ name: 'test' })).not.toThrow();
  });

  it('trackMetric() before initialize() is a no-op (no throw)', () => {
    expect(() => svc.trackMetric('load', 500)).not.toThrow();
  });

  it('trackException() before initialize() is a no-op (no throw)', () => {
    expect(() => svc.trackException(new Error('boom'))).not.toThrow();
  });

  it('trackPageView() before initialize() is a no-op (no throw)', () => {
    expect(() => svc.trackPageView('/dashboard')).not.toThrow();
  });

  it('flush() before initialize() is a no-op (no throw)', () => {
    expect(() => svc.flush()).not.toThrow();
  });

  it('initialize() marks service as initialized immediately', () => {
    // The dynamic import will be pending in node env but _initialized is set synchronously
    svc.initialize('InstrumentationKey=00000000-0000-0000-0000-000000000000;...', 'abc123', 'Dev');
    expect(svc.isInitialized()).toBe(true);
  });

  it('second initialize() call is a no-op (idempotent)', () => {
    svc.initialize('conn1', 'user1', 'RoleA');
    svc.initialize('conn2', 'user2', 'RoleB'); // should be no-op
    // Still initialized — just can't verify connection string (private)
    expect(svc.isInitialized()).toBe(true);
  });

  it('exposes sampling rules and deterministic IDs', () => {
    const defaultRules = svc.getSamplingRules();
    expect(defaultRules.length).toBeGreaterThan(0);

    svc.setSamplingRules([{ namePattern: 'deterministic:test', sampleRate: 1 }]);
    expect(svc.getSamplingRules()).toHaveLength(1);

    const op1 = svc.newOperationId('test-scope');
    const op2 = svc.newOperationId('test-scope');
    expect(op1).not.toEqual(op2);
    expect(svc.getSessionCorrelationId()).toContain('sess-');
  });

  it('injects correlation fields into tracked items', () => {
    svc.trackEvent({ name: 'corr:test' });
    const items = svc.getRecentTelemetryItems();
    const event = items.find((item) => item.name === 'corr:test');
    expect(event?.properties?.corr_session_id).toBeTruthy();
    expect(event?.properties?.corr_operation_id).toBeTruthy();
  });

  it('drops sampled events when sample rate is 0', () => {
    svc.setSamplingRules([{ namePattern: 'drop:event', sampleRate: 0 }]);
    svc.trackEvent({ name: 'drop:event' });
    const items = svc.getRecentTelemetryItems();
    expect(items.some((item) => item.name === 'drop:event')).toBe(false);
  });

  it('builds monitoring export payload with expected schema', () => {
    svc.setSamplingRules([{ namePattern: 'monitoring:event', sampleRate: 1 }]);
    svc.trackEvent({
      name: 'monitoring:event',
      properties: { route: '/admin/telemetry', role: 'Leadership' },
      measurements: { durationMs: 123 },
    });
    const payload = svc.getMonitoringExportPayload();
    expect(payload.metadata.rowCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(payload.rows)).toBe(true);
    expect(Array.isArray(payload.aggregates.byName)).toBe(true);
    expect(payload.rows[0]).toHaveProperty('corr_session_id');
    expect(payload.rows[0]).toHaveProperty('corr_operation_id');
  });
});
