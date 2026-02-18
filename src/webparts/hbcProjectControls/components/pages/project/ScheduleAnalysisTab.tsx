import * as React from 'react';
import type { EChartsOption } from 'echarts';
import { IScheduleActivity, IScheduleMetrics } from '@hbc/sp-services';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';
import { ExportButtons } from '../../shared/ExportButtons';
import { HbcEChart } from '../../shared/HbcEChart';

interface IScheduleAnalysisTabProps {
  activities: IScheduleActivity[];
  metrics: IScheduleMetrics;
  projectCode: string;
}

const CHART_COLORS = [HBC_COLORS.navy, HBC_COLORS.orange, HBC_COLORS.info, HBC_COLORS.success, HBC_COLORS.warning, HBC_COLORS.error];
const FLOAT_COLORS: Record<string, string> = {
  negative: HBC_COLORS.error,
  zero: HBC_COLORS.warning,
  low: '#D97706',
  medium: HBC_COLORS.info,
  high: HBC_COLORS.success,
};

export const ScheduleAnalysisTab: React.FC<IScheduleAnalysisTabProps> = ({ activities, metrics, projectCode }) => {
  if (activities.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: HBC_COLORS.gray400 }}>
        No schedule data available for analysis. Import a schedule to see charts.
      </div>
    );
  }

  return (
    <>
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
      <ExportButtons
        pdfElementId="schedule-analysis-charts"
        filename={`schedule-analysis-${projectCode}`}
        title="Schedule Analysis"
      />
    </div>
    <div id="schedule-analysis-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 16 }}>
      <VarianceChart activities={activities} />
      <FloatDistributionChart metrics={metrics} />
      <SensitivityChart activities={activities} />
      <ScheduleHealthChart metrics={metrics} />
      <LogicMetricsChart metrics={metrics} />
      <ConstraintChart metrics={metrics} />
      <StatusBreakdownChart metrics={metrics} />
      <EarnedValueChart metrics={metrics} />
    </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// 1. Variance Analysis — Scatter
// ---------------------------------------------------------------------------
const VarianceChart: React.FC<{ activities: IScheduleActivity[] }> = ({ activities }) => {
  const scatterData = React.useMemo(() =>
    activities
      .filter(a => a.startVarianceDays !== null && a.finishVarianceDays !== null)
      .map(a => ({
        name: a.taskCode,
        startVar: a.startVarianceDays ?? 0,
        finishVar: a.finishVarianceDays ?? 0,
      })),
  [activities]);

  const option = React.useMemo<EChartsOption>(() => ({
    grid: { top: 10, right: 20, bottom: 10, left: 0, containLabel: true },
    tooltip: {
      trigger: 'item',
      formatter: (p: unknown) => {
        const params = p as { name: string; value: [number, number] };
        return `<div style="font-size:12px;font-family:'Segoe UI',sans-serif;padding:4px 0"><b>${params.name}</b><br/>Start: ${params.value[0]}d<br/>Finish: ${params.value[1]}d</div>`;
      },
      extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;`,
    },
    xAxis: { type: 'value', name: 'Start Variance (d)', nameLocation: 'end', axisLabel: { fontSize: 11, formatter: (v: number) => `${v}d` }, splitLine: { lineStyle: { color: HBC_COLORS.gray200, type: 'dashed' } }, axisLine: { show: false }, axisTick: { show: false } },
    yAxis: { type: 'value', name: 'Finish Variance (d)', axisLabel: { fontSize: 11, formatter: (v: number) => `${v}d` }, splitLine: { lineStyle: { color: HBC_COLORS.gray100, type: 'dashed' } }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'scatter',
      symbolSize: 8,
      data: scatterData.map(d => ({
        name: d.name,
        value: [d.startVar, d.finishVar] as [number, number],
        itemStyle: {
          color: d.startVar > 5 || d.finishVar > 5
            ? HBC_COLORS.error
            : d.startVar > 0 || d.finishVar > 0
              ? HBC_COLORS.warning
              : HBC_COLORS.success,
        },
      })),
    }],
  }), [scatterData]);

  return (
    <ChartCard title="Variance Analysis" subtitle="Start vs Finish variance (days)">
      <HbcEChart option={option} height={300} empty={scatterData.length === 0} ariaLabel="Variance analysis scatter chart" />
    </ChartCard>
  );
};

// ---------------------------------------------------------------------------
// 2. Float Distribution — Bar
// ---------------------------------------------------------------------------
const FloatDistributionChart: React.FC<{ metrics: IScheduleMetrics }> = ({ metrics }) => {
  const floatData = [
    { name: 'Negative', value: metrics.floatDistribution.negative, color: FLOAT_COLORS.negative },
    { name: 'Zero', value: metrics.floatDistribution.zero, color: FLOAT_COLORS.zero },
    { name: 'Low (1-10d)', value: metrics.floatDistribution.low, color: FLOAT_COLORS.low },
    { name: 'Med (11-30d)', value: metrics.floatDistribution.medium, color: FLOAT_COLORS.medium },
    { name: 'High (30d+)', value: metrics.floatDistribution.high, color: FLOAT_COLORS.high },
  ];

  const option = React.useMemo<EChartsOption>(() => ({
    grid: { top: 10, right: 20, bottom: 10, left: 0, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;` },
    xAxis: { type: 'category', data: floatData.map(d => d.name), axisLabel: { fontSize: 11, color: HBC_COLORS.gray500 }, axisLine: { lineStyle: { color: HBC_COLORS.gray200 } }, axisTick: { show: false } },
    yAxis: { type: 'value', axisLabel: { fontSize: 11, color: HBC_COLORS.gray500 }, splitLine: { lineStyle: { color: HBC_COLORS.gray100, type: 'dashed' } }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'bar',
      name: 'Activities',
      data: floatData.map(d => ({ value: d.value, itemStyle: { color: d.color, borderRadius: [4, 4, 0, 0] } })),
      barMaxWidth: 60,
    }],
  }), [floatData]);

  return (
    <ChartCard title="Float Distribution" subtitle="Activity count by float range">
      <HbcEChart option={option} height={300} ariaLabel="Float distribution bar chart" />
    </ChartCard>
  );
};

