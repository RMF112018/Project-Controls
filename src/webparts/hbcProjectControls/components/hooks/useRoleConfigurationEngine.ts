import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { IRoleConfiguration } from '@hbc/sp-services';

export interface IUseRoleConfigurationEngine {
  roles: IRoleConfiguration[];
  isLoading: boolean;
  isEnabled: boolean;
  error: string | null;
  createRole: (data: Partial<IRoleConfiguration>) => Promise<IRoleConfiguration>;
  updateRole: (id: number, data: Partial<IRoleConfiguration>) => Promise<IRoleConfiguration>;
  deleteRole: (id: number) => Promise<void>;
  seedDefaults: () => Promise<IRoleConfiguration[]>;
  refresh: () => Promise<void>;
}

export function useRoleConfigurationEngine(): IUseRoleConfigurationEngine {
  const { dataService, isFeatureEnabled } = useAppContext();
  const [roles, setRoles] = React.useState<IRoleConfiguration[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isEnabled = isFeatureEnabled('RoleConfigurationEngine');

  // Ref-back isFeatureEnabled to prevent identity churn
  const isFeatureEnabledRef = React.useRef(isFeatureEnabled);
  isFeatureEnabledRef.current = isFeatureEnabled;

  const fetchRoles = React.useCallback(async () => {
    if (!isFeatureEnabledRef.current('RoleConfigurationEngine')) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await dataService.getRoleConfigurations();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load role configurations');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  React.useEffect(() => {
    if (isEnabled) {
      fetchRoles();
    }
  }, [isEnabled, fetchRoles]);

  const createRole = React.useCallback(async (data: Partial<IRoleConfiguration>) => {
    const result = await dataService.createRoleConfiguration(data);
    await fetchRoles();
    return result;
  }, [dataService, fetchRoles]);

  const updateRole = React.useCallback(async (id: number, data: Partial<IRoleConfiguration>) => {
    const result = await dataService.updateRoleConfiguration(id, data);
    await fetchRoles();
    return result;
  }, [dataService, fetchRoles]);

  const deleteRole = React.useCallback(async (id: number) => {
    await dataService.deleteRoleConfiguration(id);
    await fetchRoles();
  }, [dataService, fetchRoles]);

  const seedDefaults = React.useCallback(async () => {
    const result = await dataService.seedDefaultRoleConfigurations();
    await fetchRoles();
    return result;
  }, [dataService, fetchRoles]);

  return {
    roles,
    isLoading,
    isEnabled,
    error,
    createRole,
    updateRole,
    deleteRole,
    seedDefaults,
    refresh: fetchRoles,
  };
}
