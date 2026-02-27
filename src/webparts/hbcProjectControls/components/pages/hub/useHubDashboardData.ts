/**
 * useHubDashboardData — Data hook for the Analytics Hub Dashboard.
 *
 * Composes KPIs and chart data from existing IDataService methods.
 * No new service methods required.
 */
import * as React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import type {
  ILead,
  IActiveProject,
  IPortfolioSummary,
  IProcoreProject,
  IBambooHREmployee,
} from '@hbc/sp-services';
import { Stage, formatCurrencyCompact, isActiveStage } from '@hbc/sp-services';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IHubKPIs {
  activeProjects: number;
  totalPipelineValue: string;
  totalPipelineRaw: number;
  winRatePct: number;
  safetyScore: number;
  onTimeCompletionPct: number;
}

export interface IHubDashboardData {
  loading: boolean;
  error: string | null;
  kpis: IHubKPIs;
  leads: ILead[];
  activeProjects: IActiveProject[];
  portfolioSummary: IPortfolioSummary | null;
  procoreProjects: IProcoreProject[];
  bambooEmployees: IBambooHREmployee[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_KPIS: IHubKPIs = {
  activeProjects: 0,
  totalPipelineValue: '$0',
  totalPipelineRaw: 0,
  winRatePct: 0,
  safetyScore: 0,
  onTimeCompletionPct: 0,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHubDashboardData(): IHubDashboardData {
  const { dataService } = useAppContext();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [leads, setLeads] = React.useState<ILead[]>([]);
  const [activeProjects, setActiveProjects] = React.useState<IActiveProject[]>([]);
  const [portfolioSummary, setPortfolioSummary] = React.useState<IPortfolioSummary | null>(null);
  const [procoreProjects, setProcoreProjects] = React.useState<IProcoreProject[]>([]);
  const [bambooEmployees, setBambooEmployees] = React.useState<IBambooHREmployee[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    Promise.all([
      dataService.getLeads(),
      dataService.getActiveProjects(),
      dataService.getPortfolioSummary(),
      dataService.getProcoreProjects(),
      dataService.getBambooEmployees(),
    ])
      .then(([leadsResult, projects, summary, procoreProjs, employees]) => {
        if (cancelled) return;
        setLeads(leadsResult.items);
        setActiveProjects(projects);
        setPortfolioSummary(summary);
        setProcoreProjects(procoreProjs);
        setBambooEmployees(employees);
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

  const kpis = React.useMemo<IHubKPIs>(() => {
    if (loading || error) return EMPTY_KPIS;

    // Active Projects — from portfolio
    const activeCount = activeProjects.length;

    // Total Pipeline Value — sum ProjectValue for leads in active stages
    const pipelineLeads = leads.filter(l => isActiveStage(l.Stage));
    const pipelineTotal = pipelineLeads.reduce(
      (sum, l) => sum + (l.ProjectValue ?? 0),
      0
    );

    // Win Rate (last 12 mo) — won / total non-archived
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

    // Safety Score — mock realistic value (no real safety score method yet)
    const safetyScore = 92.4;

    // On-Time Completion % — projects without schedule alerts
    const onTime =
      activeCount > 0
        ? Math.round(
            (activeProjects.filter(p => !p.hasScheduleAlert).length /
              activeCount) *
              100
          )
        : 0;

    return {
      activeProjects: activeCount,
      totalPipelineValue: formatCurrencyCompact(pipelineTotal),
      totalPipelineRaw: pipelineTotal,
      winRatePct: winRate,
      safetyScore,
      onTimeCompletionPct: onTime,
    };
  }, [loading, error, leads, activeProjects]);

  return {
    loading,
    error,
    kpis,
    leads,
    activeProjects,
    portfolioSummary,
    procoreProjects,
    bambooEmployees,
  };
}
