import * as React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
  ScatterChart, Scatter, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Line, Area,
} from 'recharts';
import { IScheduleActivity, IScheduleMetrics } from '@hbc/sp-services';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';
import { ExportButtons } from '../../shared/ExportButtons';

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
  const data = React.useMemo(() =>
    activities
      .filter(a => a.startVarianceDays !== null && a.finishVarianceDays !== null)
      .map(a => ({
        name: a.taskCode,
        startVar: a.startVarianceDays,
        finishVar: a.finishVarianceDays,
      })),
  [activities]);

  return (
    <ChartCard title="Variance Analysis" subtitle="Start vs Finish variance (days)">
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={HBC_COLORS.gray200} />
          <XAxis type="number" dataKey="startVar" name="Start Variance" unit="d" tick={{ fontSize: 11 }} />
          <YAxis type="number" dataKey="finishVar" name="Finish Variance" unit="d" tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number, name: string) => [`${value}d`, name]}
            contentStyle={{ fontSize: 12 }}
          />
          <Scatter data={data} fill={HBC_COLORS.info}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  (entry.startVar ?? 0) > 5 || (entry.finishVar ?? 0) > 5
                    ? HBC_COLORS.error
                    : (entry.startVar ?? 0) > 0 || (entry.finishVar ?? 0) > 0
                      ? HBC_COLORS.warning
                      : HBC_COLORS.success
                }
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// ---------------------------------------------------------------------------
// 2. Float Distribution — Bar
// ---------------------------------------------------------------------------
const FloatDistributionChart: React.FC<{ metrics: IScheduleMetrics }> = ({ metrics }) => {
  const data = [
    { name: 'Negative', value: metrics.floatDistribution.negative, color: FLOAT_COLORS.negative },
    { name: 'Zero', value: metrics.floatDistribution.zero, color: FLOAT_COLORS.zero },
    { name: 'Low (1-10d)', value: metrics.floatDistribution.low, color: FLOAT_COLORS.low },
    { name: 'Med (11-30d)', value: metrics.floatDistribution.medium, color: FLOAT_COLORS.medium },
    { name: 'High (30d+)', value: metrics.floatDistribution.high, color: FLOAT_COLORS.high },
  ];

  return (
    <ChartCard title="Float Distribution" subtitle="Activity count by float range">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={HBC_COLORS.gray200} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="value" name="Activities" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// ---------------------------------------------------------------------------
// 3. Sensitivity / Near-Critical — Horizontal Bar
// ---------------------------------------------------------------------------
const SensitivityChart: React.FC<{ activities: IScheduleActivity[] }> = ({ activities }) => {
  const data = React.useMemo(() =>
    activities
      .filter(a => a.remainingFloat !== null && a.remainingFloat >= 0 && a.remainingFloat <= 10)
      .sort((a, b) => (a.remainingFloat ?? 0) - (b.remainingFloat ?? 0))
      .slice(0, 20)
      .map(a => ({
        name: a.taskCode.length > 16 ? `${a.taskCode.substring(0, 14)}..` : a.taskCode,
        float: a.remainingFloat ?? 0,
      })),
  [activities]);

  if (data.length === 0) {
    return <ChartCard title="Near-Critical Activities" subtitle="Activities with 0-10 days float"><EmptyChart /></ChartCard>;
  }

  return (
    <ChartCard title="Near-Critical Activities" subtitle="Activities with 0-10 days float">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={HBC_COLORS.gray200} />
          <XAxis type="number" tick={{ fontSize: 11 }} unit="d" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={75} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="float" name="Float (days)" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.float === 0 ? HBC_COLORS.error : entry.float <= 5 ? HBC_COLORS.warning : '#D97706'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// ---------------------------------------------------------------------------
// 4. Schedule Health — Radar
// ---------------------------------------------------------------------------
const ScheduleHealthChart: React.FC<{ metrics: IScheduleMetrics }> = ({ metrics }) => {
  const { earnedValueMetrics: ev, logicMetrics: lm } = metrics;

  // Normalize each dimension to 0-100 scale
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

  const data = [
    { dimension: '% Complete', score: Math.max(0, pctComplete) },
    { dimension: 'SPI', score: Math.max(0, spiScore) },
    { dimension: 'Float Health', score: Math.max(0, floatHealth) },
    { dimension: 'Logic Quality', score: Math.max(0, Math.min(100, logicQuality)) },
    { dimension: 'Critical Ratio', score: Math.max(0, criticalRatio) },
  ];

  return (
    <ChartCard title="Schedule Health" subtitle="Multi-dimensional health score (0-100)">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} outerRadius={100}>
          <PolarGrid stroke={HBC_COLORS.gray200} />
          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: HBC_COLORS.gray600 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Radar dataKey="score" stroke={HBC_COLORS.navy} fill={HBC_COLORS.navy} fillOpacity={0.25} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// ---------------------------------------------------------------------------
// 5. Logic Metrics — Pie
// ---------------------------------------------------------------------------
const LogicMetricsChart: React.FC<{ metrics: IScheduleMetrics }> = ({ metrics }) => {
  const data = Object.entries(metrics.logicMetrics.relationshipTypes)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({ name: type, value: count }));

  if (data.length === 0) {
    return <ChartCard title="Relationship Types" subtitle="Logic tie distribution"><EmptyChart /></ChartCard>;
  }

  return (
    <ChartCard title="Relationship Types" subtitle="Logic tie distribution">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
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
  const data = Object.entries(metrics.constraintAnalysis.byType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([type, count]) => ({
      name: type.length > 22 ? `${type.substring(0, 20)}..` : type,
      count,
    }));

  if (data.length === 0) {
    return <ChartCard title="Constraint Analysis" subtitle="Constraint types applied"><EmptyChart message="No constraints found" /></ChartCard>;
  }

  return (
    <ChartCard title="Constraint Analysis" subtitle={`${metrics.constraintAnalysis.totalConstrained} constrained activities`}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 120 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={HBC_COLORS.gray200} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={115} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="count" name="Activities" fill={HBC_COLORS.orange} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// ---------------------------------------------------------------------------
// 7. Status Breakdown — Donut
// ---------------------------------------------------------------------------
const StatusBreakdownChart: React.FC<{ metrics: IScheduleMetrics }> = ({ metrics }) => {
  const data = [
    { name: 'Completed', value: metrics.completedCount, color: HBC_COLORS.success },
    { name: 'In Progress', value: metrics.inProgressCount, color: HBC_COLORS.warning },
    { name: 'Not Started', value: metrics.notStartedCount, color: HBC_COLORS.gray400 },
  ].filter(d => d.value > 0);

  return (
    <ChartCard title="Status Breakdown" subtitle={`${metrics.totalActivities} total activities`}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

// ---------------------------------------------------------------------------
// 8. Earned Value — Combo
// ---------------------------------------------------------------------------
const EarnedValueChart: React.FC<{ metrics: IScheduleMetrics }> = ({ metrics }) => {
  const { earnedValueMetrics: ev } = metrics;

  // Display as simple bar comparison if no time series available
  const data = [
    { name: 'PV', value: ev.pv, color: HBC_COLORS.info },
    { name: 'EV', value: ev.ev, color: HBC_COLORS.success },
    { name: 'AC', value: ev.actualDuration, color: HBC_COLORS.error },
    { name: 'BAC', value: ev.bac, color: HBC_COLORS.navy },
  ];

  return (
    <ChartCard title="Earned Value" subtitle={`SV: ${ev.sv >= 0 ? '+' : ''}${ev.sv}d | SPI: ${ev.spi ?? 'N/A'} | CPI: ${ev.cpi ?? 'N/A'}`}>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={HBC_COLORS.gray200} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
          <YAxis tick={{ fontSize: 11 }} unit="d" />
          <Tooltip contentStyle={{ fontSize: 12 }} formatter={(value: number) => [`${value}d`, '']} />
          <Area type="monotone" dataKey="value" fill={`${HBC_COLORS.info}20`} stroke="none" />
          <Line type="monotone" dataKey="value" stroke={HBC_COLORS.navy} strokeWidth={2} dot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
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
