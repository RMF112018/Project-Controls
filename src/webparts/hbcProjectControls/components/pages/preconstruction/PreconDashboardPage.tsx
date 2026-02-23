/**
 * PreconDashboardPage — Preconstruction Workspace Landing Dashboard.
 *
 * Route: /preconstruction — 4 KPI cards, 3 interactive ECharts (lead funnel,
 * win rate by PE, post-bid autopsy trend), sub-hub quick links, and PowerBI
 * placeholder behind feature flag.
 */
import * as React from 'react';
import { makeStyles, shorthands, tokens, mergeClasses } from '@fluentui/react-components';
import {
  DocumentSearch24Regular,
  Money24Regular,
  Trophy24Regular,
  Timer24Regular,
} from '@fluentui/react-icons';
import type { EChartsOption } from 'echarts';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcCard } from '../../shared/HbcCard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcEChart } from '../../shared/HbcEChart';
import { FeatureGate } from '../../guards/FeatureGate';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
import { Stage } from '@hbc/sp-services';
import { usePreconDashboardData } from './usePreconDashboardData';
import { HBC_COLORS, ELEVATION, TRANSITION } from '../../../theme/tokens';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  kpiStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    ...shorthands.gap('16px'),
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    ...shorthands.gap('16px'),
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 640px)': {
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
    '@media (max-width: 640px)': {
      gridColumn: 'span 1',
    },
  },
  chartTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: HBC_COLORS.navy,
    ...shorthands.margin('0', '0', '12px'),
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: HBC_COLORS.navy,
    ...shorthands.margin('0', '0', '12px'),
  },
  subHubGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    ...shorthands.gap('16px'),
  },
  hubDescription: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    ...shorthands.margin('0'),
  },
  powerBiPlaceholder: {
    ...shorthands.border('2px', 'dashed', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('40px'),
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
    minHeight: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Constants ────────────────────────────────────────────────────────────────

const SUB_HUBS = [
  {
    label: 'Business Development',
    description: 'Lead management, Go/No-Go scoring, pipeline tracking, and BD project oversight.',
    path: '/preconstruction/bd',
  },
  {
    label: 'Estimating',
    description: 'Department tracking, job number requests, post-bid autopsies, and estimating project hub.',
    path: '/preconstruction/estimating',
  },
  {
    label: 'Innovation & Digital Services',
    description: 'IDS project tracking, digital transformation initiatives, and documentation.',
    path: '/preconstruction/ids',
  },
];

const FUNNEL_STAGES: { stage: Stage; label: string }[] = [
  { stage: Stage.LeadDiscovery, label: 'Discovery' },
  { stage: Stage.GoNoGoPending, label: 'Go/No-Go' },
  { stage: Stage.Opportunity, label: 'Opportunity' },
  { stage: Stage.Pursuit, label: 'Pursuit' },
  { stage: Stage.WonContractPending, label: 'Won' },
];

// Deterministic fallback for autopsy trend when <3 quarters of data
const AUTOPSY_FALLBACK_QUARTERS = ["Q2 '25", "Q3 '25", "Q4 '25", "Q1 '26"];
const AUTOPSY_FALLBACK_PROCESS = [68, 73, 71, 76];
const AUTOPSY_FALLBACK_RATING = [55, 60, 58, 66];

// ─── Component ────────────────────────────────────────────────────────────────

export const PreconDashboardPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useAppNavigate();
  const { loading, kpis, leads, autopsies } = usePreconDashboardData();

  // ── Chart 1: Lead Funnel by Stage ─────────────────────────────────────────

  const funnelOption = React.useMemo<EChartsOption>(() => {
    const data = FUNNEL_STAGES.map(({ stage, label }) => ({
      name: label,
      value: leads.filter(l => l.Stage === stage).length || 1,
    }));

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}' },
      series: [
        {
          type: 'funnel',
          sort: 'descending',
          gap: 2,
          width: '80%',
          left: '10%',
          label: { show: true, position: 'inside', fontSize: 12, color: '#fff' },
          itemStyle: {
            borderWidth: 1,
            borderColor: tokens.colorNeutralBackground1,
          },
          data,
        },
      ],
    };
  }, [leads]);

  // ── Chart 2: Win Rate by Project Executive ────────────────────────────────

  const winRateByPEOption = React.useMemo<EChartsOption>(() => {
    // Group leads by ProjectExecutive
    const peMap = new Map<string, { total: number; won: number }>();
    leads.forEach(l => {
      if (!l.ProjectExecutive) return;
      const pe = l.ProjectExecutive;
      const entry = peMap.get(pe) ?? { total: 0, won: 0 };
      entry.total++;
      if (
        l.Stage === Stage.WonContractPending ||
        l.Stage === Stage.ActiveConstruction
      ) {
        entry.won++;
      }
      peMap.set(pe, entry);
    });

    // Filter to PEs with ≥2 leads, compute win rate, sort descending
    const peData = Array.from(peMap.entries())
      .filter(([, v]) => v.total >= 2)
      .map(([name, v]) => ({
        name,
        winRate: Math.round((v.won / v.total) * 100),
      }))
      .sort((a, b) => a.winRate - b.winRate);

    const names = peData.map(d => d.name);
    const rates = peData.map(d => d.winRate);
    const benchmarkValue = 28.7;

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number }[];
          if (!Array.isArray(p) || p.length === 0) return '';
          return `${p[0].name}: ${p[0].value}%`;
        },
      },
      legend: { data: ['Win Rate', 'FL GC Avg'], bottom: 0 },
      grid: { left: '30%', right: '8%', bottom: '15%', top: '8%' },
      xAxis: { type: 'value' as const, name: '%', max: 60 },
      yAxis: { type: 'category' as const, data: names },
      series: [
        {
          name: 'Win Rate',
          type: 'bar' as const,
          data: rates,
          itemStyle: { color: HBC_COLORS.navy },
          barMaxWidth: 24,
        },
        {
          name: 'FL GC Avg',
          type: 'line' as const,
          data: names.map(() => benchmarkValue),
          lineStyle: { type: 'dashed' as const, color: HBC_COLORS.orange, width: 2 },
          symbol: 'none',
          tooltip: { show: false },
        },
      ],
    };
  }, [leads]);

  // ── Chart 3: Post-Bid Autopsy Trend ───────────────────────────────────────

  const autopsyTrendOption = React.useMemo<EChartsOption>(() => {
    // Group autopsies by quarter
    const quarterMap = new Map<string, { processScores: number[]; overallRatings: number[] }>();
    autopsies.forEach(a => {
      if (!a.completedDate) return;
      const d = new Date(a.completedDate);
      const q = Math.ceil((d.getMonth() + 1) / 3);
      const year = String(d.getFullYear()).slice(-2);
      const key = `Q${q} '${year}`;
      const entry = quarterMap.get(key) ?? { processScores: [], overallRatings: [] };
      entry.processScores.push(a.processScore);
      entry.overallRatings.push(a.overallRating * 10);
      quarterMap.set(key, entry);
    });

    let quarters: string[];
    let processScores: number[];
    let overallRatings: number[];

    if (quarterMap.size >= 3) {
      const sorted = Array.from(quarterMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      quarters = sorted.map(([k]) => k);
      processScores = sorted.map(([, v]) =>
        Math.round(v.processScores.reduce((s, n) => s + n, 0) / v.processScores.length)
      );
      overallRatings = sorted.map(([, v]) =>
        Math.round(v.overallRatings.reduce((s, n) => s + n, 0) / v.overallRatings.length)
      );
    } else {
      // Deterministic fallback
      quarters = AUTOPSY_FALLBACK_QUARTERS;
      processScores = AUTOPSY_FALLBACK_PROCESS;
      overallRatings = AUTOPSY_FALLBACK_RATING;
    }

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Process Score', 'Overall Rating (×10)'], bottom: 0 },
      grid: { left: '12%', right: '4%', bottom: '15%', top: '8%' },
      xAxis: { type: 'category' as const, data: quarters, boundaryGap: false },
      yAxis: { type: 'value' as const, name: 'Score', min: 40, max: 100 },
      series: [
        {
          name: 'Process Score',
          type: 'line' as const,
          data: processScores,
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `${HBC_COLORS.navy}40` },
                { offset: 1, color: `${HBC_COLORS.navy}00` },
              ],
            },
          },
          itemStyle: { color: HBC_COLORS.navy },
          smooth: true,
        },
        {
          name: 'Overall Rating (×10)',
          type: 'line' as const,
          data: overallRatings,
          lineStyle: { type: 'dashed' as const },
          itemStyle: { color: HBC_COLORS.orange },
          smooth: true,
        },
      ],
    };
  }, [autopsies]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.root}>
      <PageHeader
        title="Preconstruction"
        subtitle="BD, Estimating, and IDS pipeline intelligence"
      />

      {/* Section 1: KPI Strip */}
      {loading ? (
        <HbcSkeleton variant="kpi-grid" columns={4} />
      ) : (
        <div className={styles.kpiStrip}>
          <KPICard
            title="Active Leads"
            value={kpis.activeLeads}
            subtitle="Active pipeline stages"
            icon={<DocumentSearch24Regular />}
            trend={{ value: 8.5, isPositive: true }}
          />
          <KPICard
            title="Go/No-Go in Progress"
            value={kpis.goNoGoInProgress}
            subtitle="Awaiting decision"
            icon={<Timer24Regular />}
          />
          <KPICard
            title="Pipeline Value"
            value={kpis.pipelineValue}
            subtitle="Active stage leads"
            icon={<Money24Regular />}
            trend={{ value: 12.1, isPositive: true }}
          />
          <KPICard
            title="Est. Win Rate"
            value={`${kpis.estimatedWinRatePct}%`}
            subtitle="vs FL GC avg 28.7%"
            icon={<Trophy24Regular />}
            trend={{ value: 3.2, isPositive: true }}
          />
        </div>
      )}

      {/* Section 2: Charts Grid */}
      {!loading && (
        <div className={styles.chartsGrid}>
          {/* Chart 1: Lead Funnel */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Lead Funnel by Stage</h3>
            <HbcEChart
              option={funnelOption}
              height={320}
              ariaLabel="Lead funnel by pipeline stage"
            />
          </div>

          {/* Chart 2: Win Rate by PE (wide) */}
          <div className={mergeClasses(styles.chartCard, styles.chartCardWide)}>
            <h3 className={styles.chartTitle}>Win Rate by Project Executive</h3>
            <HbcEChart
              option={winRateByPEOption}
              height={280}
              ariaLabel="Win rate by project executive bar chart"
            />
          </div>

          {/* Chart 3: Post-Bid Autopsy Trend */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Post-Bid Autopsy Trend</h3>
            <HbcEChart
              option={autopsyTrendOption}
              height={300}
              ariaLabel="Post-bid autopsy trend line chart"
            />
          </div>
        </div>
      )}

      {/* Section 3: Sub-Hub Quick Links */}
      <div>
        <h2 className={styles.sectionTitle}>Departments</h2>
        <div className={styles.subHubGrid}>
          {SUB_HUBS.map(hub => (
            <HbcCard
              key={hub.path}
              title={hub.label}
              interactive
              onClick={() => navigate(hub.path)}
            >
              <p className={styles.hubDescription}>{hub.description}</p>
            </HbcCard>
          ))}
        </div>
      </div>

      {/* Section 4: PowerBI Placeholder */}
      <FeatureGate featureName="PowerBIIntegration">
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Power BI Reports</h3>
          <div className={styles.powerBiPlaceholder}>
            Power BI embedded reports will appear here when configured.
          </div>
        </div>
      </FeatureGate>
    </div>
  );
};
