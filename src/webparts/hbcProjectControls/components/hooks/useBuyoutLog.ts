import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IBuyoutEntry } from '@hbc/sp-services';

export interface IBuyoutMetrics {
  totalOriginalBudget: number;
  totalAwardedValue: number;
  totalOverUnder: number;
  procurementProgress: number; // percentage 0-100
  totalDivisions: number;
  awardedDivisions: number;
}

export function useBuyoutLog() {
  const { dataService } = useAppContext();
  const [entries, setEntries] = React.useState<IBuyoutEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchEntries = React.useCallback(async (projectCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataService.getBuyoutEntries(projectCode);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load buyout entries');
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  const initializeLog = React.useCallback(async (projectCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataService.initializeBuyoutLog(projectCode);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize buyout log');
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  const addEntry = React.useCallback(async (projectCode: string, entry: Partial<IBuyoutEntry>) => {
    setError(null);
    try {
      const created = await dataService.addBuyoutEntry(projectCode, entry);
      setEntries(prev => [...prev, created].sort((a, b) => a.divisionCode.localeCompare(b.divisionCode)));
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
      throw err;
    }
  }, [dataService]);

  const updateEntry = React.useCallback(async (projectCode: string, entryId: number, data: Partial<IBuyoutEntry>) => {
    setError(null);
    try {
      const updated = await dataService.updateBuyoutEntry(projectCode, entryId, data);
      setEntries(prev => prev.map(e => e.id === entryId ? updated : e));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry');
      throw err;
    }
  }, [dataService]);

  const removeEntry = React.useCallback(async (projectCode: string, entryId: number) => {
    setError(null);
    try {
      await dataService.removeBuyoutEntry(projectCode, entryId);
      setEntries(prev => prev.filter(e => e.id !== entryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove entry');
      throw err;
    }
  }, [dataService]);

  const metrics: IBuyoutMetrics = React.useMemo(() => {
    const totalOriginalBudget = entries.reduce((sum, e) => sum + e.originalBudget, 0);
    const awarded = entries.filter(e => e.contractValue != null && e.contractValue > 0);
    const totalAwardedValue = awarded.reduce((sum, e) => sum + (e.contractValue || 0), 0);
    const totalOverUnder = awarded.reduce((sum, e) => sum + (e.overUnder || 0), 0);
    const executedCount = entries.filter(e => e.status === 'Executed' || e.status === 'Awarded').length;
    const procurementProgress = entries.length > 0
      ? Math.round((executedCount / entries.length) * 100)
      : 0;

    return {
      totalOriginalBudget,
      totalAwardedValue,
      totalOverUnder,
      procurementProgress,
      totalDivisions: entries.length,
      awardedDivisions: executedCount,
    };
  }, [entries]);

  return {
    entries,
    loading,
    error,
    metrics,
    fetchEntries,
    initializeLog,
    addEntry,
    updateEntry,
    removeEntry,
  };
}
