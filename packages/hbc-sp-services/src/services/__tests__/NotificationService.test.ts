import { NotificationService } from '../NotificationService';
import { IDataService } from '../IDataService';
import { NotificationEvent, NotificationType } from '../../models/enums';

function createMockDataService(): Partial<IDataService> {
  return {
    sendNotification: jest.fn().mockResolvedValue({
      id: 1,
      subject: 'Test',
      body: 'Body',
      recipients: [],
      status: 'sent',
    }),
    getRoles: jest.fn().mockResolvedValue([
      { id: 1, Title: 'BD Representative', UserOrGroup: 'bd@test.com', IsActive: true },
      { id: 2, Title: 'Executive Leadership', UserOrGroup: 'exec@test.com', IsActive: true },
      { id: 3, Title: 'Estimating Coordinator', UserOrGroup: 'ec@test.com', IsActive: true },
      { id: 4, Title: 'Department Director', UserOrGroup: 'dir@test.com', IsActive: true },
      { id: 5, Title: 'Operations Team', UserOrGroup: 'ops@test.com', IsActive: true },
      { id: 6, Title: 'Preconstruction Team', UserOrGroup: 'precon@test.com', IsActive: true },
      { id: 7, Title: 'Risk Management', UserOrGroup: 'risk@test.com', IsActive: true },
    ]),
  };
}

describe('NotificationService', () => {
  let service: NotificationService;
  let mockDs: Partial<IDataService>;

  beforeEach(() => {
    mockDs = createMockDataService();
    service = new NotificationService(mockDs as IDataService);
  });

  it('notify calls dataService.sendNotification', async () => {
    await service.notify(
      NotificationEvent.LeadSubmitted,
      { leadTitle: 'Test Lead', leadId: 1 },
      'user@test.com'
    );
    expect(mockDs.sendNotification).toHaveBeenCalled();
  });

  it('handles LeadSubmitted event type', async () => {
    const result = await service.notify(
      NotificationEvent.LeadSubmitted,
      { leadTitle: 'New Lead', leadId: 1 },
      'bd@test.com'
    );
    expect(result).toBeDefined();
    const call = (mockDs.sendNotification as jest.Mock).mock.calls[0][0];
    expect(call.subject).toContain('Lead');
  });

  it('handles GoNoGoDecisionMade event type', async () => {
    await service.notify(
      NotificationEvent.GoNoGoDecisionMade,
      { leadTitle: 'Decision Lead', decision: 'Go', score: 75 },
      'exec@test.com'
    );
    expect(mockDs.sendNotification).toHaveBeenCalled();
    const call = (mockDs.sendNotification as jest.Mock).mock.calls[0][0];
    expect(call.subject).toContain('Go/No-Go');
  });

  it('handles SiteProvisioned event type', async () => {
    await service.notify(
      NotificationEvent.SiteProvisioned,
      { projectCode: '25-042-01', siteUrl: 'https://example.com' },
      'admin@test.com'
    );
    expect(mockDs.sendNotification).toHaveBeenCalled();
  });

  it('constructs correct recipient list per event type', async () => {
    await service.notify(
      NotificationEvent.LeadSubmitted,
      { leadTitle: 'Test Lead', leadId: 1 },
      'user@test.com'
    );
    const call = (mockDs.sendNotification as jest.Mock).mock.calls[0][0];
    expect(call.recipients).toBeDefined();
    expect(Array.isArray(call.recipients)).toBe(true);
    expect(call.recipients.length).toBeGreaterThan(0);
  });

  it('errors from sendNotification propagate to caller', async () => {
    (mockDs.sendNotification as jest.Mock).mockRejectedValue(new Error('Network error'));

    // notify() does not catch errors — callers wrap it in fire-and-forget
    await expect(
      service.notify(
        NotificationEvent.LeadSubmitted,
        { leadTitle: 'Test Lead' },
        'user@test.com'
      )
    ).rejects.toThrow('Network error');
  });

  it('handles CommitmentWaiverRequired event', async () => {
    await service.notify(
      NotificationEvent.CommitmentWaiverRequired,
      {
        projectCode: '25-042-01',
        divisionDescription: 'Concrete',
        contractValue: 500000,
        waiverType: 'SDI',
      },
      'ops@test.com'
    );
    expect(mockDs.sendNotification).toHaveBeenCalled();
  });

  it('handles ScorecardApprovedGo event', async () => {
    await service.notify(
      NotificationEvent.ScorecardApprovedGo,
      {
        leadTitle: 'Go Project',
        leadId: 1,
        committeeTotal: 75,
      },
      'exec@test.com'
    );
    expect(mockDs.sendNotification).toHaveBeenCalled();
  });

  it('caches role lookups after first call', async () => {
    await service.notify(
      NotificationEvent.LeadSubmitted,
      { leadTitle: 'Lead 1' },
      'user@test.com'
    );
    await service.notify(
      NotificationEvent.LeadSubmitted,
      { leadTitle: 'Lead 2' },
      'user@test.com'
    );
    // getRoles should only be called once (lazy cached)
    expect(mockDs.getRoles).toHaveBeenCalledTimes(1);
  });
});
