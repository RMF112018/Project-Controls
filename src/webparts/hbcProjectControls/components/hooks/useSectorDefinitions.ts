import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ISectorDefinition, EntityType, IEntityChangedMessage } from '@hbc/sp-services';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';

export interface IUseSectorDefinitions {
  sectors: ISectorDefinition[];
  activeSectors: ISectorDefinition[];
  loading: boolean;
  error: string | null;
  createSector: (data: Partial<ISectorDefinition>) => Promise<ISectorDefinition>;
  updateSector: (id: number, data: Partial<ISectorDefinition>) => Promise<ISectorDefinition>;
  refresh: () => void;
}

export function useSectorDefinitions(): IUseSectorDefinitions {
  const { dataService, isFeatureEnabled, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [sectors, setSectors] = React.useState<ISectorDefinition[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Ref-back isFeatureEnabled to prevent fetchSectors identity churn
  // when currentUser changes (e.g. PermissionEngine resolution)
  const isFeatureEnabledRef = React.useRef(isFeatureEnabled);
  isFeatureEnabledRef.current = isFeatureEnabled;

  const fetchSectors = React.useCallback(async () => {
    if (!isFeatureEnabledRef.current('PermissionEngine')) return;
    setLoading(true);
    setError(null);
    try {
      const data = await dataService.getSectorDefinitions();
      setSectors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sectors');
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  React.useEffect(() => {
    fetchSectors();
  }, [fetchSectors]);

  // SignalR: refresh on Config entity changes from other users
  useSignalR({
    entityType: EntityType.Config,
    onEntityChanged: React.useCallback(() => { fetchSectors(); }, [fetchSectors]),
  });

  // Helper to broadcast sector/config changes
  const broadcastConfigChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Config,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
    });
  }, [broadcastChange, currentUser]);

  const activeSectors = React.useMemo(
    () => sectors.filter(s => s.isActive),
    [sectors]
  );

  const createSector = React.useCallback(async (data: Partial<ISectorDefinition>) => {
    const result = await dataService.createSectorDefinition(data);
    await fetchSectors();
    broadcastConfigChange(result.id, 'created', 'Sector definition created');
    return result;
  }, [dataService, fetchSectors, broadcastConfigChange]);

  const updateSector = React.useCallback(async (id: number, data: Partial<ISectorDefinition>) => {
    const result = await dataService.updateSectorDefinition(id, data);
    await fetchSectors();
    broadcastConfigChange(id, 'updated', 'Sector definition updated');
    return result;
  }, [dataService, fetchSectors, broadcastConfigChange]);

  return {
    sectors,
    activeSectors,
    loading,
    error,
    createSector,
    updateSector,
    refresh: fetchSectors,
  };
}