// ---------------------------------------------------------------------------
// 3. Sensitivity / Near-Critical — Horizontal Bar
// ---------------------------------------------------------------------------
const SensitivityChart: React.FC<{ activities: IScheduleActivity[] }> = ({ activities }) => {
  const nearCritical = React.useMemo(() =>
    activities
      .filter(a => a.remainingFloat !== null && a.remainingFloat >= 0 && a.remainingFloat <= 10)
      .sort((a, b) => (a.remainingFloat ?? 0) - (b.remainingFloat ?? 0))
      .slice(0, 20)
      .map(a => ({
        name: a.taskCode.length > 16 ? `${a.taskCode.substring(0, 14)}..` : a.taskCode,
        float: a.remainingFloat ?? 0,
      })),
  [activities]);

  const option = React.useMemo<EChartsOption>(() => ({
    grid: { top: 10, right: 20, bottom: 10, left: 80, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;` },
    xAxis: { type: 'value', axisLabel: { fontSize: 11, formatter: (v: number) => `${v}d`, color: HBC_COLORS.gray500 }, splitLine: { lineStyle: { color: HBC_COLORS.gray100, type: 'dashed' } }, axisLine: { show: false }, axisTick: { show: false } },
    yAxis: { type: 'category', data: nearCritical.map(d => d.name), axisLabel: { fontSize: 10, color: HBC_COLORS.gray600 }, axisLine: { lineStyle: { color: HBC_COLORS.gray200 } }, axisTick: { show: false } },
    series: [{
      type: 'bar',
      name: 'Float (days)',
      data: nearCritical.map(d => ({
        value: d.float,
        itemStyle: { color: d.float === 0 ? HBC_COLORS.error : d.float <= 5 ? HBC_COLORS.warning : '#D97706', borderRadius: [0, 4, 4, 0] },
      })),
      barMaxWidth: 30,
    }],
  }), [nearCritical]);

  if (nearCritical.length === 0) {
    return <ChartCard title="Near-Critical Activities" subtitle="Activities with 0-10 days float"><EmptyChart /></ChartCard>;
  }

  return (
    <ChartCard title="Near-Critical Activities" subtitle="Activities with 0-10 days float">
      <HbcEChart option={option} height={300} ariaLabel="Near-critical activities horizontal bar chart" />
    </ChartCard>
  );
};

// ---------------------------------------------------------------------------
// 4. Schedule Health — Radar
// ECharts radar uses indicator array + value array (differs from Recharts' data-driven pattern)
// ---------------------------------------------------------------------------
const ScheduleHealthChart: React.FC<{ metrics: IScheduleMetrics }> = ({ metrics }) => {
  const { earnedValueMetrics: ev, logicMetrics: lm } = metrics;

  const pctComplete = Math.min(100, metrics.percentComplete);
  const spiScore = ev.spi !== null ? Math.min(100, Math.round(ev.spi * 100)) : 50;
  const floatHealth = metrics.totalActivities > 0
    ? Math.round(((metrics.totalActivities - metrics.negativeFloatCount) / metrics.totalActivities) * 100)
    : 100;
  const logicQuality = metrics.totalActivities > 0
    ? Math.round(((metrics.totalActivities - lm.openEnds.noSuccessor - lm.openEnds.noPredecessor) / metrics.totalActivities) * 100)
    : 100;
  const criticalRatio = metrics.totalActivities > 0
    ? Math.round(((metrics.totalActivities - metrics.criticalActivityCount) / metrics.totalActivities) * 100)
    : 100;

  const dimensions = ['% Complete', 'SPI', 'Float Health', 'Logic Quality', 'Critical Ratio'];
  const values = [
    Math.max(0, pctComplete),
    Math.max(0, spiScore),
    Math.max(0, floatHealth),
    Math.max(0, Math.min(100, logicQuality)),
    Math.max(0, criticalRatio),
  ];

  const option = React.useMemo<EChartsOption>(() => ({
    radar: {
      indicator: dimensions.map(name => ({ name, max: 100 })),
      axisLine: { lineStyle: { color: HBC_COLORS.gray200 } },
      splitLine: { lineStyle: { color: HBC_COLORS.gray100 } },
      splitArea: { areaStyle: { color: [HBC_COLORS.gray50, HBC_COLORS.white] } },
      axisName: { color: HBC_COLORS.gray600, fontSize: 11 },
    },
    tooltip: { extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;` },
    series: [{
      type: 'radar',
      data: [{
        value: values,
        name: 'Health Score',
        lineStyle: { color: HBC_COLORS.navy, width: 2 },
        itemStyle: { color: HBC_COLORS.navy },
        areaStyle: { color: `${HBC_COLORS.navy}40` },
      }],
    }],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [metrics]);

  return (
    <ChartCard title="Schedule Health" subtitle="Multi-dimensional health score (0-100)">
      <HbcEChart option={option} height={300} ariaLabel="Schedule health radar chart" />
    </ChartCard>
  );
};

// ---------------------------------------------------------------------------
// 5. Logic Metrics — Pie
// ---------------------------------------------------------------------------
const LogicMetricsChart: React.FC<{ metrics: IScheduleMetrics }> = ({ metrics }) => {
  const logicData = Object.entries(metrics.logicMetrics.relationshipTypes)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({ name: type, value: count }));

  const option = React.useMemo<EChartsOption>(() => ({
    tooltip: { trigger: 'item', formatter: (p: unknown) => {
      const params = p as { name: string; value: number; percent: number; marker: string };
      return `<div style="font-family:'Segoe UI',sans-serif;padding:4px 0"><div style="font-size:13px;font-weight:600;color:${HBC_COLORS.navy}">${params.marker}${params.name}: ${params.value} (${params.percent}%)</div></div>`;
    }, extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;` },
    legend: { bottom: 0, textStyle: { fontSize: 11, color: HBC_COLORS.gray600 } },
    series: [{
      type: 'pie',
      radius: '65%',
      center: ['50%', '45%'],
      label: { formatter: (p: unknown) => { const pi = p as { name: string; percent: number }; return `${pi.name} ${(pi.percent * 100).toFixed(0)}%`; }, fontSize: 11 },
      data: logicData.map((d, i) => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length], borderWidth: 2, borderColor: '#fff' },
      })),
    }],
  }), [logicData]);

  if (logicData.length === 0) {
    return <ChartCard title="Relationship Types" subtitle="Logic tie distribution"><EmptyChart /></ChartCard>;
  }

  return (
    <ChartCard title="Relationship Types" subtitle="Logic tie distribution">
      <HbcEChart option={option} height={300} ariaLabel="Relationship type distribution pie chart" />
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: HBC_COLORS.gray500, marginTop: 8 }}>
        <span>Total: {metrics.logicMetrics.totalRelationships}</span>
        <span>Avg Pred: {metrics.logicMetrics.avgPredecessors}</span>
        <span>Avg Succ: {metrics.logicMetrics.avgSuccessors}</span>
        <span>Open Ends: {metrics.logicMetrics.openEnds.noPredecessor + metrics.logicMetrics.openEnds.noSuccessor}</span>
      </div>
    </ChartCard>
  );
};

// ---------------------------------------------------------------------------
// 6. Constraint Analysis — Horizontal Bar
// ---------------------------------------------------------------------------
const ConstraintChart: React.FC<{ metrics: IScheduleMetrics }> = ({ metrics }) => {
  const constraintData = Object.entries(metrics.constraintAnalysis.byType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([type, count]) => ({
      name: type.length > 22 ? `${type.substring(0, 20)}..` : type,
      count,
    }));

  const option = React.useMemo<EChartsOption>(() => ({
    grid: { top: 10, right: 20, bottom: 10, left: 120, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;` },
    xAxis: { type: 'value', axisLabel: { fontSize: 11, color: HBC_COLORS.gray500 }, splitLine: { lineStyle: { color: HBC_COLORS.gray100, type: 'dashed' } }, axisLine: { show: false }, axisTick: { show: false } },
    yAxis: { type: 'category', data: constraintData.map(d => d.name), axisLabel: { fontSize: 10, color: HBC_COLORS.gray600 }, axisLine: { lineStyle: { color: HBC_COLORS.gray200 } }, axisTick: { show: false } },
    series: [{
      type: 'bar',
      name: 'Activities',
      data: constraintData.map(d => ({ value: d.count, itemStyle: { color: HBC_COLORS.orange, borderRadius: [0, 4, 4, 0] } })),
      barMaxWidth: 30,
    }],
  }), [constraintData]);

  if (constraintData.length === 0) {
    return <ChartCard title="Constraint Analysis" subtitle="Constraint types applied"><EmptyChart message="No constraints found" /></ChartCard>;
  }

  return (
    <ChartCard title="Constraint Analysis" subtitle={`${metrics.constraintAnalysis.totalConstrained} constrained activities`}>
      <HbcEChart option={option} height={300} ariaLabel="Constraint analysis horizontal bar chart" />
    </ChartCard>
  );
};

// ---------------------------------------------------------------------------
// 7. Status Breakdown — Donut
// ---------------------------------------------------------------------------
const StatusBreakdownChart: React.FC<{ metrics: IScheduleMetrics }> = ({ metrics }) => {
  const statusData = [
    { name: 'Completed', value: metrics.completedCount, color: HBC_COLORS.success },
    { name: 'In Progress', value: metrics.inProgressCount, color: HBC_COLORS.warning },
    { name: 'Not Started', value: metrics.notStartedCount, color: HBC_COLORS.gray400 },
  ].filter(d => d.value > 0);

  const option = React.useMemo<EChartsOption>(() => ({
    tooltip: { trigger: 'item', formatter: (p: unknown) => {
      const params = p as { name: string; value: number; percent: number; marker: string };
      return `<div style="font-family:'Segoe UI',sans-serif;padding:4px 0"><div style="font-size:13px;font-weight:600;color:${HBC_COLORS.navy}">${params.marker}${params.name}: ${params.value} (${params.percent}%)</div></div>`;
    }, extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;` },
    legend: { bottom: 0, textStyle: { fontSize: 11, color: HBC_COLORS.gray600 } },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      label: { formatter: (p: unknown) => { const pi = p as { name: string; value: number }; return `${pi.name}: ${pi.value}`; }, fontSize: 11 },
      data: statusData.map(d => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: d.color, borderWidth: 2, borderColor: '#fff' },
      })),
    }],
  }), [statusData]);

  return (
    <ChartCard title="Status Breakdown" subtitle={`${metrics.totalActivities} total activities`}>
      <HbcEChart option={option} height={300} empty={statusData.length === 0} ariaLabel="Activity status breakdown donut chart" />
    </ChartCard>
  );
};

// ---------------------------------------------------------------------------
// 8. Earned Value — Line chart with labeled points
// ---------------------------------------------------------------------------
const EarnedValueChart: React.FC<{ metrics: IScheduleMetrics }> = ({ metrics }) => {
  const { earnedValueMetrics: ev } = metrics;

  const evCategories = ['PV', 'EV', 'AC', 'BAC'];
  const evValues = [ev.pv, ev.ev, ev.actualDuration, ev.bac];
  const evColors = [HBC_COLORS.info, HBC_COLORS.success, HBC_COLORS.error, HBC_COLORS.navy];

  const option = React.useMemo<EChartsOption>(() => ({
    grid: { top: 10, right: 20, bottom: 10, left: 0, containLabel: true },
    tooltip: { trigger: 'axis', formatter: (p: unknown) => {
      const params = p as Array<{ name: string; value: number; marker: string }>;
      return `<div style="font-family:'Segoe UI',sans-serif;padding:4px 0"><div style="font-size:11px;color:${HBC_COLORS.gray500};margin-bottom:4px">${params[0].name}</div><div style="font-size:13px;font-weight:600;color:${HBC_COLORS.navy}">${params[0].marker}${params[0].value}d</div></div>`;
    }, extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;` },
    xAxis: { type: 'category', data: evCategories, axisLabel: { fontSize: 12, fontWeight: 600, color: HBC_COLORS.gray700 }, axisLine: { lineStyle: { color: HBC_COLORS.gray200 } }, axisTick: { show: false } },
    yAxis: { type: 'value', axisLabel: { fontSize: 11, formatter: (v: number) => `${v}d`, color: HBC_COLORS.gray500 }, splitLine: { lineStyle: { color: HBC_COLORS.gray100, type: 'dashed' } }, axisLine: { show: false }, axisTick: { show: false } },
    series: [
      {
        type: 'line',
        name: 'Earned Value',
        data: evValues.map((v, i) => ({
          value: v,
          label: { show: true, formatter: `${v}d`, fontSize: 11, color: evColors[i] },
          itemStyle: { color: evColors[i] },
        })),
        lineStyle: { color: HBC_COLORS.navy, width: 2 },
        symbol: 'circle',
        symbolSize: 8,
        areaStyle: { color: `${HBC_COLORS.info}20` },
      },
    ],
  }), [ev]);

  return (
    <ChartCard title="Earned Value" subtitle={`SV: ${ev.sv >= 0 ? '+' : ''}${ev.sv}d | SPI: ${ev.spi ?? 'N/A'} | CPI: ${ev.cpi ?? 'N/A'}`}>
      <HbcEChart option={option} height={300} ariaLabel="Earned value metrics line chart" />
    </ChartCard>
  );
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const ChartCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div style={cardStyle} role="img" aria-label={`${title}${subtitle ? `: ${subtitle}` : ''}`}>
    <div style={{ fontSize: 14, fontWeight: 600, color: HBC_COLORS.navy, marginBottom: 2 }}>{title}</div>
    {subtitle && <div style={{ fontSize: 11, color: HBC_COLORS.gray400, marginBottom: 12 }}>{subtitle}</div>}
    {children}
  </div>
);

const EmptyChart: React.FC<{ message?: string }> = ({ message }) => (
  <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: HBC_COLORS.gray400, fontSize: 13 }}>
    {message || 'No data available'}
  </div>
);

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  border: `1px solid ${HBC_COLORS.gray200}`,
  padding: 20,
  boxShadow: ELEVATION.level1,
};
