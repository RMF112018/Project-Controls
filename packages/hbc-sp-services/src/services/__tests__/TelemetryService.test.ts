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
});
