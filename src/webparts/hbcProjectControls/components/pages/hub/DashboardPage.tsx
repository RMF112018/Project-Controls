import {
  buildBreadcrumbs,
  ILead,
  IEstimatingTracker,
  IActionInboxItem,
  IProvisioningLog,
  Stage,
  Region,
  Division,
  GoNoGoDecision,
  AwardStatus,
  RoleName,
  ActionPriority,
  ProvisioningStatus,
  PROVISIONING_STEPS,
  TOTAL_PROVISIONING_STEPS,
  isActiveStage,
  formatCurrencyCompact,
  formatDate,
  formatPercent,
  getDaysUntil,
  getUrgencyColor
} from '@hbc/sp-services';
import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { useActionInbox } from '../../hooks/useActionInbox';
import { useProvisioningTracker } from '../../hooks/useProvisioningTracker';
import { useDataMart } from '../../hooks/useDataMart';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useResponsive } from '../../hooks/useResponsive';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { KPICard } from '../../shared/KPICard';
import { DataTable, IDataTableColumn } from '../../shared/DataTable';
import { StatusBadge } from '../../shared/StatusBadge';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { PipelineChart } from '../../shared/PipelineChart';
import { ExportButtons } from '../../shared/ExportButtons';
import { RoleGate } from '../../guards/RoleGate';
import { FeatureGate } from '../../guards/FeatureGate';
import { useAppContext } from '../../contexts/AppContext';
import { ISelectedProject } from '../../contexts/AppContext';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';
// Chart colors
const PIE_COLORS = {
  [GoNoGoDecision.Go]: HBC_COLORS.success,
  [GoNoGoDecision.NoGo]: HBC_COLORS.error,
  [GoNoGoDecision.ConditionalGo]: HBC_COLORS.warning,
};
const REGION_COLORS = [HBC_COLORS.navy, HBC_COLORS.orange, HBC_COLORS.info, HBC_COLORS.success, '#8B5CF6'];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { setSelectedProject, currentUser } = useAppContext();
  const { leads, isLoading: leadsLoading, fetchLeads } = useLeads();
  const { records, isLoading: estLoading, fetchRecords } = useEstimating();
  const { items: actionItems, loading: actionLoading, totalCount: actionTotal, urgentCount, refresh: refreshActions } = useActionInbox();
  const { logs: provLogs, isLoading: provLoading, summary: provSummary, refresh: refreshProvisioning } = useProvisioningTracker();
  const { records: dataMartRecords, healthDistribution, alertCount, fetchRecords: fetchDataMart } = useDataMart();
  const { isMobile, isTablet } = useResponsive();
  const [showAllActions, setShowAllActions] = React.useState(false);
  const [showAllProv, setShowAllProv] = React.useState(false);

  const [chartMode, setChartMode] = React.useState<'count' | 'value'>('count');
  const [yearFilter, setYearFilter] = usePersistedState<string>('dashboard-year', 'All');
  const [regionFilter, setRegionFilter] = usePersistedState<string>('dashboard-region', 'All');
  const [divisionFilter, setDivisionFilter] = usePersistedState<string>('dashboard-division', 'All');

  // Redirect EC to Estimating Dashboard
  React.useEffect(() => {
    if (currentUser?.roles.includes(RoleName.EstimatingCoordinator)) {
      navigate('/preconstruction', { replace: true });
    }
  }, [currentUser, navigate]);

  React.useEffect(() => {
    fetchLeads().catch(console.error);
    fetchRecords().catch(console.error);
    fetchDataMart().catch(console.error);
  }, [fetchLeads, fetchRecords, fetchDataMart]);

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

    // Avg Go/No-Go Score
    const scoredLeads = filteredLeads.filter(l => l.GoNoGoScore_Originator !== null && l.GoNoGoScore_Originator !== undefined);
    const avgGoNoGoScore = scoredLeads.length > 0
      ? scoredLeads.reduce((s, l) => s + (l.GoNoGoScore_Originator || 0), 0) / scoredLeads.length
      : 0;

    return {
      activeProjects: active.length,
      totalPipelineValue,
      winRate,
      pursuitsInProgress: activeEstimating,
      feesOutstanding,
      avgGoNoGoScore,
    };
  }, [filteredLeads, records]);

  // Win Rate Trend (trailing 12 months)
  const winRateTrend = React.useMemo(() => {
    const now = new Date();
    const months: { month: string; winRate: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      // Cumulative win rate up to this month
      const decided = filteredLeads.filter(l => {
        if (!l.GoNoGoDecisionDate && !l.DateOfEvaluation) return false;
        const evalDate = new Date(l.GoNoGoDecisionDate || l.DateOfEvaluation);
        return evalDate <= monthEnd && l.GoNoGoDecision;
      });
      const wins = decided.filter(l => l.GoNoGoDecision === GoNoGoDecision.Go).length;
      const losses = decided.filter(l => l.GoNoGoDecision === GoNoGoDecision.NoGo).length;
      const rate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
      months.push({ month: label, winRate: Math.round(rate * 10) / 10 });
    }
    return months;
  }, [filteredLeads]);

  // Go/No-Go/Conditional pie data
  const gonogoDistribution = React.useMemo(() => {
    const goLeads = filteredLeads.filter(l => l.GoNoGoDecision === GoNoGoDecision.Go);
    const noGoLeads = filteredLeads.filter(l => l.GoNoGoDecision === GoNoGoDecision.NoGo);
    const conditionalLeads = filteredLeads.filter(l => l.GoNoGoDecision === GoNoGoDecision.ConditionalGo);
    return [
      { name: 'Go', value: goLeads.length, color: PIE_COLORS[GoNoGoDecision.Go] },
      { name: 'No Go', value: noGoLeads.length, color: PIE_COLORS[GoNoGoDecision.NoGo] },
      { name: 'Conditional Go', value: conditionalLeads.length, color: PIE_COLORS[GoNoGoDecision.ConditionalGo] },
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

  // Sector distribution data
  const sectorDistribution = React.useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredLeads.filter(l => isActiveStage(l.Stage)).forEach(l => {
      grouped[l.Sector] = (grouped[l.Sector] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([sector, count]) => ({ name: sector, value: count }))
      .sort((a, b) => b.value - a.value);
  }, [filteredLeads]);

  const SECTOR_COLORS = [HBC_COLORS.navy, HBC_COLORS.orange, HBC_COLORS.info, HBC_COLORS.success, '#8B5CF6', '#F472B6', '#34D399', '#FBBF24', '#A78BFA', '#F87171', '#60A5FA', '#4ADE80'];

  // Top pursuits (top 10 by value)
  const topPursuits = React.useMemo(() => {
    return [...filteredLeads]
      .filter(l => isActiveStage(l.Stage))
      .sort((a, b) => (b.ProjectValue || 0) - (a.ProjectValue || 0))
      .slice(0, 10);
  }, [filteredLeads]);

  // Upcoming deadlines (from estimating)
  const upcomingDeadlines = React.useMemo(() => {
    return records
      .filter(r => r.DueDate_OutTheDoor && getDaysUntil(r.DueDate_OutTheDoor) !== null)
      .sort((a, b) => new Date(a.DueDate_OutTheDoor!).getTime() - new Date(b.DueDate_OutTheDoor!).getTime())
      .slice(0, 10);
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
      .slice(0, 10);
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

  const handleGoToAction = React.useCallback((item: IActionInboxItem) => {
    if (item.routePath.startsWith('/operations/')) {
      const proj: ISelectedProject = {
        projectCode: item.projectCode,
        projectName: item.projectName,
        stage: Stage.ActiveConstruction,
      };
      setSelectedProject(proj);
    }
    navigate(item.routePath);
  }, [navigate, setSelectedProject]);

  const getRelativeTime = (dateStr: string): string => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const priorityDotColor = (priority: ActionPriority): string => {
    if (priority === ActionPriority.Urgent) return HBC_COLORS.error;
    if (priority === ActionPriority.Normal) return HBC_COLORS.warning;
    return HBC_COLORS.success;
  };

  if (leadsLoading || estLoading) return (
    <div>
      <SkeletonLoader variant="kpi-grid" columns={isMobile ? 2 : 6} style={{ marginBottom: '32px' }} />
      <SkeletonLoader variant="table" rows={5} columns={5} />
    </div>
  );

  const kpiGridCols = isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))';
  const chartGridCols = isMobile ? '1fr' : '1fr 1fr';

  const chartCardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: ELEVATION.level1,
  };

  const sectionTitle = (text: string): React.ReactNode => (
    <h2 style={{ fontSize: '18px', fontWeight: 600, color: HBC_COLORS.navy, margin: '0 0 12px 0' }}>{text}</h2>
  );

  return (
      <div id="dashboard-view">
        <PageHeader
          title="Executive Dashboard"
          subtitle="Organization-wide project pipeline overview"
          breadcrumb={<Breadcrumb items={breadcrumbs} />}
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

        {/* Action Inbox */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '16px 20px',
          boxShadow: ELEVATION.level1,
          marginBottom: '24px',
          border: urgentCount > 0 ? `1px solid ${HBC_COLORS.orange}` : `1px solid ${HBC_COLORS.gray200}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: actionTotal > 0 ? '12px' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy }}>Action Required</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '22px', height: '22px', borderRadius: '11px', padding: '0 6px',
                fontSize: '12px', fontWeight: 600, color: '#fff',
                backgroundColor: urgentCount > 0 ? HBC_COLORS.orange : HBC_COLORS.gray400,
              }}>
                {actionTotal}
              </span>
            </div>
            <button
              onClick={() => { refreshActions(); }}
              style={{
                padding: '4px 12px', fontSize: '12px', color: HBC_COLORS.navy,
                backgroundColor: 'transparent', border: `1px solid ${HBC_COLORS.gray300}`,
                borderRadius: '4px', cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>

          {actionLoading ? (
            <LoadingSpinner size="small" label="Loading actions..." />
          ) : actionTotal === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: HBC_COLORS.gray500, fontSize: '14px', padding: '8px 0' }}>
              <span style={{ color: HBC_COLORS.success, fontSize: '18px' }}>&#10003;</span>
              No pending actions
            </div>
          ) : (
            <>
              {(showAllActions ? actionItems : actionItems.slice(0, 5)).map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: `1px solid ${HBC_COLORS.gray100}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
                    <span style={{
                      width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, marginTop: '5px',
                      backgroundColor: priorityDotColor(item.priority),
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: HBC_COLORS.navy }}>{item.actionLabel}</div>
                      <div style={{ fontSize: '12px', color: HBC_COLORS.gray600, marginTop: '2px' }}>
                        {item.projectName}{item.projectCode ? ` — ${item.projectCode}` : ''}
                      </div>
                      <div style={{ fontSize: '11px', color: HBC_COLORS.gray400, marginTop: '2px' }}>
                        Requested by {item.requestedBy} &middot; {getRelativeTime(item.requestedDate)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGoToAction(item)}
                    style={{
                      padding: '4px 12px', fontSize: '12px', color: HBC_COLORS.navy, fontWeight: 500,
                      backgroundColor: HBC_COLORS.gray50, border: `1px solid ${HBC_COLORS.gray200}`,
                      borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >
                    Go &rarr;
                  </button>
                </div>
              ))}
              {actionTotal > 5 && (
                <button
                  onClick={() => setShowAllActions(!showAllActions)}
                  style={{
                    marginTop: '8px', padding: '4px 0', fontSize: '13px', color: HBC_COLORS.orange,
                    backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500,
                  }}
                >
                  {showAllActions ? 'Show less' : `Show all (${actionTotal})`}
                </button>
              )}
            </>
          )}
        </div>

        {/* Project Setup Tracker */}
        <RoleGate allowedRoles={[RoleName.ExecutiveLeadership, RoleName.DepartmentDirector, RoleName.OperationsTeam, RoleName.SharePointAdmin]}>
          <FeatureGate featureName="AutoSiteProvisioning">
            <ProvisioningTrackerWidget
              logs={provLogs}
              isLoading={provLoading}
              summary={provSummary}
              showAll={showAllProv}
              onToggleShowAll={() => setShowAllProv(!showAllProv)}
              onRefresh={refreshProvisioning}
            />
          </FeatureGate>
        </RoleGate>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: kpiGridCols, gap: '16px', marginBottom: '32px' }}>
          <KPICard title="Active Projects" value={kpis.activeProjects} subtitle="Across all stages" onClick={() => navigate('/')} />
          <KPICard title="Total Pipeline Value" value={formatCurrencyCompact(kpis.totalPipelineValue)} subtitle={`${kpis.activeProjects} active projects`} />
          <KPICard title="Win Rate" value={formatPercent(kpis.winRate)} subtitle="Awarded / (Awarded + Lost)" />
          <KPICard title="Pursuits in Progress" value={kpis.pursuitsInProgress} subtitle="Current active estimates" />
          <KPICard title="Precon Fees Outstanding" value={formatCurrencyCompact(kpis.feesOutstanding)} subtitle="PreconFee - FeePaidToDate" />
          <KPICard title="Avg Go/No-Go Score" value={kpis.avgGoNoGoScore > 0 ? kpis.avgGoNoGoScore.toFixed(1) : '-'} subtitle={`Out of 92 possible`} />
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: chartGridCols, gap: '16px', marginBottom: '32px' }}>
          {/* Pipeline by Stage */}
          <div style={{ gridColumn: isMobile ? undefined : '1 / -1' }}>
            {sectionTitle('Pipeline by Stage')}
            <PipelineChart leads={filteredLeads} mode={chartMode} />
          </div>

          {/* Win Rate Trend */}
          <div>
            {sectionTitle('Win Rate Trend (12-Month)')}
            <div style={chartCardStyle}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={winRateTrend} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: HBC_COLORS.gray500 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11, fill: HBC_COLORS.gray500 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Win Rate']} contentStyle={{ borderRadius: '6px', border: `1px solid ${HBC_COLORS.gray200}`, fontSize: '13px' }} />
                  <Line type="monotone" dataKey="winRate" stroke={HBC_COLORS.navy} strokeWidth={2} dot={{ fill: HBC_COLORS.navy, r: 3 }} name="Win Rate" />
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

          {/* Sector Distribution */}
          <div>
            {sectionTitle('Sector Distribution')}
            <div style={chartCardStyle}>
              {sectorDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={sectorDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {sectorDistribution.map((_, idx) => (
                        <Cell key={idx} fill={SECTOR_COLORS[idx % SECTOR_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '6px', border: `1px solid ${HBC_COLORS.gray200}`, fontSize: '13px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: HBC_COLORS.gray400 }}>
                  No active pipeline data
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
            {sectionTitle('Top Pursuits')}
            <DataTable<ILead>
              columns={recentLeadColumns}
              items={topPursuits}
              keyExtractor={l => l.id}
              onRowClick={l => navigate(`/lead/${l.id}`)}
              emptyTitle="No active pursuits"
              pageSize={10}
            />
          </div>
          <div>
            {sectionTitle('Upcoming Deadlines')}
            <DataTable<IEstimatingTracker>
              columns={deadlineColumns}
              items={upcomingDeadlines}
              keyExtractor={r => r.id}
              onRowClick={r => navigate(`/preconstruction/pursuit/${r.id}`)}
              emptyTitle="No deadlines"
              pageSize={10}
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
              pageSize={10}
            />
          </div>
        </div>

        {/* Marketing Summary */}
        <RoleGate allowedRoles={[RoleName.Marketing, RoleName.ExecutiveLeadership, RoleName.DepartmentDirector]}>
          <div style={{ marginTop: '32px' }}>
            {sectionTitle('Marketing')}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: '16px', alignItems: 'center' }}>
              <KPICard title="Project Records in Progress" value={records.filter(r => !r.SubmittedDate).length} subtitle="Active marketing records" />
              <button
                onClick={() => navigate('/marketing')}
                style={{
                  padding: '8px 20px', backgroundColor: HBC_COLORS.navy, color: '#fff',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', height: 'fit-content',
                }}
              >
                View Marketing Dashboard
              </button>
            </div>
          </div>
        </RoleGate>

        {/* Preconstruction Summary */}
        <RoleGate allowedRoles={[RoleName.BDRepresentative, RoleName.EstimatingCoordinator, RoleName.PreconstructionTeam, RoleName.ExecutiveLeadership, RoleName.DepartmentDirector]}>
          <div style={{ marginTop: '32px' }}>
            {sectionTitle('Preconstruction')}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr) auto', gap: '16px', alignItems: 'center' }}>
              <KPICard title="Active Pursuits" value={filteredLeads.filter(l => l.Stage === Stage.Pursuit || l.Stage === Stage.Opportunity).length} subtitle={formatCurrencyCompact(filteredLeads.filter(l => l.Stage === Stage.Pursuit || l.Stage === Stage.Opportunity).reduce((s, l) => s + (l.ProjectValue || 0), 0))} />
              <KPICard title="Pending Go/No-Go" value={filteredLeads.filter(l => l.Stage === Stage.GoNoGoPending).length} subtitle="Awaiting decision" />
              <KPICard title="Upcoming Deadlines" value={upcomingDeadlines.length} subtitle="Bids due soon" />
              <button
                onClick={() => navigate('/preconstruction')}
                style={{
                  padding: '8px 20px', backgroundColor: HBC_COLORS.navy, color: '#fff',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', height: 'fit-content',
                }}
              >
                View Preconstruction
              </button>
            </div>
          </div>
        </RoleGate>

        {/* Operations Summary */}
        <RoleGate allowedRoles={[RoleName.OperationsTeam, RoleName.ExecutiveLeadership, RoleName.DepartmentDirector, RoleName.RiskManagement, RoleName.QualityControl, RoleName.Safety]}>
          <div style={{ marginTop: '32px' }}>
            {sectionTitle('Operations')}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(2, 1fr) auto', gap: '16px', alignItems: 'center' }}>
              <KPICard title="Active Construction" value={filteredLeads.filter(l => l.Stage === Stage.ActiveConstruction).length} subtitle="Projects in construction" />
              <KPICard title="Projects in Closeout" value={filteredLeads.filter(l => l.Stage === Stage.Closeout).length} subtitle="Closeout phase" />
              <button
                onClick={() => navigate('/operations')}
                style={{
                  padding: '8px 20px', backgroundColor: HBC_COLORS.navy, color: '#fff',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', height: 'fit-content',
                }}
              >
                View Active Projects
              </button>
            </div>

            {/* Portfolio Health from Data Mart */}
            {dataMartRecords.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: '12px',
                marginTop: '16px',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 16px', backgroundColor: '#fff', borderRadius: '8px',
                  boxShadow: ELEVATION.level1, borderLeft: `4px solid ${HBC_COLORS.success}`,
                }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: HBC_COLORS.success }}>{healthDistribution.Green}</span>
                  <span style={{ fontSize: '13px', color: HBC_COLORS.gray600 }}>Healthy</span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 16px', backgroundColor: '#fff', borderRadius: '8px',
                  boxShadow: ELEVATION.level1, borderLeft: `4px solid ${HBC_COLORS.warning}`,
                }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: HBC_COLORS.warning }}>{healthDistribution.Yellow}</span>
                  <span style={{ fontSize: '13px', color: HBC_COLORS.gray600 }}>Caution</span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 16px', backgroundColor: '#fff', borderRadius: '8px',
                  boxShadow: ELEVATION.level1, borderLeft: `4px solid ${HBC_COLORS.error}`,
                }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: HBC_COLORS.error }}>{healthDistribution.Red}</span>
                  <span style={{ fontSize: '13px', color: HBC_COLORS.gray600 }}>At Risk</span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 16px', backgroundColor: '#fff', borderRadius: '8px',
                  boxShadow: ELEVATION.level1, borderLeft: `4px solid ${alertCount > 0 ? HBC_COLORS.orange : HBC_COLORS.gray300}`,
                }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: alertCount > 0 ? HBC_COLORS.orange : HBC_COLORS.gray500 }}>{alertCount}</span>
                  <span style={{ fontSize: '13px', color: HBC_COLORS.gray600 }}>Alerts</span>
                </div>
              </div>
            )}
          </div>
        </RoleGate>
      </div>
  );
};

