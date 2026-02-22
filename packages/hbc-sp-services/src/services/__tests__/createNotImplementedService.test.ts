import { createNotImplementedService } from '../createNotImplementedService';
import { NotImplementedError } from '../NotImplementedError';

describe('createNotImplementedService', () => {
  it('returns an object that acts as IDataService', () => {
    const svc = createNotImplementedService('TestBackend');
    expect(svc).toBeDefined();
    expect(typeof svc).toBe('object');
  });

  it('throws NotImplementedError for any method call', () => {
    const svc = createNotImplementedService('TestBackend');
    expect(() => svc.getLeads()).toThrow(NotImplementedError);
    expect(() => svc.getCurrentUser()).toThrow(NotImplementedError);
    expect(() => svc.setProjectSiteUrl(null)).toThrow(NotImplementedError);
  });

  it('includes backend name and method name in error', () => {
    const svc = createNotImplementedService('AzureSql');
    try {
      svc.getLeads();
    } catch (err) {
      const nie = err as NotImplementedError;
      expect(nie.backend).toBe('AzureSql');
      expect(nie.method).toBe('getLeads');
      expect(nie.message).toContain('AzureSql');
      expect(nie.message).toContain('getLeads');
    }
  });

  it('provides toString for debugging', () => {
    const svc = createNotImplementedService('Dataverse');
    expect(String(svc)).toBe('[NotImplementedService:Dataverse]');
  });

  it('throws for arbitrary properties (future-proof)', () => {
    const svc = createNotImplementedService('TestBackend');
    const any = svc as unknown as Record<string, (...args: unknown[]) => unknown>;
    expect(() => any.someNewFutureMethod()).toThrow(NotImplementedError);
  });
});
