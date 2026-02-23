/**
 * usePreconDashboardData — Data hook for the Preconstruction Landing Dashboard.
 *
 * Composes KPIs and chart data from existing IDataService methods.
 * No new service methods required.
 */
import * as React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import type {
  ILead,
  IGoNoGoScorecard,
  IEstimatingTracker,
  ILossAutopsy,
} from '@hbc/sp-services';
import { Stage, isActiveStage, ScorecardStatus } from '@hbc/sp-services';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IPreconKPIs {
  activeLeads: number;
  goNoGoInProgress: number;
  pipelineValue: string;
  pipelineRaw: number;
  estimatedWinRatePct: number;
}

export interface IPreconDashboardData {
  loading: boolean;
  error: string | null;
  kpis: IPreconKPIs;
  leads: ILead[];
  scorecards: IGoNoGoScorecard[];
  estimatingRecords: IEstimatingTracker[];
  autopsies: ILossAutopsy[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

const TERMINAL_SCORECARD_STATUSES: ScorecardStatus[] = [
  ScorecardStatus.Go,
  ScorecardStatus.NoGo,
  ScorecardStatus.Locked,
  ScorecardStatus.Rejected,
];

const EMPTY_KPIS: IPreconKPIs = {
  activeLeads: 0,
  goNoGoInProgress: 0,
  pipelineValue: '$0',
  pipelineRaw: 0,
  estimatedWinRatePct: 0,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePreconDashboardData(): IPreconDashboardData {
  const { dataService } = useAppContext();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [leads, setLeads] = React.useState<ILead[]>([]);
  const [scorecards, setScorecards] = React.useState<IGoNoGoScorecard[]>([]);
  const [estimatingRecords, setEstimatingRecords] = React.useState<IEstimatingTracker[]>([]);
  const [autopsies, setAutopsies] = React.useState<ILossAutopsy[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    Promise.all([
      dataService.getLeads(),
      dataService.getScorecards(),
      dataService.getEstimatingRecords(),
      dataService.getAllLossAutopsies(),
    ])
      .then(([leadsResult, scorecardsResult, estimatingResult, autopsiesResult]) => {
        if (cancelled) return;
        setLeads(leadsResult.items);
        setScorecards(scorecardsResult);
        setEstimatingRecords(estimatingResult.items);
        setAutopsies(autopsiesResult);
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

  const kpis = React.useMemo<IPreconKPIs>(() => {
    if (loading || error) return EMPTY_KPIS;

    // Active Leads — leads in non-archived stages
    const activeCount = leads.filter(l => isActiveStage(l.Stage)).length;

    // Go/No-Go In Progress — scorecards NOT in terminal statuses
    const inProgress = scorecards.filter(
      sc => !TERMINAL_SCORECARD_STATUSES.includes(sc.scorecardStatus)
    ).length;

    // Pipeline Value — sum ProjectValue for active-stage leads
    const pipelineTotal = leads
      .filter(l => isActiveStage(l.Stage))
      .reduce((sum, l) => sum + (l.ProjectValue ?? 0), 0);

    // Win Rate — won / non-archived leads
    const nonArchived = leads.filter(
      l =>
        l.Stage !== Stage.ArchivedNoGo &&
        l.Stage !== Stage.ArchivedLoss &&
        l.Stage !== Stage.ArchivedHistorical
    );
    const won = leads.filter(
      l =>
        l.Stage === Stage.WonContractPending ||
        l.Stage === Stage.ActiveConstruction
    );
    const winRate =
      nonArchived.length > 0
        ? Math.round((won.length / nonArchived.length) * 1000) / 10
        : 0;

    return {
      activeLeads: activeCount,
      goNoGoInProgress: inProgress,
      pipelineValue: formatCurrency(pipelineTotal),
      pipelineRaw: pipelineTotal,
      estimatedWinRatePct: winRate,
    };
  }, [loading, error, leads, scorecards]);

  return {
    loading,
    error,
    kpis,
    leads,
    scorecards,
    estimatingRecords,
    autopsies,
  };
}
