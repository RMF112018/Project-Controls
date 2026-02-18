import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalR } from './useSignalR';
import { IConstraintLog, EntityType } from '@hbc/sp-services';

export interface IConstraintsSummary {
  total: number;
  open: number;
  closed: number;
  overdue: number;
  totalBudgetImpact: number;
  topOverdue: IConstraintLog[];
}

const EMPTY_SUMMARY: IConstraintsSummary = {
  total: 0,
  open: 0,
  closed: 0,
  overdue: 0,
  totalBudgetImpact: 0,
  topOverdue: [],
};

export function useConstraintsSummary() {
  const { dataService } = useAppContext();
  const [constraints, setConstraints] = React.useState<IConstraintLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSummary = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dataService.getAllConstraints();
      setConstraints(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load constraints');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  useSignalR({
    entityType: EntityType.Constraint,
    onEntityChanged: React.useCallback(() => {
      fetchSummary().catch(console.error);
    }, [fetchSummary]),
  });

  const summary: IConstraintsSummary = React.useMemo(() => {
    if (constraints.length === 0) return EMPTY_SUMMARY;

    const today = new Date().toISOString().split('T')[0];
    const openItems = constraints.filter(c => c.status === 'Open');
    const closedItems = constraints.filter(c => c.status === 'Closed');
    const overdueItems = openItems
      .filter(c => c.dueDate && c.dueDate < today)
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    const totalBudgetImpact = constraints.reduce((sum, c) => sum + (c.budgetImpactCost || 0), 0);

    return {
      total: constraints.length,
      open: openItems.length,
      closed: closedItems.length,
      overdue: overdueItems.length,
      totalBudgetImpact,
      topOverdue: overdueItems.slice(0, 5),
    };
  }, [constraints]);

  return { summary, isLoading, error, fetchSummary };
}
