/**
 * EstimatingDashboardPage — Estimating Department Dashboard.
 *
 * Route: /preconstruction/estimating — 5 KPI cards, 3 interactive ECharts
 * (award status donut, estimates by source, estimator workload), and PowerBI
 * placeholder behind feature flag.
 */
import * as React from 'react';
import { makeStyles, shorthands, tokens, mergeClasses } from '@fluentui/react-components';
import {
  DocumentSearch24Regular,
  Money24Regular,
  Timer24Regular,
  Building24Regular,
  Search24Regular,
} from '@fluentui/react-icons';
import type { EChartsOption } from 'echarts';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcEChart } from '../../shared/HbcEChart';
import { FeatureGate } from '../../guards/FeatureGate';
import { AwardStatus } from '@hbc/sp-services';
import { useEstimatingDashboardData } from './useEstimatingDashboardData';
import { HBC_COLORS, ELEVATION, TRANSITION } from '../../../theme/tokens';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  kpiStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    ...shorthands.gap('16px'),
    '@media (max-width: 1024px)': {
      gridTemplateColumns: 'repeat(3, 1fr)',
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

const AWARD_STATUS_COLORS: Record<string, string> = {
  [AwardStatus.Pending]: HBC_COLORS.info,
  [AwardStatus.AwardedWithPrecon]: HBC_COLORS.success,
  [AwardStatus.AwardedWithoutPrecon]: HBC_COLORS.warning,
  [AwardStatus.NotAwarded]: HBC_COLORS.error,
};

const AWARD_STATUS_LABELS: Record<string, string> = {
  [AwardStatus.Pending]: 'Pending',
  [AwardStatus.AwardedWithPrecon]: 'Awarded w/ Precon',
  [AwardStatus.AwardedWithoutPrecon]: 'Awarded w/o Precon',
  [AwardStatus.NotAwarded]: 'Not Awarded',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const EstimatingDashboardPage: React.FC = () => {
  const styles = useStyles();
  const { loading, kpis, allRecords, currentPursuits } = useEstimatingDashboardData();

  // ── Chart 1: Award Status Distribution (Donut) ────────────────────────────

  const awardStatusOption = React.useMemo<EChartsOption>(() => {
    // Group records with AwardStatus by status
    const statusMap = new Map<string, number>();
    allRecords.forEach(r => {
      if (!r.AwardStatus) return;
      statusMap.set(r.AwardStatus, (statusMap.get(r.AwardStatus) ?? 0) + 1);
    });

    const data = Array.from(statusMap.entries()).map(([status, count]) => ({
      name: AWARD_STATUS_LABELS[status] ?? status,
      value: count,
      itemStyle: { color: AWARD_STATUS_COLORS[status] ?? tokens.colorNeutralForeground3 },
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: { bottom: 0, type: 'scroll' as const },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          data,
          label: {
            formatter: '{b}: {d}%',
            fontSize: 11,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
          },
        },
      ],
    };
  }, [allRecords]);

  // ── Chart 2: Estimates by Source (Bar) ─────────────────────────────────────

  const sourceOption = React.useMemo<EChartsOption>(() => {
    const sourceMap = new Map<string, number>();
    allRecords.forEach(r => {
      const src = r.Source ?? 'Other';
      sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1);
    });

    const sorted = Array.from(sourceMap.entries())
      .sort((a, b) => b[1] - a[1]);
    const sourceNames = sorted.map(([name]) => name);
    const counts = sorted.map(([, count]) => count);

    return {
      tooltip: { trigger: 'axis' as const },
      grid: { left: '8%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: sourceNames,
        axisLabel: { fontSize: 11 },
      },
      yAxis: { type: 'value' as const, name: 'Count' },
      series: [
        {
          type: 'bar' as const,
          data: counts,
          itemStyle: { color: HBC_COLORS.navy },
          barMaxWidth: 40,
        },
      ],
    };
  }, [allRecords]);

  // ── Chart 3: Estimator Workload (Grouped Bar) ─────────────────────────────

  const workloadOption = React.useMemo<EChartsOption>(() => {
    // Build estimator → {active, submitted} map
    const estimatorMap = new Map<string, { active: number; submitted: number }>();

    currentPursuits.forEach(r => {
      if (!r.LeadEstimator) return;
      const entry = estimatorMap.get(r.LeadEstimator) ?? { active: 0, submitted: 0 };
      entry.active++;
      estimatorMap.set(r.LeadEstimator, entry);
    });

    allRecords.forEach(r => {
      if (!r.LeadEstimator || !r.SubmittedDate) return;
      const entry = estimatorMap.get(r.LeadEstimator) ?? { active: 0, submitted: 0 };
      entry.submitted++;
      estimatorMap.set(r.LeadEstimator, entry);
    });

    // Sort by total workload descending
    const sorted = Array.from(estimatorMap.entries())
      .sort((a, b) => (b[1].active + b[1].submitted) - (a[1].active + a[1].submitted));

    const names = sorted.map(([name]) => name);
    const activeCounts = sorted.map(([, v]) => v.active);
    const submittedCounts = sorted.map(([, v]) => v.submitted);

    return {
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      legend: { data: ['Active Pursuits', 'Submitted'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: names,
        axisLabel: { fontSize: 11 },
      },
      yAxis: { type: 'value' as const, name: 'Count' },
      series: [
        {
          name: 'Active Pursuits',
          type: 'bar' as const,
          data: activeCounts,
          itemStyle: { color: HBC_COLORS.navy },
        },
        {
          name: 'Submitted',
          type: 'bar' as const,
          data: submittedCounts,
          itemStyle: { color: HBC_COLORS.orange },
        },
      ],
    };
  }, [allRecords, currentPursuits]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.root}>
      <PageHeader
        title="Estimating Dashboard"
        subtitle="Estimate tracking, pursuits, and workload analytics"
      />

      {/* Section 1: KPI Strip */}
      {loading ? (
        <HbcSkeleton variant="kpi-grid" columns={5} />
      ) : (
        <div className={styles.kpiStrip}>
          <KPICard
            title="Total Estimates"
            value={kpis.totalEstimates}
            subtitle="All time"
            icon={<DocumentSearch24Regular />}
          />
          <KPICard
            title="Active Pursuits"
            value={kpis.activePursuits}
            subtitle="Pending submission"
            icon={<Timer24Regular />}
            trend={{ value: 5.2, isPositive: true }}
          />
          <KPICard
            title="Submitted"
            value={kpis.submittedEstimates}
            subtitle="With submission date"
            icon={<Search24Regular />}
          />
          <KPICard
            title="Pursuit Pipeline"
            value={kpis.totalPipelineValue}
            subtitle="Active pursuit value"
            icon={<Money24Regular />}
            trend={{ value: 14.8, isPositive: true }}
          />
          <KPICard
            title="Precon Engagements"
            value={kpis.preconEngagements}
            subtitle="Active precon fee"
            icon={<Building24Regular />}
          />
        </div>
      )}

      {/* Section 2: Charts Grid */}
      {!loading && (
        <div className={styles.chartsGrid}>
          {/* Chart 1: Award Status Distribution */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Award Status Distribution</h3>
            <HbcEChart
              option={awardStatusOption}
              height={300}
              ariaLabel="Award status distribution donut chart"
            />
          </div>

          {/* Chart 2: Estimates by Source */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Estimates by Source</h3>
            <HbcEChart
              option={sourceOption}
              height={280}
              ariaLabel="Estimates by source bar chart"
            />
          </div>

          {/* Chart 3: Estimator Workload (wide) */}
          <div className={mergeClasses(styles.chartCard, styles.chartCardWide)}>
            <h3 className={styles.chartTitle}>Estimator Workload</h3>
            <HbcEChart
              option={workloadOption}
              height={300}
              ariaLabel="Estimator workload bar chart"
            />
          </div>
        </div>
      )}

      {/* Stage 3 (sub-task 5): Recent Activity feed */}
      {!loading && currentPursuits.length > 0 && (
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Recent Activity</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {currentPursuits.slice(0, 5).map((pursuit, idx) => (
              <div key={pursuit.id ?? idx} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: idx < 4 ? `1px solid ${tokens.colorNeutralStroke2}` : 'none',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{pursuit.Title ?? 'Untitled Pursuit'}</div>
                  <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
                    {pursuit.LeadEstimator ?? 'Unassigned'} &middot; {pursuit.Source ?? 'Unknown'}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground4, whiteSpace: 'nowrap' }}>
                  {pursuit.AwardStatus ?? 'Pending'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: PowerBI Placeholder */}
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
