import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { ICloseoutItem, IStartupChecklistSummary, ChecklistStatus, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

interface IUseCloseoutChecklistResult {
  items: ICloseoutItem[];
  isLoading: boolean;
  error: string | null;
  fetchChecklist: (projectCode: string) => Promise<void>;
  updateItem: (projectCode: string, itemId: number, data: Partial<ICloseoutItem>) => Promise<ICloseoutItem>;
  addItem: (projectCode: string, item: Partial<ICloseoutItem>) => Promise<ICloseoutItem>;
  removeItem: (projectCode: string, itemId: number) => Promise<void>;
  getSummary: () => IStartupChecklistSummary;
  getSectionSummary: (sectionNumber: number) => IStartupChecklistSummary;
}

export function useCloseoutChecklist(): IUseCloseoutChecklistResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [items, setItems] = React.useState<ICloseoutItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastProjectCodeRef = React.useRef<string | null>(null);

  const fetchChecklist = React.useCallback(async (projectCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      lastProjectCodeRef.current = projectCode;
      const result = await dataService.getCloseoutItems(projectCode);
      setItems(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch closeout checklist');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  useSignalR({
    entityType: EntityType.Closeout,
    onEntityChanged: React.useCallback(() => {
      if (lastProjectCodeRef.current) {
        fetchChecklist(lastProjectCodeRef.current);
      }
    }, [fetchChecklist]),
  });

  const broadcastCloseoutChange = React.useCallback((
    entityId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Closeout,
      entityId: String(entityId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
      projectCode: lastProjectCodeRef.current || undefined,
    });
  }, [broadcastChange, currentUser]);

  const updateItem = React.useCallback(async (projectCode: string, itemId: number, data: Partial<ICloseoutItem>) => {
    const updated = await dataService.updateCloseoutItem(itemId, data);
    setItems(prev => prev.map(i => i.id === itemId ? updated : i));
    broadcastCloseoutChange(itemId, 'updated', 'Closeout item updated');
    return updated;
  }, [dataService, broadcastCloseoutChange]);

  const addItem = React.useCallback(async (projectCode: string, item: Partial<ICloseoutItem>) => {
    const created = await dataService.addCloseoutItem(projectCode, item);
    setItems(prev => [...prev, created]);
    broadcastCloseoutChange(created.id, 'created', 'Closeout item added');
    return created;
  }, [dataService, broadcastCloseoutChange]);

  const removeItem = React.useCallback(async (projectCode: string, itemId: number) => {
    await dataService.removeCloseoutItem(projectCode, itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
    broadcastCloseoutChange(itemId, 'deleted', 'Closeout item removed');
  }, [dataService, broadcastCloseoutChange]);

  const computeSummary = React.useCallback((subset: ICloseoutItem[]): IStartupChecklistSummary => {
    return {
      total: subset.length,
      conforming: subset.filter(i => (i.status as ChecklistStatus) === 'Conforming').length,
      deficient: subset.filter(i => (i.status as ChecklistStatus) === 'Deficient').length,
      na: subset.filter(i => (i.status as ChecklistStatus) === 'NA').length,
      neutral: subset.filter(i => (i.status as ChecklistStatus) === 'Neutral').length,
      noResponse: subset.filter(i => (i.status as ChecklistStatus) === 'NoResponse').length,
    };
  }, []);

  const getSummary = React.useCallback(() => computeSummary(items), [items, computeSummary]);

  const getSectionSummary = React.useCallback((sectionNumber: number) => {
    return computeSummary(items.filter(i => i.sectionNumber === sectionNumber));
  }, [items, computeSummary]);

  return { items, isLoading, error, fetchChecklist, updateItem, addItem, removeItem, getSummary, getSectionSummary };
}
