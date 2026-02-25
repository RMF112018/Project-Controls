/**
 * AnalyticsHubDashboardPage — Main Analytics Hub Dashboard (Phase 4F).
 *
 * Root route `/` — enterprise-wide project intelligence and performance metrics.
 * 5 KPI cards, 6 interactive ECharts, recent activity feed, role-gated workspace
 * quick links, and a Power BI embed placeholder behind feature flag.
 */
import * as React from 'react';
import { makeStyles, shorthands, tokens, mergeClasses } from '@fluentui/react-components';
import {
  Building24Regular,
  Money24Regular,
  Trophy24Regular,
  Shield24Regular,
  Timer24Regular,
} from '@fluentui/react-icons';
import type { EChartsOption } from 'echarts';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcEChart } from '../../shared/HbcEChart';
import { FeatureGate } from '../../guards/FeatureGate';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
import { useAppContext } from '../../contexts/AppContext';
import { LAUNCHER_WORKSPACES } from '../../navigation/workspaceConfig';
import { useHubDashboardData } from './useHubDashboardData';
import { usePerformanceMarker } from '../../hooks/usePerformanceMarker';
import { HBC_COLORS, ELEVATION, TRANSITION } from '../../../theme/tokens';
import { Stage, ROLE_NAV_ITEMS } from '@hbc/sp-services';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  workspaceSelectorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    ...shorthands.gap('16px'),
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  workspaceCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('20px'),
    boxShadow: ELEVATION.level1,
    cursor: 'pointer',
    transitionProperty: 'box-shadow, transform',
    transitionDuration: TRANSITION.normal,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    ':hover': {
      boxShadow: ELEVATION.level2,
      transform: 'translateY(-2px)',
    },
  },
  workspaceCardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: HBC_COLORS.navy,
    marginTop: '0',
    marginBottom: '0',
  },
  workspaceCardDescription: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    lineHeight: '1.4',
  },
  workspaceCardModuleCount: {
    fontSize: '11px',
    fontWeight: '600',
    color: HBC_COLORS.orange,
    marginTop: 'auto',
  },
  kpiStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    ...shorthands.gap('16px'),
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(3, 1fr)',
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    ...shorthands.gap('20px'),
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  chartCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('20px'),
    boxShadow: ELEVATION.level1,
    transitionProperty: 'box-shadow',
    transitionDuration: TRANSITION.normal,
    ':hover': {
      boxShadow: ELEVATION.level2,
    },
  },
  chartCardWide: {
    gridColumn: 'span 2',
    '@media (max-width: 768px)': {
      gridColumn: 'span 1',
    },
  },
  chartTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: HBC_COLORS.navy,
    marginBottom: '12px',
    marginTop: '0',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: HBC_COLORS.navy,
    marginBottom: '16px',
    marginTop: '0',
  },
  
  // Activity feed
  activityFeed: {
    maxHeight: '400px',
    overflowY: 'auto' as const,
    display: 'grid',
    ...shorthands.gap('0px'),
  },
  activityItem: {
    ...shorthands.padding('10px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  activityAction: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.5',
  },
  activityUser: {
    fontWeight: '600',
    color: HBC_COLORS.navy,
  },
  activityEntity: {
    fontWeight: '500',
    color: HBC_COLORS.lightNavy,
  },
  activityMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: tokens.colorNeutralForeground4,
    marginTop: '2px',
  },
  // PowerBI placeholder
  powerBiPlaceholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('2px', 'dashed', tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
    textAlign: 'center' as const,
    ...shorthands.gap('8px'),
  },
  powerBiSubtext: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
  },
});

// ─── Mock Activity Feed Data ──────────────────────────────────────────────────

interface IActivityItem {
  id: string;
  action: string;
  entity: string;
  user: string;
  timestamp: string;
  workspace: string;
}

