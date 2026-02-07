import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Select } from '@fluentui/react-components';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useLeads } from '../../hooks/useLeads';
import { useEstimating } from '../../hooks/useEstimating';
import { useResponsive } from '../../hooks/useResponsive';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { DataTable, IDataTableColumn } from '../../shared/DataTable';
import { StatusBadge } from '../../shared/StatusBadge';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { PipelineChart } from '../../shared/PipelineChart';
import { ExportButtons } from '../../shared/ExportButtons';
import { FeatureGate } from '../../guards/FeatureGate';
import { ILead, IEstimatingTracker, Stage, Region, Division, GoNoGoDecision, AwardStatus } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';
import {
  formatCurrencyCompact,
  formatDate,
  formatPercent,
  getDaysUntil,
  getUrgencyColor,
} from '../../../utils/formatters';
import { isActiveStage } from '../../../utils/stageEngine';

// Chart colors
const PIE_COLORS = {
  [GoNoGoDecision.Go]: HBC_COLORS.success,
  [GoNoGoDecision.NoGo]: HBC_COLORS.error,
  [GoNoGoDecision.Wait]: HBC_COLORS.warning,
};
const REGION_COLORS = [HBC_COLORS.navy, HBC_COLORS.orange, HBC_COLORS.info, HBC_COLORS.success, '#8B5CF6'];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { leads, isLoading: leadsLoading, fetchLeads } = useLeads();
  const { records, isLoading: estLoading, fetchRecords } = useEstimating();
  const { isMobile, isTablet } = useResponsive();

  const [chartMode, setChartMode] = React.useState<'count' | 'value'>('count');
  const [yearFilter, setYearFilter] = React.useState<string>('All');
  const [regionFilter, setRegionFilter] = React.useState<string>('All');
  const [divisionFilter, setDivisionFilter] = React.useState<string>('All');

  React.useEffect(() => {
    fetchLeads().catch(console.error);
    fetchRecords().catch(console.error);
  }, [fetchLeads, fetchRecords]);

  // Filter options
  const years = React.useMemo(() => {
    const yrs = new Set<string>();
    leads.forEach(l => {
      if (l.DateOfEvaluation) yrs.add(new Date(l.DateOfEvaluation).getFullYear().toString());
    });
    return ['All', ...Array.from(yrs).sort().reverse()];
  }, [leads]);

  // Filtered leads
  const filteredLeads = React.useMemo(() => {
    return leads.filter(l => {
      if (yearFilter !== 'All') {
        if (!l.DateOfEvaluation || new Date(l.DateOfEvaluation).getFullYear().toString() !== yearFilter) return false;
      }
      if (regionFilter !== 'All' && l.Region !== regionFilter) return false;
      if (divisionFilter !== 'All' && l.Division !== divisionFilter) return false;
      return true;
    });
  }, [leads, yearFilter, regionFilter, divisionFilter]);

  // KPI calculations
  const kpis = React.useMemo(() => {
    const active = filteredLeads.filter(l => isActiveStage(l.Stage));
    const totalPipelineValue = active.reduce((sum, l) => sum + (l.ProjectValue || 0), 0);
    const pendingGNG = filteredLeads.filter(l => l.Stage === Stage.GoNoGoPending);

    // Win rate from estimate log
    const awarded = records.filter(r =>
      r.AwardStatus === AwardStatus.AwardedWithPrecon || r.AwardStatus === AwardStatus.AwardedWithoutPrecon
    ).length;
    const lost = records.filter(r => r.AwardStatus === AwardStatus.NotAwarded).length;
    const winRate = awarded + lost > 0 ? (awarded / (awarded + lost)) * 100 : 0;

    // Active estimating
    const activeEstimating = records.filter(r => (!r.AwardStatus || r.AwardStatus === 'Pending') && !r.SubmittedDate).length;

    // Precon fees outstanding
    const preconEngagements = records.filter(r => r.PreconFee !== undefined && r.PreconFee !== null && r.PreconFee > 0);
    const feesOutstanding = preconEngagements.reduce((s, r) => s + ((r.PreconFee || 0) - (r.FeePaidToDate || 0)), 0);

    return {
      activeLeads: active.length,
      totalPipelineValue,
      winRate,
      activeEstimating,
      feesOutstanding,
      pendingGNG: pendingGNG.length,
    };
  }, [filteredLeads, records]);

  // Monthly trend data (trailing 12 months)
  const monthlyTrend = React.useMemo(() => {
    const now = new Date();
    const months: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const count = filteredLeads.filter(l => {
        if (!l.DateOfEvaluation) return false;
        const ld = new Date(l.DateOfEvaluation);
        return ld.getFullYear() === d.getFullYear() && ld.getMonth() === d.getMonth();
      }).length;
      months.push({ month: label, count });
    }
    return months;
  }, [filteredLeads]);

  // Win/Loss/Wait pie data
  const gonogoDistribution = React.useMemo(() => {
    const goLeads = filteredLeads.filter(l => l.GoNoGoDecision === GoNoGoDecision.Go);
    const noGoLeads = filteredLeads.filter(l => l.GoNoGoDecision === GoNoGoDecision.NoGo);
    const waitLeads = filteredLeads.filter(l => l.GoNoGoDecision === GoNoGoDecision.Wait);
    return [
      { name: 'Go', value: goLeads.length, color: PIE_COLORS[GoNoGoDecision.Go] },
      { name: 'No Go', value: noGoLeads.length, color: PIE_COLORS[GoNoGoDecision.NoGo] },
      { name: 'Wait', value: waitLeads.length, color: PIE_COLORS[GoNoGoDecision.Wait] },
    ].filter(d => d.value > 0);
  }, [filteredLeads]);

  // Region pipeline data (horizontal bar)
  const regionPipeline = React.useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredLeads.filter(l => isActiveStage(l.Stage)).forEach(l => {
      grouped[l.Region] = (grouped[l.Region] || 0) + (l.ProjectValue || 0);
    });
    return Object.entries(grouped)
      .map(([region, value]) => ({ region, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredLeads]);

  // Recent leads (last 5)
  const recentLeads = React.useMemo(() => {
    return [...filteredLeads]
      .sort((a, b) => new Date(b.DateOfEvaluation).getTime() - new Date(a.DateOfEvaluation).getTime())
      .slice(0, 5);
  }, [filteredLeads]);

  // Upcoming deadlines (from estimating)
  const upcomingDeadlines = React.useMemo(() => {
    return records
      .filter(r => r.DueDate_OutTheDoor && getDaysUntil(r.DueDate_OutTheDoor) !== null)
      .sort((a, b) => new Date(a.DueDate_OutTheDoor!).getTime() - new Date(b.DueDate_OutTheDoor!).getTime())
      .slice(0, 5);
  }, [records]);

  // Recent Go/No-Go decisions
  const recentGoNoGo = React.useMemo(() => {
    return filteredLeads
      .filter(l => l.GoNoGoDecision)
      .sort((a, b) => {
        const dateA = a.GoNoGoDecisionDate || a.DateOfEvaluation;
        const dateB = b.GoNoGoDecisionDate || b.DateOfEvaluation;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, 5);
  }, [filteredLeads]);

  // Table columns
  const recentLeadColumns: IDataTableColumn<ILead>[] = React.useMemo(() => [
    { key: 'Title', header: 'Project', render: (l) => <span style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{l.Title}</span> },
    { key: 'ClientName', header: 'Client', width: '140px', render: (l) => l.ClientName },
    { key: 'Region', header: 'Region', width: '120px', render: (l) => l.Region },
    { key: 'Stage', header: 'Stage', width: '120px', render: (l) => (
      <StatusBadge label={l.Stage} color={HBC_COLORS.navy} backgroundColor={HBC_COLORS.infoLight} />
    )},
    { key: 'ProjectValue', header: 'Value', width: '100px', render: (l) => formatCurrencyCompact(l.ProjectValue) },
  ], []);

  const deadlineColumns: IDataTableColumn<IEstimatingTracker>[] = React.useMemo(() => [
    { key: 'Title', header: 'Project', render: (r) => <span style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{r.Title}</span> },
    { key: 'DueDate_OutTheDoor', header: 'Due', width: '100px', render: (r) => formatDate(r.DueDate_OutTheDoor) },
    { key: 'LeadEstimator', header: 'Estimator', width: '100px', render: (r) => r.LeadEstimator || '-' },
    { key: 'DaysLeft', header: 'Days Left', width: '80px', render: (r) => {
      const days = getDaysUntil(r.DueDate_OutTheDoor);
      const color = getUrgencyColor(days);
      return <span style={{ fontWeight: 600, color }}>{days !== null ? (days < 0 ? `${days}d` : `${days}d`) : '-'}</span>;
    }},
  ], []);

  const gonogoColumns: IDataTableColumn<ILead>[] = React.useMemo(() => [
    { key: 'Title', header: 'Project', render: (l) => <span style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{l.Title}</span> },
    { key: 'GoNoGoDecision', header: 'Decision', width: '90px', render: (l) => {
      const decision = l.GoNoGoDecision!;
      const color = decision === GoNoGoDecision.Go ? '#065F46' : decision === GoNoGoDecision.NoGo ? '#991B1B' : '#92400E';
      const bg = decision === GoNoGoDecision.Go ? HBC_COLORS.successLight : decision === GoNoGoDecision.NoGo ? HBC_COLORS.errorLight : HBC_COLORS.warningLight;
      return <StatusBadge label={decision} color={color} backgroundColor={bg} />;
    }},
    { key: 'Score', header: 'Score', width: '60px', render: (l) => <span>{l.GoNoGoScore_Originator ?? '-'}</span> },
    { key: 'Date', header: 'Date', width: '100px', render: (l) => formatDate(l.GoNoGoDecisionDate || l.DateOfEvaluation) },
  ], []);

  // Export data
  const exportData = React.useMemo(() =>
    filteredLeads.filter(l => isActiveStage(l.Stage)).map(l => ({
      Project: l.Title,
      Client: l.ClientName,
      Region: l.Region,
      Division: l.Division,
      Value: l.ProjectValue || '',
      Stage: l.Stage,
    })),
  [filteredLeads]);

  if (leadsLoading || estLoading) return <LoadingSpinner label="Loading dashboard..." />;

  const kpiGridCols = isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))';
  const chartGridCols = isMobile ? '1fr' : '1fr 1fr';

  const chartCardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  const sectionTitle = (text: string): React.ReactNode => (
    <h2 style={{ fontSize: '18px', fontWeight: 600, color: HBC_COLORS.navy, margin: '0 0 12px 0' }}>{text}</h2>
  );

  return (
    <FeatureGate featureName="ExecutiveDashboard">
      <div id="dashboard-view">
        <PageHeader
          title="Executive Dashboard"
          subtitle="Organization-wide project pipeline overview"
          actions={
            <ExportButtons
              data={exportData}
              pdfElementId="dashboard-view"
              filename="executive-dashboard-export"
              title="Executive Dashboard"
            />
          }
        />

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Select size="small" value={yearFilter} onChange={(_, d) => setYearFilter(d.value)} style={{ minWidth: '100px' }}>
            {years.map(y => <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>)}
          </Select>
          <Select size="small" value={regionFilter} onChange={(_, d) => setRegionFilter(d.value)} style={{ minWidth: '140px' }}>
            <option value="All">All Regions</option>
            {Object.values(Region).map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Select size="small" value={divisionFilter} onChange={(_, d) => setDivisionFilter(d.value)} style={{ minWidth: '140px' }}>
            <option value="All">All Divisions</option>
            {Object.values(Division).map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Select size="small" value={chartMode} onChange={(_, d) => setChartMode(d.value as 'count' | 'value')} style={{ minWidth: '100px' }}>
            <option value="count">Count</option>
            <option value="value">Value</option>
          </Select>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: kpiGridCols, gap: '16px', marginBottom: '32px' }}>
          <KPICard title="Active Leads" value={kpis.activeLeads} subtitle="Across all stages" onClick={() => navigate('/')} />
          <KPICard title="Total Pipeline Value" value={formatCurrencyCompact(kpis.totalPipelineValue)} subtitle={`${kpis.activeLeads} active projects`} />
          <KPICard title="Win Rate" value={formatPercent(kpis.winRate)} subtitle="Awarded / (Awarded + Lost)" />
          <KPICard title="Active Estimating" value={kpis.activeEstimating} subtitle="Current pursuits" />
          <KPICard title="Precon Fees Outstanding" value={formatCurrencyCompact(kpis.feesOutstanding)} subtitle="PreconFee - FeePaidToDate" />
          <KPICard title="Pending Go/No-Go" value={kpis.pendingGNG} subtitle="Awaiting committee review" />
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: chartGridCols, gap: '16px', marginBottom: '32px' }}>
          {/* Pipeline by Stage */}
          <div style={{ gridColumn: isMobile ? undefined : '1 / -1' }}>
            {sectionTitle('Pipeline by Stage')}
            <PipelineChart leads={filteredLeads} mode={chartMode} />
          </div>

          {/* Monthly Trend */}
          <div>
            {sectionTitle('Monthly Lead Trend')}
            <div style={chartCardStyle}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyTrend} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: HBC_COLORS.gray500 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: HBC_COLORS.gray500 }} />
                  <Tooltip contentStyle={{ borderRadius: '6px', border: `1px solid ${HBC_COLORS.gray200}`, fontSize: '13px' }} />
                  <Line type="monotone" dataKey="count" stroke={HBC_COLORS.navy} strokeWidth={2} dot={{ fill: HBC_COLORS.navy, r: 3 }} name="New Leads" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Win/Loss Donut */}
          <div>
            {sectionTitle('Go/No-Go Decisions')}
            <div style={chartCardStyle}>
              {gonogoDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={gonogoDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {gonogoDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '6px', border: `1px solid ${HBC_COLORS.gray200}`, fontSize: '13px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: HBC_COLORS.gray400 }}>
                  No decisions recorded
                </div>
              )}
            </div>
          </div>

          {/* Region Pipeline */}
          <div style={{ gridColumn: isMobile ? undefined : '1 / -1' }}>
            {sectionTitle('Pipeline Value by Region')}
            <div style={chartCardStyle}>
              {regionPipeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(200, regionPipeline.length * 50)}>
                  <BarChart data={regionPipeline} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 100 }}>
                    <XAxis type="number" tickFormatter={(v: number) => formatCurrencyCompact(v)} tick={{ fontSize: 11, fill: HBC_COLORS.gray500 }} />
                    <YAxis dataKey="region" type="category" tick={{ fontSize: 12, fill: HBC_COLORS.gray700 }} width={90} />
                    <Tooltip
                      formatter={(v: number) => [formatCurrencyCompact(v), 'Pipeline Value']}
                      contentStyle={{ borderRadius: '6px', border: `1px solid ${HBC_COLORS.gray200}`, fontSize: '13px' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {regionPipeline.map((_, idx) => (
                        <Cell key={idx} fill={REGION_COLORS[idx % REGION_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: HBC_COLORS.gray400 }}>
                  No active pipeline data
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            {sectionTitle('Recent Leads')}
            <DataTable<ILead>
              columns={recentLeadColumns}
              items={recentLeads}
              keyExtractor={l => l.id}
              onRowClick={l => navigate(`/lead/${l.id}`)}
              emptyTitle="No leads"
              pageSize={5}
            />
          </div>
          <div>
            {sectionTitle('Upcoming Deadlines')}
            <DataTable<IEstimatingTracker>
              columns={deadlineColumns}
              items={upcomingDeadlines}
              keyExtractor={r => r.id}
              onRowClick={r => navigate(`/pursuit/${r.id}`)}
              emptyTitle="No deadlines"
              pageSize={5}
            />
          </div>
          <div>
            {sectionTitle('Recent Go/No-Go')}
            <DataTable<ILead>
              columns={gonogoColumns}
              items={recentGoNoGo}
              keyExtractor={l => l.id}
              onRowClick={l => navigate(`/lead/${l.id}/gonogo/detail`)}
              emptyTitle="No decisions"
              pageSize={5}
            />
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};