/* ─── Internal: Project Setup Tracker Widget ─── */

interface IProvisioningTrackerWidgetProps {
  logs: IProvisioningLog[];
  isLoading: boolean;
  summary: { inProgress: number; completed: number; failed: number; queued: number; total: number };
  showAll: boolean;
  onToggleShowAll: () => void;
  onRefresh: () => Promise<void>;
}

const STATUS_CHIP_STYLES: Record<string, { bg: string; color: string }> = {
  Queued: { bg: HBC_COLORS.infoLight, color: HBC_COLORS.info },
  InProgress: { bg: '#FFF7ED', color: HBC_COLORS.orange },
  Completed: { bg: HBC_COLORS.successLight, color: '#065F46' },
  Failed: { bg: HBC_COLORS.errorLight, color: '#991B1B' },
};

const ProvisioningTrackerWidget: React.FC<IProvisioningTrackerWidgetProps> = ({
  logs, isLoading, summary, showAll, onToggleShowAll, onRefresh,
}) => {
  const activeCount = summary.inProgress + summary.queued;
  const activeLogs = logs.filter(l =>
    l.status === ProvisioningStatus.InProgress ||
    l.status === ProvisioningStatus.Queued ||
    l.status === ProvisioningStatus.Failed ||
    l.status === ProvisioningStatus.PartialFailure
  );
  const displayLogs = showAll ? activeLogs : activeLogs.slice(0, 5);

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '16px 20px',
      boxShadow: ELEVATION.level1,
      marginBottom: '24px',
      border: `1px solid ${summary.failed > 0 ? HBC_COLORS.error : HBC_COLORS.gray200}`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: activeLogs.length > 0 ? '12px' : '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy }}>Project Setup Tracker</span>
          {activeCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '22px', height: '22px', borderRadius: '11px', padding: '0 6px',
              fontSize: '12px', fontWeight: 600, color: '#fff',
              backgroundColor: HBC_COLORS.orange,
            }}>
              {activeCount}
            </span>
          )}
        </div>
        <button
          onClick={() => { onRefresh().catch(console.error); }}
          style={{
            padding: '4px 12px', fontSize: '12px', color: HBC_COLORS.navy,
            backgroundColor: 'transparent', border: `1px solid ${HBC_COLORS.gray300}`,
            borderRadius: '4px', cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: activeLogs.length > 0 ? '12px' : '0' }}>
        {([
          { label: 'Queued', count: summary.queued, key: 'Queued' },
          { label: 'In Progress', count: summary.inProgress, key: 'InProgress' },
          { label: 'Completed', count: summary.completed, key: 'Completed' },
          { label: 'Failed', count: summary.failed, key: 'Failed' },
        ] as const).map(chip => (
          <span key={chip.key} style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
            backgroundColor: STATUS_CHIP_STYLES[chip.key].bg,
            color: STATUS_CHIP_STYLES[chip.key].color,
          }}>
            {chip.label}: {chip.count}
          </span>
        ))}
      </div>

      {/* Active items */}
      {isLoading ? (
        <LoadingSpinner size="small" label="Loading provisioning status..." />
      ) : activeLogs.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: HBC_COLORS.gray500, fontSize: '14px', padding: '8px 0' }}>
          <span style={{ color: HBC_COLORS.success, fontSize: '18px' }}>&#10003;</span>
          No active provisioning
        </div>
      ) : (
        <>
          {displayLogs.map(log => (
            <div
              key={log.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: `1px solid ${HBC_COLORS.gray100}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: HBC_COLORS.navy }}>{log.projectName}</div>
                <div style={{ fontSize: '12px', color: HBC_COLORS.gray600, marginTop: '2px' }}>{log.projectCode}</div>
              </div>
              {/* Step dots */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginRight: '12px' }}>
                {PROVISIONING_STEPS.map(s => {
                  let dotColor: string = HBC_COLORS.gray300;
                  if (s.step <= log.completedSteps) dotColor = HBC_COLORS.success;
                  else if (s.step === log.currentStep && log.status === ProvisioningStatus.InProgress) dotColor = HBC_COLORS.info;
                  else if (s.step === log.failedStep) dotColor = HBC_COLORS.error;
                  return (
                    <span
                      key={s.step}
                      title={s.label}
                      style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        backgroundColor: dotColor, display: 'inline-block',
                      }}
                    />
                  );
                })}
              </div>
              <span style={{ fontSize: '11px', color: HBC_COLORS.gray500, whiteSpace: 'nowrap' }}>
                {log.completedSteps}/{TOTAL_PROVISIONING_STEPS}
              </span>
            </div>
          ))}
          {activeLogs.length > 5 && (
            <button
              onClick={onToggleShowAll}
              style={{
                marginTop: '8px', padding: '4px 0', fontSize: '13px', color: HBC_COLORS.orange,
                backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500,
              }}
            >
              {showAll ? 'Show less' : `Show all (${activeLogs.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
};
