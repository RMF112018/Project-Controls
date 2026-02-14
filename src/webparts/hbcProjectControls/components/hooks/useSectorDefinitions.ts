import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ISectorDefinition } from '@hbc/sp-services';

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
  const { dataService, isFeatureEnabled } = useAppContext();
  const [sectors, setSectors] = React.useState<ISectorDefinition[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSectors = React.useCallback(async () => {
    if (!isFeatureEnabled('PermissionEngine')) return;
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
  }, [dataService, isFeatureEnabled]);

  React.useEffect(() => {
    fetchSectors();
  }, [fetchSectors]);

  const activeSectors = React.useMemo(
    () => sectors.filter(s => s.isActive),
    [sectors]
  );

  const createSector = React.useCallback(async (data: Partial<ISectorDefinition>) => {
    const result = await dataService.createSectorDefinition(data);
    await fetchSectors();
    return result;
  }, [dataService, fetchSectors]);

  const updateSector = React.useCallback(async (id: number, data: Partial<ISectorDefinition>) => {
    const result = await dataService.updateSectorDefinition(id, data);
    await fetchSectors();
    return result;
  }, [dataService, fetchSectors]);

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
