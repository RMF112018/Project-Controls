import { AuditService } from '../AuditService';
import { AuditAction, EntityType } from '../../models/enums';

describe('AuditService', () => {
  let service: AuditService;
  let mockLogFn: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new AuditService();
    mockLogFn = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initialize sets the log function', () => {
    service.initialize(mockLogFn);
    service.log(AuditAction.LeadCreated, EntityType.Lead, '1', 'Test');
    jest.advanceTimersByTime(2000);
    expect(mockLogFn).toHaveBeenCalled();
  });

  it('log queues entries (does not flush immediately)', () => {
    service.initialize(mockLogFn);
    service.log(AuditAction.LeadCreated, EntityType.Lead, '1', 'Test');
    expect(mockLogFn).not.toHaveBeenCalled();
  });

  it('log debounces flush to 2 seconds', async () => {
    service.initialize(mockLogFn);
    service.log(AuditAction.LeadCreated, EntityType.Lead, '1', 'Test 1');

    // Advance 1 second — not yet flushed
    await jest.advanceTimersByTimeAsync(1000);
    expect(mockLogFn).not.toHaveBeenCalled();

    // Add another log at 1s — resets the timer
    service.log(AuditAction.LeadEdited, EntityType.Lead, '1', 'Test 2');

    // Advance 1 second from second log — still not flushed (only 1s since last log)
    await jest.advanceTimersByTimeAsync(1000);
    expect(mockLogFn).not.toHaveBeenCalled();

    // Advance another 1 second — now 2s since last log, should flush both entries
    await jest.advanceTimersByTimeAsync(1000);
    expect(mockLogFn).toHaveBeenCalledTimes(2);
  });

  it('flushNow sends all queued entries immediately', async () => {
    service.initialize(mockLogFn);
    service.log(AuditAction.LeadCreated, EntityType.Lead, '1', 'Entry 1');
    service.log(AuditAction.LeadEdited, EntityType.Lead, '2', 'Entry 2');

    await service.flushNow();
    expect(mockLogFn).toHaveBeenCalledTimes(2);
  });

  it('flushNow clears the debounce timer', async () => {
    service.initialize(mockLogFn);
    service.log(AuditAction.LeadCreated, EntityType.Lead, '1', 'Test');

    await service.flushNow();
    expect(mockLogFn).toHaveBeenCalledTimes(1);

    // Advance past debounce — should not flush again since flushNow cleared the timer
    jest.advanceTimersByTime(3000);
    expect(mockLogFn).toHaveBeenCalledTimes(1);
  });

  it('flush calls logFn for each queued entry', async () => {
    service.initialize(mockLogFn);
    service.log(AuditAction.LeadCreated, EntityType.Lead, '1', 'A');
    service.log(AuditAction.LeadEdited, EntityType.Lead, '2', 'B');
    service.log(AuditAction.GoNoGoScoreSubmitted, EntityType.Scorecard, '3', 'C');

    await service.flushNow();
    expect(mockLogFn).toHaveBeenCalledTimes(3);
  });

  it('flush clears queue after sending', async () => {
    service.initialize(mockLogFn);
    service.log(AuditAction.LeadCreated, EntityType.Lead, '1', 'Test');

    await service.flushNow();
    expect(mockLogFn).toHaveBeenCalledTimes(1);

    // Flush again — nothing to send
    await service.flushNow();
    expect(mockLogFn).toHaveBeenCalledTimes(1);
  });

  it('flush handles logFn errors gracefully', async () => {
    const errorFn = jest.fn().mockRejectedValue(new Error('Network error'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    service.initialize(errorFn);
    service.log(AuditAction.LeadCreated, EntityType.Lead, '1', 'Test');

    // Should not throw
    await service.flushNow();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AuditService]'),
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });

  it('log without initialize does not throw', () => {
    // No initialize called
    expect(() => {
      service.log(AuditAction.LeadCreated, EntityType.Lead, '1', 'Test');
    }).not.toThrow();
  });

  it('flushNow with empty queue is no-op', async () => {
    service.initialize(mockLogFn);
    await service.flushNow();
    expect(mockLogFn).not.toHaveBeenCalled();
  });

  it('entry includes correct fields', async () => {
    service.initialize(mockLogFn);
    service.log(
      AuditAction.LeadCreated,
      EntityType.Lead,
      '42',
      'Created new lead',
      { projectCode: '25-042-01', fieldChanged: 'Title' }
    );

    await service.flushNow();
    const entry = mockLogFn.mock.calls[0][0];
    expect(entry.Action).toBe(AuditAction.LeadCreated);
    expect(entry.EntityType).toBe(EntityType.Lead);
    expect(entry.EntityId).toBe('42');
    expect(entry.Details).toBe('Created new lead');
    expect(entry.ProjectCode).toBe('25-042-01');
    expect(entry.FieldChanged).toBe('Title');
    expect(entry.Timestamp).toBeDefined();
    expect(typeof entry.Timestamp).toBe('string');
  });

  it('flush without initialize is no-op', async () => {
    service.log(AuditAction.LeadCreated, EntityType.Lead, '1', 'Test');
    await service.flushNow();
    // No error — just nothing happens since logFn is null
  });
});