const MOCK_ACTIVITIES: IActivityItem[] = [
  { id: '1', action: 'created lead', entity: 'Palm Beach Gardens Mixed Use', user: 'Ryan Hutchins', timestamp: '2 min ago', workspace: 'Preconstruction' },
  { id: '2', action: 'approved Go/No-Go for', entity: 'Jupiter Medical Center', user: 'Gregg Hedrick', timestamp: '15 min ago', workspace: 'Preconstruction' },
  { id: '3', action: 'assigned project number 26-100-01 to', entity: 'Okeechobee Office Tower', user: 'Heather Thomas', timestamp: '28 min ago', workspace: 'Preconstruction' },
  { id: '4', action: 'completed safety inspection at', entity: 'Marina Village Phase II', user: 'Emily Brooks', timestamp: '1 hr ago', workspace: 'Operations' },
  { id: '5', action: 'submitted RFI for', entity: 'Caretta Ocean Resort', user: 'Jennifer Walsh', timestamp: '1.5 hr ago', workspace: 'Operations' },
  { id: '6', action: 'synced Procore data for', entity: 'Bayfront Tower', user: 'System', timestamp: '2 hr ago', workspace: 'Operations' },
  { id: '7', action: 'approved time-off request from', entity: 'Daniel Kim', user: 'Amanda Phillips', timestamp: '2.5 hr ago', workspace: 'Shared Services' },
  { id: '8', action: 'updated buyout log for', entity: 'Palm Gardens Senior Living', user: 'Robert Thompson', timestamp: '3 hr ago', workspace: 'Operations' },
  { id: '9', action: 'uploaded marketing collateral for', entity: 'Q1 2026 Campaign', user: 'Lisa Anderson', timestamp: '3.5 hr ago', workspace: 'Shared Services' },
  { id: '10', action: 'recorded sign-in at', entity: 'Hedrick Corporate HQ Renovation', user: 'Brian Foster', timestamp: '4 hr ago', workspace: 'HB Site Control' },
  { id: '11', action: 'resolved Procore conflict for', entity: 'Caretta Ocean Resort', user: 'Jennifer Walsh', timestamp: '4.5 hr ago', workspace: 'Operations' },
  { id: '12', action: 'submitted estimate for', entity: 'Cocoa Beach Multi-Family', user: 'Chai Banthia', timestamp: '5 hr ago', workspace: 'Preconstruction' },
  { id: '13', action: 'updated risk enrollment for', entity: 'Marina Village Phase II', user: 'Kevin Murphy', timestamp: '6 hr ago', workspace: 'Shared Services' },
  { id: '14', action: 'completed QC inspection at', entity: 'Bayfront Tower', user: 'Daniel Kim', timestamp: '7 hr ago', workspace: 'HB Site Control' },
  { id: '15', action: 'generated monthly report for', entity: 'February 2026', user: 'James Patterson', timestamp: '8 hr ago', workspace: 'Operations' },
];

// ─── Mock Chart Data ──────────────────────────────────────────────────────────

const WIN_RATE_MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
const WIN_RATE_HISTORICAL = [28.1, 30.4, 31.2, 29.8, 33.5, 32.1, 35.0, 33.8, 36.2, 34.8, 33.5, 34.2];
const WIN_RATE_FORECAST_LABELS = ['Mar (F)', 'Apr (F)', 'May (F)'];
const WIN_RATE_FORECAST_VALUES = [35.1, 36.0, 36.8];
const FL_GC_AVERAGE = 28.7;

const LABOR_REGIONS = ['Miami', 'West Palm', 'Orlando', 'Space Coast'];
const LABOR_HBC = [68.50, 62.30, 55.80, 52.10];
const LABOR_FL_AVG = [63.00, 58.50, 53.20, 50.40];
const LABOR_NATIONAL = [58.20, 58.20, 58.20, 58.20];

