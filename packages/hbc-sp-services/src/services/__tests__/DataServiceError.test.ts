import { DataServiceError } from '../DataServiceError';

describe('DataServiceError', () => {
  it('creates error with method and message only', () => {
    const error = new DataServiceError('getLeads', 'Network timeout');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DataServiceError);
    expect(error.name).toBe('DataServiceError');
    expect(error.method).toBe('getLeads');
    expect(error.message).toBe('getLeads: Network timeout');
    expect(error.entityType).toBeUndefined();
    expect(error.entityId).toBeUndefined();
    expect(error.innerError).toBeUndefined();
  });

  it('includes entityType and entityId when provided', () => {
    const error = new DataServiceError('updateBuyoutEntry', 'Item not found', {
      entityType: 'BuyoutEntry',
      entityId: '42',
    });

    expect(error.method).toBe('updateBuyoutEntry');
    expect(error.entityType).toBe('BuyoutEntry');
    expect(error.entityId).toBe('42');
    expect(error.message).toBe('updateBuyoutEntry: Item not found');
  });

  it('appends inner Error message to full message', () => {
    const inner = new Error('ETIMEDOUT');
    const error = new DataServiceError('createLead', 'SP call failed', {
      innerError: inner,
    });

    expect(error.message).toBe('createLead: SP call failed — ETIMEDOUT');
    expect(error.innerError).toBe(inner);
  });

  it('stringifies non-Error innerError values', () => {
    const error = new DataServiceError('deleteLead', 'Unexpected', {
      innerError: 404,
    });

    expect(error.message).toBe('deleteLead: Unexpected — 404');
    expect(error.innerError).toBe(404);
  });

  it('stringifies object innerError', () => {
    const obj = { code: 'ACCESS_DENIED' };
    const error = new DataServiceError('getProjectKPIs', 'Forbidden', {
      innerError: obj,
    });

    expect(error.message).toContain('getProjectKPIs: Forbidden — ');
    expect(error.innerError).toBe(obj);
  });

  it('handles empty options object gracefully', () => {
    const error = new DataServiceError('getLeads', 'Failed', {});

    expect(error.message).toBe('getLeads: Failed');
    expect(error.entityType).toBeUndefined();
    expect(error.entityId).toBeUndefined();
    expect(error.innerError).toBeUndefined();
  });

  it('preserves prototype chain for instanceof checks', () => {
    const error = new DataServiceError('test', 'msg');

    expect(error instanceof DataServiceError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });
});
