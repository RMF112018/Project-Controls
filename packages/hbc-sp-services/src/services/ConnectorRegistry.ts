/**
 * ConnectorRegistry — Singleton registry for external connector adapters (Phase 4A).
 * Adapters are registered at app init; looked up by ConnectorType.
 */
import type { ConnectorType } from '../models/IExternalConnector';
import type { IConnectorAdapter } from './IConnectorAdapter';

export type ConnectorAdapterFactory = () => IConnectorAdapter;

class ConnectorRegistryImpl {
  private adapters = new Map<ConnectorType, ConnectorAdapterFactory>();

  /** Register an adapter factory for a connector type */
  register(type: ConnectorType, factory: ConnectorAdapterFactory): void {
    if (this.adapters.has(type)) {
      throw new Error(`Connector adapter for '${type}' is already registered`);
    }
    this.adapters.set(type, factory);
  }

  /** Get an adapter instance by connector type */
  get(type: ConnectorType): IConnectorAdapter {
    const factory = this.adapters.get(type);
    if (!factory) {
      throw new Error(`No connector adapter registered for '${type}'`);
    }
    return factory();
  }

  /** Check if an adapter is registered */
  has(type: ConnectorType): boolean {
    return this.adapters.has(type);
  }

  /** Get all registered connector types */
  getRegisteredTypes(): ConnectorType[] {
    return Array.from(this.adapters.keys());
  }

  /** Clear all registrations (for testing) */
  clear(): void {
    this.adapters.clear();
  }
}

/** Singleton connector registry */
export const connectorRegistry = new ConnectorRegistryImpl();
export type { ConnectorRegistryImpl as ConnectorRegistry };