// Material cost — normalized to % change from March baseline
const MATERIAL_MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
const ENR_FL_RAW = [224.1, 225.8, 227.3, 228.1, 229.5, 230.2, 231.8, 233.1, 234.5, 235.2, 236.8, 237.4];
const TURNER_RAW = [1312, 1318, 1325, 1330, 1338, 1342, 1350, 1355, 1362, 1368, 1374, 1380];
const ROMAC_RAW = [198.2, 199.1, 200.5, 201.3, 202.8, 203.5, 204.9, 206.1, 207.3, 208.0, 209.2, 210.1];

function normalizeSeries(data: number[]): number[] {
  const base = data[0];
  return data.map(v => Math.round(((v - base) / base) * 10000) / 100);
}

const HEATMAP_DIVISIONS = ['Commercial', 'Residential', 'Preconstruction', 'Safety', 'QC'];
const HEATMAP_MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
// Deterministic utilization percentages (seeded, not random)
const HEATMAP_DATA: [number, number, number][] = [
  // Commercial
  [0, 0, 88], [1, 0, 91], [2, 0, 85], [3, 0, 92], [4, 0, 89],
  // Residential
  [0, 1, 76], [1, 1, 79], [2, 1, 72], [3, 1, 81], [4, 1, 78],
  // Preconstruction
  [0, 2, 94], [1, 2, 87], [2, 2, 91], [3, 2, 96], [4, 2, 93],
  // Safety
  [0, 3, 68], [1, 3, 71], [2, 3, 65], [3, 3, 73], [4, 3, 70],
  // QC
  [0, 4, 82], [1, 4, 78], [2, 4, 84], [3, 4, 80], [4, 4, 86],
];

// ─── Component ────────────────────────────────────────────────────────────────

export const AnalyticsHubDashboardPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();
  const { currentUser, dataServiceMode } = useAppContext();
  const { loading, kpis, leads, activeProjects } = useHubDashboardData();
  usePerformanceMarker('page:analytics-hub', { autoMeasure: true });

  // Stage 2 (sub-tasks 4+7): Role-filtered workspace cards.
  // Mock mode shows all workspaces; production filters by ROLE_NAV_ITEMS.
  const primaryRole = currentUser?.roles[0] ?? '';
  const isMockMode = dataServiceMode === 'mock';
  const visibleWorkspaces = React.useMemo(() => {
    const base = LAUNCHER_WORKSPACES.filter(w => !w.requireProject);
    if (isMockMode || !primaryRole) return base;
    const navConfig = ROLE_NAV_ITEMS[primaryRole];
    if (!navConfig) return base;
    return base.filter(w => navConfig.workspaces.includes(w.id));
  }, [isMockMode, primaryRole]);

  // ── Chart 1: Pipeline Funnel ────────────────────────────────────────────

  const pipelineFunnelOption = React.useMemo<EChartsOption>(() => {
    const stageOrder = [
      { stage: Stage.LeadDiscovery, label: 'Discovery' },
      { stage: Stage.GoNoGoPending, label: 'Go/No-Go' },
      { stage: Stage.Opportunity, label: 'Opportunity' },
      { stage: Stage.Pursuit, label: 'Pursuit' },
      { stage: Stage.WonContractPending, label: 'Won' },
    ];
    const data = stageOrder.map(s => ({
      name: s.label,
      value: leads.filter(l => l.Stage === s.stage).length || 1,
    }));
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}' as unknown as undefined },
      series: [
        {
          type: 'funnel',
          left: '10%',
          width: '80%',
          sort: 'descending',
          gap: 2,
          label: { show: true, position: 'inside', fontSize: 12 },
          data,
        },
      ],
    };
  }, [leads]);

  // ── Chart 2: Project Status Treemap ─────────────────────────────────────

  const projectTreemapOption = React.useMemo<EChartsOption>(() => {
    const statusGroups = ['Precon', 'Construction', 'Final Payment'] as const;
    const children = statusGroups.map(status => ({
      name: status,
      children: activeProjects
        .filter(p => p.status === status)
        .map(p => ({
          name: p.projectName,
          value: p.financials.currentContractValue ?? 1_000_000,
        })),
    }));
    return {
      tooltip: {
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number };
          const val = p.value >= 1_000_000
            ? `$${(p.value / 1_000_000).toFixed(1)}M`
            : `$${(p.value / 1_000).toFixed(0)}K`;
          return `${p.name}: ${val}`;
        },
      },
      series: [
        {
          type: 'treemap',
          data: children,
          levels: [
            {
              itemStyle: {
                borderColor: '#fff',
                borderWidth: 3,
                gapWidth: 3,
              },
            },
            {
              itemStyle: {
                borderColor: '#fff',
                borderWidth: 1,
              },
              colorSaturation: [0.3, 0.6],
            },
          ],
          label: {
            show: true,
            fontSize: 11,
          },
        },
      ],
    };
  }, [activeProjects]);

  // ── Chart 3: Win Rate Trend with Forecast ───────────────────────────────

  const winRateTrendOption = React.useMemo<EChartsOption>(() => {
    const allLabels = [...WIN_RATE_MONTHS, ...WIN_RATE_FORECAST_LABELS];
    const historicalPadded = [...WIN_RATE_HISTORICAL, ...WIN_RATE_FORECAST_LABELS.map(() => null)];
    const forecastPadded = [
      ...WIN_RATE_MONTHS.slice(0, -1).map(() => null),
      WIN_RATE_HISTORICAL[WIN_RATE_HISTORICAL.length - 1],
      ...WIN_RATE_FORECAST_VALUES,
    ];
    const benchmark = allLabels.map(() => FL_GC_AVERAGE);

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['HBC Win Rate', 'Forecast', 'FL GC Average'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: allLabels, boundaryGap: false },
      yAxis: { type: 'value', name: '%', min: 20, max: 45 },
      series: [
        {
          name: 'HBC Win Rate',
          type: 'line',
          data: historicalPadded,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `${HBC_COLORS.navy}40` },
                { offset: 1, color: `${HBC_COLORS.navy}00` },
              ],
            },
          },
          itemStyle: { color: HBC_COLORS.navy },
        },
        {
          name: 'Forecast',
          type: 'line',
          data: forecastPadded,
          lineStyle: { type: 'dashed' },
          itemStyle: { color: HBC_COLORS.orange },
        },
        {
          name: 'FL GC Average',
          type: 'line',
          data: benchmark,
          lineStyle: { type: 'dotted', color: HBC_COLORS.gray400, width: 1 },
          itemStyle: { color: HBC_COLORS.gray400 },
          symbol: 'none',
        },
      ],
    };
  }, []);

  // ── Chart 4: Resource Utilization Heatmap ───────────────────────────────

  const resourceHeatmapOption = React.useMemo<EChartsOption>(() => {
    return {
      tooltip: {
        position: 'top',
        formatter: (params: unknown) => {
          const p = params as { value: [number, number, number] };
          return `${HEATMAP_DIVISIONS[p.value[1]]} — ${HEATMAP_MONTHS[p.value[0]]}: ${p.value[2]}%`;
        },
      },
      grid: { left: '18%', right: '12%', bottom: '18%', top: '4%' },
      xAxis: { type: 'category', data: HEATMAP_MONTHS, splitArea: { show: true } },
      yAxis: { type: 'category', data: HEATMAP_DIVISIONS, splitArea: { show: true } },
      visualMap: {
        min: 60,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: {
          color: ['#D1FAE5', HBC_COLORS.warning, HBC_COLORS.error],
        },
      },
      series: [
        {
          type: 'heatmap',
          data: HEATMAP_DATA,
          label: {
            show: true,
            fontSize: 11,
            formatter: (p: unknown) => `${(p as { value: [number, number, number] }).value[2]}%`,
          },
        },
      ],
    };
  }, []);

  // ── Chart 5: Florida Labor Rate Benchmark ───────────────────────────────

  const laborRateOption = React.useMemo<EChartsOption>(() => {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['HBC Actual', 'FL State Avg', 'National Avg'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: LABOR_REGIONS },
      yAxis: { type: 'value', name: '$/hr', min: 40 },
      series: [
        {
          name: 'HBC Actual',
          type: 'bar',
          data: LABOR_HBC,
          itemStyle: { color: HBC_COLORS.navy },
        },
        {
          name: 'FL State Avg',
          type: 'bar',
          data: LABOR_FL_AVG,
          itemStyle: { color: HBC_COLORS.orange },
        },
        {
          name: 'National Avg',
          type: 'bar',
          data: LABOR_NATIONAL,
          itemStyle: { color: HBC_COLORS.gray400 },
        },
      ],
    };
  }, []);

  // ── Chart 6: Material Cost Index Trend (normalized) ─────────────────────

  const materialCostOption = React.useMemo<EChartsOption>(() => {
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const items = params as Array<{ seriesName: string; value: number; marker: string }>;
          const header = `<div style="margin-bottom:4px;font-weight:600">${(items[0] as { axisValue?: string }).axisValue ?? ''}</div>`;
          const rows = items
            .map(i => `${i.marker} ${i.seriesName}: +${i.value.toFixed(2)}%`)
            .join('<br/>');
          return header + rows;
        },
      },
      legend: { data: ['ENR Florida', 'Turner Index', 'RoMac'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: MATERIAL_MONTHS, boundaryGap: false },
      yAxis: { type: 'value', name: '% change', axisLabel: { formatter: '+{value}%' } },
      series: [
        {
          name: 'ENR Florida',
          type: 'line',
          data: normalizeSeries(ENR_FL_RAW),
          itemStyle: { color: HBC_COLORS.navy },
        },
        {
          name: 'Turner Index',
          type: 'line',
          data: normalizeSeries(TURNER_RAW),
          itemStyle: { color: HBC_COLORS.orange },
        },
        {
          name: 'RoMac',
          type: 'line',
          data: normalizeSeries(ROMAC_RAW),
          itemStyle: { color: HBC_COLORS.success },
        },
      ],
    };
  }, []);

  // ── Workspace card descriptions ─────────────────────────────────────
  const WORKSPACE_DESCRIPTIONS: Record<string, string> = React.useMemo(() => ({
    admin: 'System configuration, roles, provisioning, and dev tools',
    preconstruction: 'Business development, estimating, IDS, and pipeline management',
    operations: 'Commercial ops, safety, QC & warranty, and project delivery',
    'shared-services': 'Marketing, HR, accounting, risk management, and BambooHR',
    'site-control': 'Jobsite sign-in, safety inspections, and QC checklists',
    'project-hub': 'Per-project dashboard, manual, financials, and logs',
  }), []);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className={styles.root}>
      <PageHeader
        title="Analytics Hub"
        subtitle="Enterprise-wide project intelligence and performance metrics"
      />

      {/* ── Workspace Selector Cards ──────────────────────────────────── */}
      <div className={styles.workspaceSelectorGrid}>
        {visibleWorkspaces.map(workspace => (
          <FeatureGate key={workspace.id} featureName={workspace.featureFlag ?? ''} fallback={null}>
            <div
              className={styles.workspaceCard}
              role="button"
              tabIndex={0}
              onClick={() => navigate(workspace.basePath)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(workspace.basePath); }}
            >
              <div className={styles.workspaceCardTitle}>{workspace.label}</div>
              <div className={styles.workspaceCardDescription}>
                {WORKSPACE_DESCRIPTIONS[workspace.id] ?? ''}
              </div>
              <div className={styles.workspaceCardModuleCount}>
                {workspace.sidebarGroups.length} module{workspace.sidebarGroups.length !== 1 ? 's' : ''}
              </div>
            </div>
          </FeatureGate>
        ))}
      </div>

      {/* ── KPI Strip ──────────────────────────────────────────────────── */}
      {loading ? (
        <HbcSkeleton variant="kpi-grid" columns={5} />
      ) : (
        <div className={styles.kpiStrip}>
          <KPICard
            title="Active Projects"
            value={kpis.activeProjects}
            subtitle="Procore synced"
            icon={<Building24Regular />}
            trend={{ value: 8.3, isPositive: true }}
          />
          <KPICard
            title="Total Pipeline Value"
            value={kpis.totalPipelineValue}
            subtitle="Unanet data"
            icon={<Money24Regular />}
            trend={{ value: 12.3, isPositive: true }}
          />
          <KPICard
            title="Win Rate (12 mo)"
            value={`${kpis.winRatePct}%`}
            subtitle="vs FL GC avg 28.7%"
            icon={<Trophy24Regular />}
            trend={{ value: 5.5, isPositive: true }}
          />
          <KPICard
            title="Safety Score"
            value={kpis.safetyScore}
            subtitle="HB Site Control"
            icon={<Shield24Regular />}
            trend={{ value: 2.1, isPositive: true }}
          />
          <KPICard
            title="On-Time Completion"
            value={`${kpis.onTimeCompletionPct}%`}
            subtitle="Procore + Schedule v2"
            icon={<Timer24Regular />}
          />
        </div>
      )}

      {/* ── Charts Grid ────────────────────────────────────────────────── */}
      {loading ? (
        <HbcSkeleton variant="card" />
      ) : (
        <div className={styles.chartsGrid}>
          {/* Pipeline Funnel */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Pipeline Funnel by Stage</h3>
            <HbcEChart
              option={pipelineFunnelOption}
              height={350}
              ariaLabel="Pipeline funnel chart showing leads by stage"
            />
          </div>

          {/* Project Status Treemap — spans 2 columns */}
          <div className={mergeClasses(styles.chartCard, styles.chartCardWide)}>
            <h3 className={styles.chartTitle}>Project Status Treemap</h3>
            <HbcEChart
              option={projectTreemapOption}
              height={350}
              ariaLabel="Project status treemap showing contract values by status"
            />
          </div>

          {/* Win Rate Trend — spans 2 columns */}
          <div className={mergeClasses(styles.chartCard, styles.chartCardWide)}>
            <h3 className={styles.chartTitle}>Win Rate Trend with Forecast</h3>
            <HbcEChart
              option={winRateTrendOption}
              height={300}
              ariaLabel="Win rate trend line chart with three-month forecast"
            />
          </div>

          {/* Resource Utilization Heatmap */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Resource Utilization by Division</h3>
            <HbcEChart
              option={resourceHeatmapOption}
              height={300}
              ariaLabel="Resource utilization heatmap by division and month"
            />
          </div>

          {/* Labor Rate Benchmark */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Florida Labor Rate: HBC vs Benchmark</h3>
            <HbcEChart
              option={laborRateOption}
              height={300}
              ariaLabel="Florida labor rate comparison bar chart by region"
            />
          </div>

          {/* Material Cost Index */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Material Cost Index Trend</h3>
            <HbcEChart
              option={materialCostOption}
              height={300}
              ariaLabel="Material cost index trend over twelve months"
            />
          </div>

          {/* Recent Activity Feed */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Recent Activity</h3>
            <div className={styles.activityFeed}>
              {MOCK_ACTIVITIES.map(activity => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityAction}>
                    <span className={styles.activityUser}>{activity.user}</span>
                    {' '}{activity.action}{' '}
                    <span className={styles.activityEntity}>{activity.entity}</span>
                  </div>
                  <div className={styles.activityMeta}>
                    <span>{activity.workspace}</span>
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Power BI Embed Placeholder ─────────────────────────────────── */}
      <FeatureGate featureName="PowerBIIntegration">
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Power BI Reports</h3>
          <div className={styles.powerBiPlaceholder}>
            <span>Power BI embedded reports will appear here when configured.</span>
            <span className={styles.powerBiSubtext}>
              Contact IT to enable Power BI integration for live executive reporting.
            </span>
          </div>
        </div>
      </FeatureGate>
    </div>
  );
};
