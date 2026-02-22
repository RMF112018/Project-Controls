import { createDelegatingService } from '../createDelegatingService';
import type { IDataService } from '../IDataService';

/** Minimal mock implementing just the methods we test */
function createMockDataService(): IDataService {
  return {
    getLeads: jest.fn().mockResolvedValue([{ id: 1, name: 'Lead A' }]),
    getActiveProjects: jest.fn().mockResolvedValue([]),
    createLead: jest.fn().mockResolvedValue({ id: 2 }),
    mode: 'mock' as const,
  } as unknown as IDataService;
}

describe('createDelegatingService', () => {
  it('delegates method calls to inner service', async () => {
    const inner = createMockDataService();
    const service = createDelegatingService(inner);

    const result = await service.getLeads();

    expect(inner.getLeads).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 1, name: 'Lead A' }]);
  });

  it('delegates property access to inner service', () => {
    const inner = createMockDataService();
    const service = createDelegatingService(inner);

    expect(service.mode).toBe('mock');
  });

  it('uses overrides when provided', async () => {
    const inner = createMockDataService();
    const overrideGetLeads = jest.fn().mockResolvedValue([{ id: 99, name: 'Override' }]);

    const service = createDelegatingService(inner, {
      getLeads: overrideGetLeads,
    } as unknown as Partial<IDataService>);

    const result = await service.getLeads();

    expect(overrideGetLeads).toHaveBeenCalledTimes(1);
    expect(inner.getLeads).not.toHaveBeenCalled();
    expect(result).toEqual([{ id: 99, name: 'Override' }]);
  });

  it('falls through to inner for non-overridden methods', async () => {
    const inner = createMockDataService();
    const service = createDelegatingService(inner, {
      getLeads: jest.fn(),
    } as unknown as Partial<IDataService>);

    await service.getActiveProjects();

    expect(inner.getActiveProjects).toHaveBeenCalledTimes(1);
  });

  it('binds override functions to overrides context', async () => {
    const inner = createMockDataService();
    const overrides = {
      getLeads: jest.fn(function (this: unknown) {
        return this;
      }),
    };

    const service = createDelegatingService(inner, overrides as unknown as Partial<IDataService>);
    const result = await service.getLeads();

    // The `this` inside override should be bound to overrides object
    expect(result).toBe(overrides);
  });

  it('binds inner methods to inner context', async () => {
    const inner = createMockDataService();
    const service = createDelegatingService(inner);

    // Destructure to test that binding preserves `this`
    const { getLeads } = service;
    const result = await getLeads();

    expect(result).toEqual([{ id: 1, name: 'Lead A' }]);
    expect(inner.getLeads).toHaveBeenCalledTimes(1);
  });

  it('handles non-function property overrides', () => {
    const inner = createMockDataService();
    const service = createDelegatingService(inner, {
      mode: 'standalone',
    } as unknown as Partial<IDataService>);

    expect(service.mode).toBe('standalone');
  });

  it('works with empty overrides object', async () => {
    const inner = createMockDataService();
    const service = createDelegatingService(inner, {});

    const result = await service.getLeads();
    expect(result).toEqual([{ id: 1, name: 'Lead A' }]);
  });
});
