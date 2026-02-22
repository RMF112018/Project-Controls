import { NotImplementedError } from '../NotImplementedError';

describe('NotImplementedError', () => {
  it('extends Error', () => {
    const err = new NotImplementedError('AzureSql', 'getLeads');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(NotImplementedError);
  });

  it('stores backend and method as readonly properties', () => {
    const err = new NotImplementedError('Dataverse', 'getCurrentUser');
    expect(err.backend).toBe('Dataverse');
    expect(err.method).toBe('getCurrentUser');
  });

  it('has descriptive message including backend and method', () => {
    const err = new NotImplementedError('AzureSql', 'getLeads');
    expect(err.message).toContain('AzureSql');
    expect(err.message).toContain('getLeads');
    expect(err.message).toContain('not implemented');
  });

  it('has name set to NotImplementedError', () => {
    const err = new NotImplementedError('AzureSql', 'getLeads');
    expect(err.name).toBe('NotImplementedError');
  });
});
