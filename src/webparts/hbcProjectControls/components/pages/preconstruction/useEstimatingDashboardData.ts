/**
 * useEstimatingDashboardData — Data hook for the Estimating Dashboard.
 *
 * Composes KPIs and chart data from existing IDataService methods.
 * No new service methods required.
 */
import * as React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { formatCurrencyCompact, type IEstimatingTracker } from '@hbc/sp-services';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IEstimatingKPIs {
  totalEstimates: number;
  activePursuits: number;
  submittedEstimates: number;
  totalPipelineValue: string;
  pipelineRaw: number;
  preconEngagements: number;
}

export interface IEstimatingDashboardData {
  loading: boolean;
  error: string | null;
  kpis: IEstimatingKPIs;
  allRecords: IEstimatingTracker[];
  currentPursuits: IEstimatingTracker[];
  preconEngagements: IEstimatingTracker[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_KPIS: IEstimatingKPIs = {
  totalEstimates: 0,
  activePursuits: 0,
  submittedEstimates: 0,
  totalPipelineValue: '$0',
  pipelineRaw: 0,
  preconEngagements: 0,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEstimatingDashboardData(): IEstimatingDashboardData {
  const { dataService } = useAppContext();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [allRecords, setAllRecords] = React.useState<IEstimatingTracker[]>([]);
  const [currentPursuits, setCurrentPursuits] = React.useState<IEstimatingTracker[]>([]);
  const [preconEngagements, setPreconEngagements] = React.useState<IEstimatingTracker[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    Promise.all([
      dataService.getEstimatingRecords(),
      dataService.getCurrentPursuits(),
      dataService.getPreconEngagements(),
    ])
      .then(([estimatingResult, pursuitsResult, engagementsResult]) => {
        if (cancelled) return;
        setAllRecords(estimatingResult.items);
        setCurrentPursuits(pursuitsResult);
        setPreconEngagements(engagementsResult);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dataService]);

  // ── Derived KPIs ──────────────────────────────────────────────────────────

  const kpis = React.useMemo<IEstimatingKPIs>(() => {
    if (loading || error) return EMPTY_KPIS;

    const submitted = allRecords.filter(r => r.SubmittedDate).length;

    const pipelineTotal = currentPursuits.reduce(
      (sum, r) => sum + (r.EstimatedCostValue ?? 0),
      0
    );

    return {
      totalEstimates: allRecords.length,
      activePursuits: currentPursuits.length,
      submittedEstimates: submitted,
      totalPipelineValue: formatCurrencyCompact(pipelineTotal),
      pipelineRaw: pipelineTotal,
      preconEngagements: preconEngagements.length,
    };
  }, [loading, error, allRecords, currentPursuits, preconEngagements]);

  return {
    loading,
    error,
    kpis,
    allRecords,
    currentPursuits,
    preconEngagements,
  };
}
