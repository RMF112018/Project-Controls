import { GraphBatchService, IBatchRequest } from '../GraphBatchService';
import { AuditAction, EntityType } from '../../models/enums';

const createMockGraphClient = (responses: any[] = []) => {
  const postFn = jest.fn().mockResolvedValue({ responses });
  return {
    api: jest.fn().mockReturnValue({ post: postFn }),
    _postFn: postFn,
  };
};

describe('GraphBatchService', () => {
  let service: GraphBatchService;

  beforeEach(() => {
    service = new GraphBatchService();
  });

  it('empty batch returns empty result', async () => {
    const mockClient = createMockGraphClient();
    service.initialize(mockClient);

    const result = await service.executeBatch([]);

    expect(result.responses).toEqual([]);
    expect(result.succeeded).toEqual([]);
    expect(result.permanentFailures).toEqual([]);
    expect(result.transientFailures).toEqual([]);
    // Should not call the graph client at all
    expect(mockClient.api).not.toHaveBeenCalled();
  });

  it('single request succeeds', async () => {
    const mockClient = createMockGraphClient([
      { id: '1', status: 200, body: { value: 'ok' } },
    ]);
    service.initialize(mockClient);

    const requests: IBatchRequest[] = [
      { method: 'GET', url: '/me' },
    ];

    const result = await service.executeBatch(requests);

    expect(result.responses).toHaveLength(1);
    expect(result.succeeded).toHaveLength(1);
    expect(result.permanentFailures).toHaveLength(0);
    expect(result.transientFailures).toHaveLength(0);
    expect(result.succeeded[0].status).toBe(200);
    expect(result.succeeded[0].body).toEqual({ value: 'ok' });
    expect(mockClient.api).toHaveBeenCalledWith('/$batch');
  });

  it('mixed success/failure classifies responses correctly', async () => {
    const mockClient = createMockGraphClient([
      { id: '1', status: 200, body: { value: 'ok' } },
      { id: '2', status: 400, body: { error: { message: 'Bad request' } } },
      { id: '3', status: 503, body: { error: { message: 'Service unavailable' } } },
    ]);
    service.initialize(mockClient);

    const requests: IBatchRequest[] = [
      { method: 'GET', url: '/me' },
      { method: 'POST', url: '/groups', body: { displayName: 'Test' } },
      { method: 'GET', url: '/users' },
    ];

    const result = await service.executeBatch(requests);

    expect(result.responses).toHaveLength(3);
    expect(result.succeeded).toHaveLength(1);
    expect(result.succeeded[0].id).toBe('1');
    expect(result.permanentFailures).toHaveLength(1);
    expect(result.permanentFailures[0].id).toBe('2');
    expect(result.transientFailures).toHaveLength(1);
    expect(result.transientFailures[0].id).toBe('3');
  });

  it('auto-chunks at 20 requests per batch call', async () => {
    // First chunk: 20 requests, second chunk: 5 requests
    const firstChunkResponses = Array.from({ length: 20 }, (_, i) => ({
      id: String(i + 1),
      status: 200,
      body: {},
    }));
    const secondChunkResponses = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 21),
      status: 200,
      body: {},
    }));

    const postFn = jest.fn()
      .mockResolvedValueOnce({ responses: firstChunkResponses })
      .mockResolvedValueOnce({ responses: secondChunkResponses });

    const mockClient = {
      api: jest.fn().mockReturnValue({ post: postFn }),
    };
    service.initialize(mockClient);

    const requests: IBatchRequest[] = Array.from({ length: 25 }, (_, i) => ({
      method: 'GET' as const,
      url: `/users/${i}`,
    }));

    const result = await service.executeBatch(requests);

    expect(mockClient.api).toHaveBeenCalledTimes(2);
    expect(postFn).toHaveBeenCalledTimes(2);
    // First call should have 20 requests
    expect(postFn.mock.calls[0][0].requests).toHaveLength(20);
    // Second call should have 5 requests
    expect(postFn.mock.calls[1][0].requests).toHaveLength(5);
    expect(result.responses).toHaveLength(25);
    expect(result.succeeded).toHaveLength(25);
  });

  it('throws when graph client not initialized', async () => {
    const requests: IBatchRequest[] = [
      { method: 'GET', url: '/me' },
    ];

    await expect(service.executeBatch(requests)).rejects.toThrow(
      'Graph client not initialized'
    );
  });

  it('batch call network failure marks all chunk requests as 503', async () => {
    const postFn = jest.fn().mockRejectedValue(new Error('Network error'));
    const mockClient = {
      api: jest.fn().mockReturnValue({ post: postFn }),
    };
    service.initialize(mockClient);

    const requests: IBatchRequest[] = [
      { method: 'GET', url: '/me' },
      { method: 'GET', url: '/users' },
    ];

    const result = await service.executeBatch(requests);

    expect(result.responses).toHaveLength(2);
    expect(result.transientFailures).toHaveLength(2);
    expect(result.succeeded).toHaveLength(0);
    expect(result.permanentFailures).toHaveLength(0);
    result.responses.forEach(r => {
      expect(r.status).toBe(503);
      expect((r.body as any).error.message).toBe('Network error');
    });
  });

  it('429 classified as transient failure, not permanent', async () => {
    const mockClient = createMockGraphClient([
      { id: '1', status: 429, body: { error: { message: 'Too many requests' } } },
    ]);
    service.initialize(mockClient);

    const requests: IBatchRequest[] = [
      { method: 'GET', url: '/me' },
    ];

    const result = await service.executeBatch(requests);

    expect(result.transientFailures).toHaveLength(1);
    expect(result.transientFailures[0].status).toBe(429);
    expect(result.permanentFailures).toHaveLength(0);
    expect(result.succeeded).toHaveLength(0);
  });

  it('audit logger called with GraphApiCallSucceeded on all success', async () => {
    const auditLogger = jest.fn().mockResolvedValue(undefined);
    const mockClient = createMockGraphClient([
      { id: '1', status: 200, body: {} },
    ]);
    service.initialize(mockClient);
    service.setAuditLogger(auditLogger);

    await service.executeBatch([{ method: 'GET', url: '/me' }]);

    expect(auditLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: AuditAction.GraphApiCallSucceeded,
        EntityType: EntityType.GraphApi,
        User: 'system',
      })
    );
  });

  it('audit logger called with GraphApiCallFailed when any request fails', async () => {
    const auditLogger = jest.fn().mockResolvedValue(undefined);
    const mockClient = createMockGraphClient([
      { id: '1', status: 200, body: {} },
      { id: '2', status: 400, body: { error: { message: 'Bad request' } } },
    ]);
    service.initialize(mockClient);
    service.setAuditLogger(auditLogger);

    await service.executeBatch([
      { method: 'GET', url: '/me' },
      { method: 'GET', url: '/bad' },
    ]);

    // The summary audit call should use GraphApiCallFailed since not all succeeded
    expect(auditLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: AuditAction.GraphApiCallFailed,
        EntityType: EntityType.GraphApi,
      })
    );
  });

  it('custom request IDs are preserved', async () => {
    const mockClient = createMockGraphClient([
      { id: 'my-custom-id', status: 200, body: {} },
      { id: 'another-id', status: 200, body: {} },
    ]);
    service.initialize(mockClient);

    const requests: IBatchRequest[] = [
      { id: 'my-custom-id', method: 'GET', url: '/me' },
      { id: 'another-id', method: 'GET', url: '/users' },
    ];

    const result = await service.executeBatch(requests);

    // Verify the custom IDs were sent to the Graph API
    const postCall = mockClient._postFn.mock.calls[0][0];
    expect(postCall.requests[0].id).toBe('my-custom-id');
    expect(postCall.requests[1].id).toBe('another-id');

    // Verify they come back in the response
    expect(result.responses[0].id).toBe('my-custom-id');
    expect(result.responses[1].id).toBe('another-id');
  });
});
