import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { IPermit, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

export interface IPermitMetrics {
  total: number;
  active: number;
  pending: number;
  expired: number;
  void: number;
  expiringSoon: number;
  byType: Record<string, number>;
  byLocation: Record<string, number>;
}

export function usePermitsLog() {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [permits, setPermits] = React.useState<IPermit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

  const fetchPermits = React.useCallback(async (projectCode: string) => {
    setLoading(true);
    setError(null);
    lastProjectCodeRef.current = projectCode;
    try {
      const data = await dataService.getPermits(projectCode);
      setPermits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permits');
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  useSignalR({
    entityType: EntityType.Permit,
    onEntityChanged: React.useCallback(() => {
      if (lastProjectCodeRef.current) {
        fetchPermits(lastProjectCodeRef.current);
      }
    }, [fetchPermits]),
  });

  const broadcastPermitChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Permit,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: lastProjectCodeRef.current || undefined,
    });
  }, [broadcastChange, currentUser]);

  const addPermit = React.useCallback(async (projectCode: string, permit: Partial<IPermit>) => {
    setError(null);
    try {
      const created = await dataService.addPermit(projectCode, permit);
      setPermits(prev => [...prev, created]);
      broadcastPermitChange(created.id, 'created', 'Permit added');
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add permit');
      throw err;
    }
  }, [dataService, broadcastPermitChange]);

  const updatePermit = React.useCallback(async (projectCode: string, permitId: number, data: Partial<IPermit>) => {
    setError(null);
    try {
      const updated = await dataService.updatePermit(projectCode, permitId, data);
      setPermits(prev => prev.map(p => p.id === permitId ? updated : p));
      broadcastPermitChange(permitId, 'updated', 'Permit updated');
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permit');
      throw err;
    }
  }, [dataService, broadcastPermitChange]);

  const removePermit = React.useCallback(async (projectCode: string, permitId: number) => {
    setError(null);
    try {
      await dataService.removePermit(projectCode, permitId);
      setPermits(prev => prev.filter(p => p.id !== permitId));
      broadcastPermitChange(permitId, 'deleted', 'Permit removed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove permit');
      throw err;
    }
  }, [dataService, broadcastPermitChange]);

  const metrics: IPermitMetrics = React.useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const todayStr = today.toISOString().split('T')[0];
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];

    const active = permits.filter(p => p.status === 'Active');
    const pending = permits.filter(p => p.status === 'Pending Application' || p.status === 'Pending Revision');
    const expired = permits.filter(p => p.status === 'Expired');
    const voidPermits = permits.filter(p => p.status === 'VOID');
    const expiringSoon = permits.filter(p =>
      p.status === 'Active' && p.dateExpires && p.dateExpires >= todayStr && p.dateExpires <= thirtyDaysStr
    );

    const byType: Record<string, number> = {};
    for (const p of permits) {
      byType[p.type] = (byType[p.type] || 0) + 1;
    }

    const byLocation: Record<string, number> = {};
    for (const p of permits) {
      const loc = p.location || 'Unknown';
      byLocation[loc] = (byLocation[loc] || 0) + 1;
    }

    return {
      total: permits.length,
      active: active.length,
      pending: pending.length,
      expired: expired.length,
      void: voidPermits.length,
      expiringSoon: expiringSoon.length,
      byType,
      byLocation,
    };
  }, [permits]);

  return {
    permits,
    loading,
    error,
    metrics,
    fetchPermits,
    addPermit,
    updatePermit,
    removePermit,
  };
}
