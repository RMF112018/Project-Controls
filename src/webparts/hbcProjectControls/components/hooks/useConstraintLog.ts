import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { IConstraintLog, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

export interface IConstraintMetrics {
  total: number;
  open: number;
  closed: number;
  overdue: number;
  totalBIC: number;
  byCategory: Record<string, number>;
}

export function useConstraintLog() {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [entries, setEntries] = React.useState<IConstraintLog[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

  const fetchConstraints = React.useCallback(async (projectCode: string) => {
    setLoading(true);
    setError(null);
    lastProjectCodeRef.current = projectCode;
    try {
      const data = await dataService.getConstraints(projectCode);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load constraints');
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  useSignalR({
    entityType: EntityType.Constraint,
    onEntityChanged: React.useCallback(() => {
      if (lastProjectCodeRef.current) {
        fetchConstraints(lastProjectCodeRef.current);
      }
    }, [fetchConstraints]),
  });

  const broadcastConstraintChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Constraint,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: lastProjectCodeRef.current || undefined,
    });
  }, [broadcastChange, currentUser]);

  const addConstraint = React.useCallback(async (projectCode: string, constraint: Partial<IConstraintLog>) => {
    setError(null);
    try {
      const created = await dataService.addConstraint(projectCode, constraint);
      setEntries(prev => [...prev, created].sort((a, b) => a.constraintNumber - b.constraintNumber));
      broadcastConstraintChange(created.id, 'created', 'Constraint added');
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add constraint');
      throw err;
    }
  }, [dataService, broadcastConstraintChange]);

  const updateConstraint = React.useCallback(async (projectCode: string, constraintId: number, data: Partial<IConstraintLog>) => {
    setError(null);
    try {
      const updated = await dataService.updateConstraint(projectCode, constraintId, data);
      setEntries(prev => prev.map(e => e.id === constraintId ? updated : e));
      broadcastConstraintChange(constraintId, 'updated', 'Constraint updated');
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update constraint');
      throw err;
    }
  }, [dataService, broadcastConstraintChange]);

  const removeConstraint = React.useCallback(async (projectCode: string, constraintId: number) => {
    setError(null);
    try {
      await dataService.removeConstraint(projectCode, constraintId);
      setEntries(prev => prev.filter(e => e.id !== constraintId));
      broadcastConstraintChange(constraintId, 'deleted', 'Constraint removed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove constraint');
      throw err;
    }
  }, [dataService, broadcastConstraintChange]);

  const metrics: IConstraintMetrics = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const open = entries.filter(e => e.status === 'Open');
    const closed = entries.filter(e => e.status === 'Closed');
    const overdue = open.filter(e => e.dueDate && e.dueDate < today);
    const totalBIC = entries.reduce((sum, e) => sum + (e.budgetImpactCost || 0), 0);

    const byCategory: Record<string, number> = {};
    for (const e of entries) {
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    }

    return {
      total: entries.length,
      open: open.length,
      closed: closed.length,
      overdue: overdue.length,
      totalBIC,
      byCategory,
    };
  }, [entries]);

  return {
    entries,
    loading,
    error,
    metrics,
    fetchConstraints,
    addConstraint,
    updateConstraint,
    removeConstraint,
  };
}
