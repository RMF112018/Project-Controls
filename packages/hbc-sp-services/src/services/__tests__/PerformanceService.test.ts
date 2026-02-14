import { PerformanceService } from '../PerformanceService';

describe('PerformanceService', () => {
  let service: PerformanceService;

  beforeEach(() => {
    service = new PerformanceService();
  });

  it('constructor generates unique sessionId', () => {
    const s1 = new PerformanceService();
    const s2 = new PerformanceService();
    expect(s1.getSessionId()).toBeTruthy();
    expect(s2.getSessionId()).toBeTruthy();
    expect(s1.getSessionId()).not.toBe(s2.getSessionId());
  });

  it('getSessionId returns stable id within instance', () => {
    const id1 = service.getSessionId();
    const id2 = service.getSessionId();
    expect(id1).toBe(id2);
  });

  it('startMark records start time', () => {
    service.startMark('test-mark');
    service.endMark('test-mark');
    const mark = service.getMark('test-mark');
    expect(mark).toBeDefined();
    expect(mark!.startTime).toBeGreaterThanOrEqual(0);
  });

  it('endMark records completed mark with duration', () => {
    service.startMark('test-mark');
    // Small delay via computation
    const _x = Array.from({ length: 1000 }).map((_, i) => i * i);
    service.endMark('test-mark');

    const mark = service.getMark('test-mark');
    expect(mark).toBeDefined();
    expect(mark!.name).toBe('test-mark');
    expect(mark!.duration).toBeGreaterThanOrEqual(0);
    expect(mark!.endTime).toBeGreaterThanOrEqual(mark!.startTime);
  });

  it('endMark is no-op for unknown mark name', () => {
    service.endMark('nonexistent');
    expect(service.getMark('nonexistent')).toBeUndefined();
  });

  it('getMark returns undefined for unknown name', () => {
    expect(service.getMark('nonexistent')).toBeUndefined();
  });

  it('getAllMarks returns copy of completed marks', () => {
    service.startMark('m1');
    service.endMark('m1');
    service.startMark('m2');
    service.endMark('m2');

    const marks = service.getAllMarks();
    expect(marks).toHaveLength(2);
    expect(marks[0].name).toBe('m1');
    expect(marks[1].name).toBe('m2');

    // Verify it's a copy
    marks.push({ name: 'fake', startTime: 0, endTime: 0, duration: 0 });
    expect(service.getAllMarks()).toHaveLength(2);
  });

  it('reset clears all marks and regenerates sessionId', () => {
    const originalId = service.getSessionId();
    service.startMark('m1');
    service.endMark('m1');

    service.reset();

    expect(service.getAllMarks()).toHaveLength(0);
    expect(service.getSessionId()).not.toBe(originalId);
  });

  it('initialize sets logFn', async () => {
    const mockLog = jest.fn().mockResolvedValue({ id: 1 });
    service.initialize(mockLog);

    // Need marks for logWebPartLoad to include
    service.startMark('webpart:onInit');
    service.endMark('webpart:onInit');

    const result = await service.logWebPartLoad({
      userEmail: 'test@example.com',
      siteUrl: 'https://example.com',
      isProjectSite: false,
    });

    expect(mockLog).toHaveBeenCalled();
    expect(result).toEqual({ id: 1 });
  });

  it('logWebPartLoad returns null when not initialized', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const result = await service.logWebPartLoad({
      userEmail: 'test@example.com',
      siteUrl: 'https://example.com',
      isProjectSite: false,
    });
    expect(result).toBeNull();
    warnSpy.mockRestore();
  });

  it('logWebPartLoad calls logFn with assembled entry', async () => {
    const mockLog = jest.fn().mockResolvedValue({ id: 1 });
    service.initialize(mockLog);

    service.startMark('webpart:onInit');
    service.endMark('webpart:onInit');
    service.startMark('app:contextInit');
    service.endMark('app:contextInit');

    await service.logWebPartLoad({
      userEmail: 'test@hedrickbrothers.com',
      siteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/HBCentral',
      projectCode: '25-042-01',
      isProjectSite: true,
    });

    expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({
      SessionId: service.getSessionId(),
      UserEmail: 'test@hedrickbrothers.com',
      SiteUrl: 'https://hedrickbrotherscom.sharepoint.com/sites/HBCentral',
      ProjectCode: '25-042-01',
      IsProjectSite: true,
      Timestamp: expect.any(String),
      TotalLoadMs: expect.any(Number),
      Marks: expect.any(Array),
    }));
  });

  it('logWebPartLoad handles logFn error gracefully', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const errorLog = jest.fn().mockRejectedValue(new Error('DB error'));
    service.initialize(errorLog);

    const result = await service.logWebPartLoad({
      userEmail: 'test@example.com',
      siteUrl: 'https://example.com',
      isProjectSite: false,
    });

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('logWebPartLoad includes WebPartLoadMs and AppInitMs from named marks', async () => {
    const mockLog = jest.fn().mockResolvedValue({ id: 1 });
    service.initialize(mockLog);

    service.startMark('webpart:onInit');
    service.endMark('webpart:onInit');
    service.startMark('app:contextInit');
    service.endMark('app:contextInit');
    service.startMark('app:userFlagsFetch');
    service.endMark('app:userFlagsFetch');

    await service.logWebPartLoad({
      userEmail: 'test@example.com',
      siteUrl: 'https://example.com',
      isProjectSite: false,
    });

    const entry = mockLog.mock.calls[0][0];
    expect(entry.WebPartLoadMs).toBeGreaterThanOrEqual(0);
    expect(entry.AppInitMs).toBeGreaterThanOrEqual(0);
    expect(entry.DataFetchMs).toBeGreaterThanOrEqual(0);
  });
});
