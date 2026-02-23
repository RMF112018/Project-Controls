import { connectorRegistry } from '../ConnectorRegistry';
import type { ConnectorType } from '../../models/IExternalConnector';
import type { IConnectorAdapter } from '../IConnectorAdapter';

const createMockAdapter = (type: ConnectorType = 'Procore'): IConnectorAdapter => ({
  connectorType: type,
  retryPolicy: { retryableStatuses: [429, 500], maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 30000 },
  testConnection: jest.fn(),
  sync: jest.fn(),
  getStatus: jest.fn(),
  mapToInternal: jest.fn((d) => d),
  mapToExternal: jest.fn((d) => d),
});

describe('ConnectorRegistry', () => {
  beforeEach(() => {
    connectorRegistry.clear();
  });

  it('register and get adapter — register factory, get returns instance', () => {
    const mockAdapter = createMockAdapter('Procore');
    connectorRegistry.register('Procore', () => mockAdapter);

    const result = connectorRegistry.get('Procore');

    expect(result).toBe(mockAdapter);
    expect(result.connectorType).toBe('Procore');
  });

  it('duplicate registration throws — registering same type twice throws', () => {
    connectorRegistry.register('Procore', () => createMockAdapter('Procore'));

    expect(() => {
      connectorRegistry.register('Procore', () => createMockAdapter('Procore'));
    }).toThrow("Connector adapter for 'Procore' is already registered");
  });

  it('get unregistered type throws — getting unregistered type throws', () => {
    expect(() => {
      connectorRegistry.get('Procore');
    }).toThrow("No connector adapter registered for 'Procore'");
  });

  it('has returns true for registered — has after register', () => {
    connectorRegistry.register('Procore', () => createMockAdapter('Procore'));

    expect(connectorRegistry.has('Procore')).toBe(true);
  });

  it('has returns false for unregistered — has without register', () => {
    expect(connectorRegistry.has('BambooHR')).toBe(false);
  });

  it('getRegisteredTypes returns all — register two, returns both', () => {
    connectorRegistry.register('Procore', () => createMockAdapter('Procore'));
    connectorRegistry.register('BambooHR', () => createMockAdapter('BambooHR'));

    const types = connectorRegistry.getRegisteredTypes();

    expect(types).toHaveLength(2);
    expect(types).toContain('Procore');
    expect(types).toContain('BambooHR');
  });

  it('clear removes all — register, clear, has returns false', () => {
    connectorRegistry.register('Procore', () => createMockAdapter('Procore'));
    connectorRegistry.register('BambooHR', () => createMockAdapter('BambooHR'));

    connectorRegistry.clear();

    expect(connectorRegistry.has('Procore')).toBe(false);
    expect(connectorRegistry.has('BambooHR')).toBe(false);
    expect(connectorRegistry.getRegisteredTypes()).toHaveLength(0);
  });

  it('factory called each time — get() calls factory every time (new instance each call)', () => {
    const factory = jest.fn(() => createMockAdapter('Procore'));
    connectorRegistry.register('Procore', factory);

    const first = connectorRegistry.get('Procore');
    const second = connectorRegistry.get('Procore');

    expect(factory).toHaveBeenCalledTimes(2);
    expect(first).not.toBe(second);
  });
});
