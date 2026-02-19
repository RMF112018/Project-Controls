import * as React from 'react';
import { useNavigate, useLocation } from '@router';
import { Select, Input, Button } from '@fluentui/react-components';
import type { EChartsOption } from 'echarts';
import { HbcEChart } from '../../shared/HbcEChart';
import { useActiveProjects } from '../../hooks/useActiveProjects';
import { useDataMart } from '../../hooks/useDataMart';
import { useResponsive } from '../../hooks/useResponsive';
import { useAppContext } from '../../contexts/AppContext';
import {
  Stage,
  buildBreadcrumbs,
  IActiveProject,
  IProjectDataMart,
  DataMartHealthStatus,
  ProjectStatus,
  SectorType,
  RoleName,
  performanceService,
  formatCurrencyCompact,
  formatPercent
} from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { KPICard } from '../../shared/KPICard';
import { HbcDataTable, type IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useToast } from '../../shared/ToastContainer';
import { useHbcMotionStyles } from '../../shared/HbcMotion';
import { StatusBadge } from '../../shared/StatusBadge';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { ExportButtons } from '../../shared/ExportButtons';
import { FeatureGate } from '../../guards/FeatureGate';
import { RoleGate } from '../../guards/RoleGate';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';

// Status colors
const STATUS_COLORS: Record<ProjectStatus, { color: string; bg: string }> = {
  'Precon': { color: '#1E40AF', bg: '#DBEAFE' },
  'Construction': { color: '#065F46', bg: '#D1FAE5' },
  'Final Payment': { color: '#92400E', bg: '#FEF3C7' },
};

// Sector colors for charts
const SECTOR_COLORS: Record<SectorType, string> = {
  'Commercial': HBC_COLORS.navy,
  'Residential': HBC_COLORS.orange,
};

// Alert colors
const ALERT_COLORS = {
  warning: { color: '#92400E', bg: '#FEF3C7' },
  critical: { color: '#991B1B', bg: '#FEE2E2' },
};

// Health status colors
const HEALTH_COLORS: Record<DataMartHealthStatus, { color: string; bg: string }> = {
  Green: { color: '#065F46', bg: '#D1FAE5' },
  Yellow: { color: '#92400E', bg: '#FEF3C7' },
  Red: { color: '#991B1B', bg: '#FEE2E2' },
};

export const ActiveProjectsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { isMobile, isTablet } = useResponsive();
  const motionStyles = useHbcMotionStyles();
  const { addToast } = useToast();
  const {
    setSelectedProject,
    isFeatureEnabled,
    getDashboardPreference,
    setDashboardPreference,
  } = useAppContext();
  const {
    filteredProjects,
    summary,
    isLoading,
    error,
    filters,
    fetchProjects,
    fetchSummary,
    fetchPersonnelWorkload,
    setFilters,
    clearFilters,
    triggerFullSync,
    uniqueProjectExecutives,
    uniqueProjectManagers,
    uniqueRegions,
    projectsWithAlerts,
    personnelWorkload,
  } = useActiveProjects();

  const { records: dataMartRecords, fetchRecords: fetchDataMart } = useDataMart();
  const [viewMode, setViewMode] = usePersistedState<'standard' | 'datamart'>('active-projects-view-mode', 'standard');
  const [selectedPersonnel, setSelectedPersonnel] = React.useState<string | null>(null);
  const [showPersonnelPanel, setShowPersonnelPanel] = usePersistedState<boolean>('active-projects-panel-visible', false);
  const [highlightedProjectId, setHighlightedProjectId] = React.useState<string | number | null>(null);
  const dashboardPreferenceKey = 'active-projects-dashboard';
  const enablePersonalization = isFeatureEnabled('uxPersonalizedDashboardsV1');
  const enableSyncGlow = isFeatureEnabled('uxChartTableSyncGlowV1');
  const enableDelightMotion = isFeatureEnabled('uxDelightMotionV1');
  const isSyncActive = enableSyncGlow && highlightedProjectId !== null;

  // Fetch data on mount
  React.useEffect(() => {
    performanceService.startMark('operations:dashboardDataFetch');
    fetchProjects().catch(console.error);
    fetchSummary().catch(console.error);
    fetchPersonnelWorkload().catch(console.error);
    fetchDataMart().catch(console.error);
    return () => {
      performanceService.endMark('operations:dashboardDataFetch');
    };
  }, [fetchProjects, fetchSummary, fetchPersonnelWorkload, fetchDataMart]);

  React.useEffect(() => {
    if (!enablePersonalization) {
      return;
    }
    const saved = getDashboardPreference(dashboardPreferenceKey);
    if (!saved?.filters) {
      return;
    }
    const savedFilters = saved.filters;
    if (saved.viewMode === 'standard' || saved.viewMode === 'datamart') {
      setViewMode(saved.viewMode);
    }
    const nextFilters = { ...filters };
    if (typeof savedFilters.status === 'string' && savedFilters.status.length > 0) nextFilters.status = savedFilters.status as ProjectStatus;
    if (typeof savedFilters.sector === 'string' && savedFilters.sector.length > 0) nextFilters.sector = savedFilters.sector as SectorType;
    if (typeof savedFilters.region === 'string' && savedFilters.region.length > 0) nextFilters.region = savedFilters.region;
    if (typeof savedFilters.searchQuery === 'string' && savedFilters.searchQuery.length > 0) nextFilters.searchQuery = savedFilters.searchQuery;
    setFilters(nextFilters);
    if (typeof savedFilters.showPersonnelPanel === 'boolean') setShowPersonnelPanel(savedFilters.showPersonnelPanel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enablePersonalization, getDashboardPreference, dashboardPreferenceKey]);

  React.useEffect(() => {
    if (!enablePersonalization) {
      return;
    }
    setDashboardPreference(dashboardPreferenceKey, {
      filters: {
        status: filters.status ?? '',
        sector: filters.sector ?? '',
        region: filters.region ?? '',
        searchQuery: filters.searchQuery ?? '',
        showPersonnelPanel,
      },
      viewMode,
      updatedAt: new Date().toISOString(),
    });
  }, [enablePersonalization, setDashboardPreference, dashboardPreferenceKey, filters, showPersonnelPanel, viewMode]);

  // Re-fetch when filters change
  React.useEffect(() => {
    fetchProjects().catch(console.error);
    fetchSummary(filters).catch(console.error);
  }, [filters, fetchProjects, fetchSummary]);

  // Handle personnel click for drill-down
  const handlePersonnelClick = (name: string) => {
    setSelectedPersonnel(name);
    setShowPersonnelPanel(true);
    // Filter by this personnel
    if (uniqueProjectExecutives.includes(name)) {
      setFilters({ ...filters, projectExecutive: name });
    } else if (uniqueProjectManagers.includes(name)) {
      setFilters({ ...filters, projectManager: name });
    }
  };

  // Chart data
  const statusChartData = React.useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Precon', value: summary.projectsByStatus['Precon'], color: STATUS_COLORS['Precon'].color },
      { name: 'Construction', value: summary.projectsByStatus['Construction'], color: STATUS_COLORS['Construction'].color },
      { name: 'Final Payment', value: summary.projectsByStatus['Final Payment'], color: STATUS_COLORS['Final Payment'].color },
    ].filter(d => d.value > 0);
  }, [summary]);

  const sectorChartData = React.useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Commercial', value: summary.projectsBySector['Commercial'], color: SECTOR_COLORS['Commercial'] },
      { name: 'Residential', value: summary.projectsBySector['Residential'], color: SECTOR_COLORS['Residential'] },
    ].filter(d => d.value > 0);
  }, [summary]);

  const chartEvents = React.useMemo(() => ({
    click: (params: { name?: string }) => {
      performanceService.startMark('operations:chartFilterInteraction');
      const value = params.name;
      if (!value) {
        performanceService.endMark('operations:chartFilterInteraction');
        return;
      }

      if (value === 'Precon' || value === 'Construction' || value === 'Final Payment') {
        setFilters({ ...filters, status: value as ProjectStatus });
        performanceService.endMark('operations:chartFilterInteraction');
        return;
      }

      if (value === 'Commercial' || value === 'Residential') {
        setFilters({ ...filters, sector: value as SectorType });
        performanceService.endMark('operations:chartFilterInteraction');
        return;
      }

      if (uniqueRegions.includes(value)) {
        setFilters({ ...filters, region: value });
      }
      performanceService.endMark('operations:chartFilterInteraction');
    },
  }), [filters, setFilters, uniqueRegions]);

  // Region backlog chart
  const regionBacklogData = React.useMemo(() => {
    const regionMap = new Map<string, number>();
    filteredProjects.forEach(p => {
      if (p.region) {
        regionMap.set(p.region, (regionMap.get(p.region) || 0) + (p.financials.remainingValue || 0));
      }
    });
    return Array.from(regionMap.entries())
      .map(([region, value]) => ({ region, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredProjects]);

  // ─── ECharts option memos ───────────────────────────────────────────────

  const statusChartOption = React.useMemo<EChartsOption>(() => ({
    tooltip: { trigger: 'item', formatter: (p: unknown) => {
      const params = p as { name: string; value: number; percent: number; marker: string };
      return `<div style="font-family:'Segoe UI',sans-serif;padding:4px 0"><div style="font-size:13px;font-weight:600;color:${HBC_COLORS.navy}">${params.marker}${params.name}: ${params.value} (${params.percent}%)</div></div>`;
    }, extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;border:1px solid ${HBC_COLORS.gray200};` },
    legend: { bottom: 0, textStyle: { fontSize: 12, color: HBC_COLORS.gray600 } },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      label: { formatter: (p: unknown) => { const pi = p as { name: string; value: number }; return `${pi.name}: ${pi.value}`; }, fontSize: 11 },
      data: statusChartData.map(d => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: d.color, borderWidth: 2, borderColor: '#fff' },
      })),
    }],
  }), [statusChartData]);

  const sectorChartOption = React.useMemo<EChartsOption>(() => ({
    tooltip: { trigger: 'item', formatter: (p: unknown) => {
      const params = p as { name: string; value: number; percent: number; marker: string };
      return `<div style="font-family:'Segoe UI',sans-serif;padding:4px 0"><div style="font-size:13px;font-weight:600;color:${HBC_COLORS.navy}">${params.marker}${params.name}: ${params.value} (${params.percent}%)</div></div>`;
    }, extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;border:1px solid ${HBC_COLORS.gray200};` },
    legend: { bottom: 0, textStyle: { fontSize: 12, color: HBC_COLORS.gray600 } },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      label: { formatter: (p: unknown) => { const pi = p as { name: string; value: number }; return `${pi.name}: ${pi.value}`; }, fontSize: 11 },
      data: sectorChartData.map(d => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: d.color, borderWidth: 2, borderColor: '#fff' },
      })),
    }],
  }), [sectorChartData]);

  const regionBacklogOption = React.useMemo<EChartsOption>(() => ({
    grid: { top: 10, right: 16, bottom: 8, left: 8, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: unknown) => {
      const params = p as Array<{ name: string; value: number; marker: string }>;
      return `<div style="font-family:'Segoe UI',sans-serif;padding:4px 0"><div style="font-size:11px;color:${HBC_COLORS.gray500};margin-bottom:4px">${params[0].name}</div><div style="font-size:13px;font-weight:600;color:${HBC_COLORS.navy}">${params[0].marker}Backlog: ${formatCurrencyCompact(params[0].value)}</div></div>`;
    }, extraCssText: `border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);padding:10px 14px;border:1px solid ${HBC_COLORS.gray200};` },
    xAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatCurrencyCompact(v), fontSize: 11, color: HBC_COLORS.gray500 }, splitLine: { lineStyle: { color: HBC_COLORS.gray100, type: 'dashed' } }, axisLine: { show: false }, axisTick: { show: false } },
    yAxis: { type: 'category', data: regionBacklogData.map(d => d.region), axisLabel: { fontSize: 12, color: HBC_COLORS.gray700 }, axisLine: { lineStyle: { color: HBC_COLORS.gray200 } }, axisTick: { show: false } },
    series: [{
      type: 'bar',
      name: 'Backlog',
      data: regionBacklogData.map(d => ({ value: d.value, itemStyle: { color: HBC_COLORS.navy, borderRadius: [0, 4, 4, 0] } })),
      barMaxWidth: 40,
    }],
  }), [regionBacklogData]);

  // Table columns
  const columns: IHbcDataTableColumn<IActiveProject>[] = React.useMemo(() => [
    {
      key: 'jobNumber',
      header: 'Job #',
      width: '100px',
      render: (p) => (
        <span style={{ fontWeight: 600, color: HBC_COLORS.navy }}>{p.jobNumber}</span>
      ),
    },
    {
      key: 'projectName',
      header: 'Project Name',
      render: (p) => (
        <div>
          <div style={{ fontWeight: 500 }}>{p.projectName}</div>
          {p.statusComments && (
            <div style={{ fontSize: '12px', color: HBC_COLORS.gray500, marginTop: '2px' }}>
              {p.statusComments}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (p) => {
        const config = STATUS_COLORS[p.status];
        return <StatusBadge label={p.status} color={config.color} backgroundColor={config.bg} />;
      },
    },
    {
      key: 'sector',
      header: 'Sector',
      width: '100px',
      render: (p) => p.sector,
    },
    {
      key: 'projectExecutive',
      header: 'PX',
      width: '130px',
      render: (p) => (
        <span
          style={{ cursor: 'pointer', color: HBC_COLORS.navy, textDecoration: 'underline' }}
          onClick={(e) => {
            e.stopPropagation();
            if (p.personnel.projectExecutive) handlePersonnelClick(p.personnel.projectExecutive);
          }}
        >
          {p.personnel.projectExecutive || '-'}
        </span>
      ),
    },
    {
      key: 'leadPM',
      header: 'Lead PM',
      width: '130px',
      render: (p) => (
        <span
          style={{ cursor: 'pointer', color: HBC_COLORS.navy, textDecoration: 'underline' }}
          onClick={(e) => {
            e.stopPropagation();
            if (p.personnel.leadPM) handlePersonnelClick(p.personnel.leadPM);
          }}
        >
          {p.personnel.leadPM || '-'}
        </span>
      ),
    },
    {
      key: 'currentContractValue',
      header: 'Contract Value',
      width: '120px',
      render: (p) => formatCurrencyCompact(p.financials.currentContractValue || p.financials.originalContract),
    },
    {
      key: 'billingsToDate',
      header: 'Billed',
      width: '100px',
      render: (p) => formatCurrencyCompact(p.financials.billingsToDate),
    },
    {
      key: 'unbilled',
      header: 'Unbilled',
      width: '100px',
      render: (p) => {
        const unbilled = p.financials.unbilled || 0;
        const contractValue = p.financials.currentContractValue || p.financials.originalContract || 0;
        const unbilledPct = contractValue > 0 ? (unbilled / contractValue) * 100 : 0;
        
        let style: React.CSSProperties = {};
        if (unbilledPct >= 25) {
          style = { color: ALERT_COLORS.critical.color, fontWeight: 600 };
        } else if (unbilledPct >= 15) {
          style = { color: ALERT_COLORS.warning.color, fontWeight: 600 };
        }
        
        return <span style={style}>{formatCurrencyCompact(unbilled)}</span>;
      },
    },
    {
      key: 'percentComplete',
      header: '% Complete',
      width: '100px',
      render: (p) => {
        const pct = p.schedule.percentComplete || 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '60px',
              height: '8px',
              backgroundColor: HBC_COLORS.gray200,
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: pct >= 75 ? HBC_COLORS.success : pct >= 50 ? HBC_COLORS.warning : HBC_COLORS.info,
                borderRadius: '4px',
              }} />
            </div>
            <span style={{ fontSize: '12px', color: HBC_COLORS.gray600 }}>{pct}%</span>
          </div>
        );
      },
    },
    {
      key: 'alerts',
      header: 'Alerts',
      width: '80px',
      render: (p) => {
        const alerts: string[] = [];
        if (p.hasUnbilledAlert) alerts.push('💰');
        if (p.hasScheduleAlert) alerts.push('📅');
        if (p.hasFeeErosionAlert) alerts.push('📉');
        return alerts.length > 0 ? (
          <span title={`${alerts.length} alert(s)`}>{alerts.join(' ')}</span>
        ) : (
          <span style={{ color: HBC_COLORS.success }}>✓</span>
        );
      },
    },
  ], [handlePersonnelClick]);

  // Data Mart enriched columns
  const dataMartColumns: IHbcDataTableColumn<IProjectDataMart>[] = React.useMemo(() => [
    { key: 'jobNumber', header: 'Job #', width: '90px', render: (r) => <span style={{ fontWeight: 600, color: HBC_COLORS.navy }}>{r.jobNumber}</span> },
    { key: 'projectName', header: 'Project', render: (r) => r.projectName },
    { key: 'overallHealth', header: 'Health', width: '80px', render: (r) => {
      const c = HEALTH_COLORS[r.overallHealth];
      return <StatusBadge label={r.overallHealth} color={c.color} backgroundColor={c.bg} />;
    }},
    { key: 'currentContractValue', header: 'Contract', width: '110px', render: (r) => formatCurrencyCompact(r.currentContractValue) },
    { key: 'percentComplete', header: '% Complete', width: '100px', render: (r) => formatPercent(r.percentComplete) },
    { key: 'openQualityConcerns', header: 'Quality', width: '70px', render: (r) => <span style={{ color: r.openQualityConcerns > 0 ? HBC_COLORS.warning : HBC_COLORS.gray500 }}>{r.openQualityConcerns}</span> },
    { key: 'openSafetyConcerns', header: 'Safety', width: '70px', render: (r) => <span style={{ color: r.openSafetyConcerns > 0 ? HBC_COLORS.error : HBC_COLORS.gray500 }}>{r.openSafetyConcerns}</span> },
    { key: 'buyoutExecutedCount', header: 'Buyout', width: '70px', render: (r) => `${r.buyoutExecutedCount}/${r.buyoutExecutedCount + r.buyoutOpenCount}` },
    { key: 'alerts', header: 'Alerts', width: '80px', render: (r) => {
      const alerts: string[] = [];
      if (r.hasUnbilledAlert) alerts.push('Unbilled');
      if (r.hasScheduleAlert) alerts.push('Schedule');
      if (r.hasFeeErosionAlert) alerts.push('Fee');
      return alerts.length > 0
        ? <span style={{ color: HBC_COLORS.error, fontSize: '12px' }}>{alerts.length}</span>
        : <span style={{ color: HBC_COLORS.success }}>&#10003;</span>;
    }},
  ], []);

  // Export data
  const exportData = React.useMemo(() =>
    filteredProjects.map(p => ({
      'Job #': p.jobNumber,
      'Project Name': p.projectName,
      'Status': p.status,
      'Sector': p.sector,
      'Region': p.region || '',
      'PX': p.personnel.projectExecutive || '',
      'Lead PM': p.personnel.leadPM || '',
      'Original Contract': p.financials.originalContract || '',
      'Current Contract': p.financials.currentContractValue || '',
      'Billings to Date': p.financials.billingsToDate || '',
      'Unbilled': p.financials.unbilled || '',
      'Projected Fee %': p.financials.projectedFeePct || '',
      '% Complete': p.schedule.percentComplete || '',
      'Completion Date': p.schedule.substantialCompletionDate || '',
    })),
  [filteredProjects]);

  if (isLoading && !summary) return (
    <div>
      <SkeletonLoader variant="kpi-grid" columns={isMobile ? 2 : 6} style={{ marginBottom: '24px' }} />
      <SkeletonLoader variant="table" rows={8} columns={6} />
    </div>
  );

  const kpiGridCols = isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))';
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
    <FeatureGate featureName="ExecutiveDashboard">
      <RoleGate
        allowedRoles={[RoleName.ExecutiveLeadership, RoleName.DepartmentDirector, RoleName.OperationsTeam]}
        fallback={
          <div style={{ padding: '48px', textAlign: 'center', color: HBC_COLORS.gray500 }}>
            <h3>Access Restricted</h3>
            <p>The Active Projects Dashboard is restricted to Executive Leadership, Department Directors, and Operations Team.</p>
          </div>
        }
      >
        <div id="active-projects-dashboard">
          <PageHeader
            title="Active Projects Portfolio"
            subtitle="Real-time portfolio-wide view of financial and operational health"
            breadcrumb={<Breadcrumb items={breadcrumbs} />}
            actions={
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0' }}>
                  {(['standard', 'datamart'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      style={{
                        padding: '6px 14px', fontSize: '12px', fontWeight: viewMode === mode ? 600 : 400,
                        color: viewMode === mode ? '#fff' : HBC_COLORS.gray600,
                        backgroundColor: viewMode === mode ? HBC_COLORS.navy : '#fff',
                        border: `1px solid ${viewMode === mode ? HBC_COLORS.navy : HBC_COLORS.gray300}`,
                        borderRadius: mode === 'standard' ? '4px 0 0 4px' : '0 4px 4px 0',
                        cursor: 'pointer',
                      }}
                    >
                      {mode === 'standard' ? 'Standard' : 'Data Mart'}
                    </button>
                  ))}
                </div>
                <Button
                  appearance="outline"
                  onClick={() => {
                    addToast('Sync started', 'info', 0, { progress: 10 });
                    triggerFullSync();
                    addToast('Portfolio sync completed', 'success', 3500, {
                      actionLabel: 'Retry',
                      onAction: () => triggerFullSync(),
                      undoLabel: 'Dismiss',
                      onUndo: () => undefined,
                    });
                  }}
                  disabled={isLoading}
                >
                  Sync All
                </Button>
                <ExportButtons
                  data={exportData}
                  pdfElementId="active-projects-dashboard"
                  filename="active-projects-portfolio"
                  title="Active Projects Portfolio"
                />
              </div>
            }
          />

          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: HBC_COLORS.errorLight,
              color: HBC_COLORS.error,
              borderRadius: '6px',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          {/* KPI Cards */}
          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: kpiGridCols, gap: '16px', marginBottom: '24px' }}>
              <KPICard
                title="Total Backlog"
                value={formatCurrencyCompact(summary.totalBacklog)}
                subtitle="Remaining contract value"
              />
              <KPICard
                title="Active Projects"
                value={summary.projectCount}
                subtitle={`${summary.projectsByStatus['Construction']} in construction`}
              />
              <KPICard
                title="Avg Fee %"
                value={formatPercent(summary.averageFeePct)}
                subtitle="Across portfolio"
              />
              <KPICard
                title="Monthly Burn Rate"
                value={formatCurrencyCompact(summary.monthlyBurnRate)}
                subtitle="Billing velocity"
              />
              <KPICard
                title="Total Unbilled"
                value={formatCurrencyCompact(summary.totalUnbilled)}
                subtitle="Cash flow opportunity"
              />
              <KPICard
                title="Projects with Alerts"
                value={summary.projectsWithAlerts}
                subtitle={summary.projectsWithAlerts > 0 ? 'Requires attention' : 'All healthy'}
              />
            </div>
          )}

          {/* Filters */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: ELEVATION.level1,
          }}>
            <Input
              placeholder="Search projects..."
              value={filters.searchQuery || ''}
              onChange={(_, data) => setFilters({ ...filters, searchQuery: data.value })}
              style={{ minWidth: '200px' }}
            />
            <Select
              aria-label="Filter projects by status"
              value={filters.status || ''}
              onChange={(_, d) => setFilters({ ...filters, status: d.value as ProjectStatus || undefined })}
              style={{ minWidth: '140px' }}
            >
              <option value="">All Statuses</option>
              <option value="Precon">Precon</option>
              <option value="Construction">Construction</option>
              <option value="Final Payment">Final Payment</option>
            </Select>
            <Select
              aria-label="Filter projects by sector"
              value={filters.sector || ''}
              onChange={(_, d) => setFilters({ ...filters, sector: d.value as SectorType || undefined })}
              style={{ minWidth: '140px' }}
            >
              <option value="">All Sectors</option>
              <option value="Commercial">Commercial</option>
              <option value="Residential">Residential</option>
            </Select>
            <Select
              aria-label="Filter projects by project executive"
              value={filters.projectExecutive || ''}
              onChange={(_, d) => setFilters({ ...filters, projectExecutive: d.value || undefined })}
              style={{ minWidth: '160px' }}
            >
              <option value="">All PX</option>
              {uniqueProjectExecutives.map(px => (
                <option key={px} value={px}>{px}</option>
              ))}
            </Select>
            <Select
              aria-label="Filter projects by project manager"
              value={filters.projectManager || ''}
              onChange={(_, d) => setFilters({ ...filters, projectManager: d.value || undefined })}
              style={{ minWidth: '160px' }}
            >
              <option value="">All PM</option>
              {uniqueProjectManagers.map(pm => (
                <option key={pm} value={pm}>{pm}</option>
              ))}
            </Select>
            <Select
              aria-label="Filter projects by region"
              value={filters.region || ''}
              onChange={(_, d) => setFilters({ ...filters, region: d.value || undefined })}
              style={{ minWidth: '140px' }}
            >
              <option value="">All Regions</option>
              {uniqueRegions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
            {(filters.status || filters.sector || filters.projectExecutive || filters.projectManager || filters.region || filters.searchQuery) && (
              <Button appearance="subtle" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {/* Charts Grid */}
          <div className={`${enableDelightMotion ? motionStyles.optimisticFade : ''} ${isSyncActive ? motionStyles.chartTableGlowActive : ''}`} style={{ display: 'grid', gridTemplateColumns: chartGridCols, gap: '16px', marginBottom: '24px' }}>
            {/* Status Distribution */}
            <div>
              {sectionTitle('Projects by Status')}
              <div style={chartCardStyle}>
                <HbcEChart
                  option={statusChartOption}
                  height={250}
                  empty={statusChartData.length === 0}
                  ariaLabel="Projects by status distribution"
                  onEvents={chartEvents}
                />
              </div>
            </div>

            {/* Sector Distribution */}
            <div>
              {sectionTitle('Projects by Sector')}
              <div style={chartCardStyle}>
                <HbcEChart
                  option={sectorChartOption}
                  height={250}
                  empty={sectorChartData.length === 0}
                  ariaLabel="Projects by sector distribution"
                  onEvents={chartEvents}
                />
              </div>
            </div>

            {/* Backlog by Region */}
            <div style={{ gridColumn: isMobile ? undefined : '1 / -1' }}>
              {sectionTitle('Backlog by Region')}
              <div style={chartCardStyle}>
                <HbcEChart
                  option={regionBacklogOption}
                  height={Math.max(200, regionBacklogData.length * 50)}
                  empty={regionBacklogData.length === 0}
                  ariaLabel="Remaining contract backlog by region"
                  onEvents={chartEvents}
                />
              </div>
            </div>
          </div>

          {/* Projects with Alerts */}
          {projectsWithAlerts.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              {sectionTitle(`Projects Requiring Attention (${projectsWithAlerts.length})`)}
              <div style={{
                backgroundColor: HBC_COLORS.warningLight,
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {projectsWithAlerts.slice(0, 5).map(p => (
                    <div
                      key={p.id}
                      style={{
                        backgroundColor: '#fff',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        boxShadow: ELEVATION.level1,
                      }}
                      onClick={() => { setSelectedProject({ projectCode: p.projectCode, projectName: p.projectName, stage: Stage.ActiveConstruction, region: p.region }); navigate('/operations/project'); }}
                    >
                      <span style={{ fontWeight: 600 }}>{p.jobNumber}</span>
                      <span style={{ marginLeft: '8px', color: HBC_COLORS.gray600 }}>{p.projectName}</span>
                      <span style={{ marginLeft: '8px' }}>
                        {p.hasUnbilledAlert && '💰'}
                        {p.hasScheduleAlert && '📅'}
                        {p.hasFeeErosionAlert && '📉'}
                      </span>
                    </div>
                  ))}
                  {projectsWithAlerts.length > 5 && (
                    <div style={{ padding: '8px 12px', color: HBC_COLORS.gray600 }}>
                      +{projectsWithAlerts.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Project Grid */}
          <div>
            {viewMode === 'standard' ? (
              <>
                {sectionTitle(`All Projects (${filteredProjects.length})`)}
                <HbcDataTable<IActiveProject>
                  tableId="active-projects-standard"
                  columns={columns}
                  items={filteredProjects}
                  keyExtractor={(p) => p.id}
                  onRowClick={(p) => {
                    setSelectedProject({
                      projectCode: p.projectCode,
                      projectName: p.projectName,
                      stage: Stage.ActiveConstruction,
                      region: p.region,
                    });
                    navigate('/operations/project');
                  }}
                  emptyTitle="No projects found"
                  emptyDescription="Try adjusting your filters"
                  pageSize={20}
                  virtualization={{ enabled: true, threshold: 200 }}
                  ariaLabel="Active projects table"
                  linkedChartId="active-projects-overview-chart"
                  onChartLinkHighlight={(payload) => setHighlightedProjectId(payload.rowKey)}
                  motion={{ enabled: enableDelightMotion, durationMs: 220 }}
                />
              </>
            ) : (
              <>
                {sectionTitle(`Data Mart View (${dataMartRecords.length})`)}
                <HbcDataTable<IProjectDataMart>
                  tableId="active-projects-datamart"
                  columns={dataMartColumns}
                  items={dataMartRecords}
                  keyExtractor={(r) => r.id}
                  onRowClick={(r) => {
                    setSelectedProject({
                      projectCode: r.projectCode,
                      projectName: r.projectName,
                      stage: Stage.ActiveConstruction,
                    });
                    navigate('/operations/project');
                  }}
                  emptyTitle="No Data Mart records"
                  emptyDescription="Run a sync to populate Data Mart"
                  pageSize={20}
                  virtualization={{ enabled: true, threshold: 200 }}
                  ariaLabel="Data mart projects table"
                  linkedChartId="active-projects-overview-chart"
                  onChartLinkHighlight={(payload) => setHighlightedProjectId(payload.rowKey)}
                  motion={{ enabled: enableDelightMotion, durationMs: 220 }}
                />
              </>
            )}
          </div>
          {highlightedProjectId !== null && (
            <div style={{ fontSize: '12px', color: HBC_COLORS.gray500, marginTop: '8px' }}>
              Highlighted project key: {String(highlightedProjectId)}
            </div>
          )}

          {/* Personnel Workload Panel */}
          {showPersonnelPanel && selectedPersonnel && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: isMobile ? '100%' : '400px',
                height: '100%',
                backgroundColor: '#fff',
                boxShadow: '-4px 0 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                overflow: 'auto',
              }}
            >
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, color: HBC_COLORS.navy }}>{selectedPersonnel}</h3>
                  <Button
                    appearance="subtle"
                    onClick={() => {
                      setShowPersonnelPanel(false);
                      setSelectedPersonnel(null);
                      clearFilters();
                    }}
                  >
                    ✕
                  </Button>
                </div>
                
                {/* Personnel Summary */}
                {(() => {
                  const workload = personnelWorkload.find(w => w.name === selectedPersonnel);
                  if (!workload) return null;
                  
                  return (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        marginBottom: '16px',
                      }}>
                        <div style={{
                          padding: '16px',
                          backgroundColor: HBC_COLORS.gray50,
                          borderRadius: '8px',
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: HBC_COLORS.navy }}>
                            {workload.projectCount}
                          </div>
                          <div style={{ fontSize: '12px', color: HBC_COLORS.gray600 }}>Projects</div>
                        </div>
                        <div style={{
                          padding: '16px',
                          backgroundColor: HBC_COLORS.gray50,
                          borderRadius: '8px',
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: HBC_COLORS.navy }}>
                            {formatCurrencyCompact(workload.totalContractValue)}
                          </div>
                          <div style={{ fontSize: '12px', color: HBC_COLORS.gray600 }}>Total Value</div>
                        </div>
                      </div>
                      
                      <h4 style={{ margin: '0 0 12px 0', color: HBC_COLORS.navy }}>Assigned Projects</h4>
                      {workload.projects.map(p => (
                        <div
                          key={p.id}
                          style={{
                            padding: '12px',
                            backgroundColor: HBC_COLORS.gray50,
                            borderRadius: '6px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                          }}
                          onClick={() => { setSelectedProject({ projectCode: p.projectCode, projectName: p.projectName, stage: Stage.ActiveConstruction, region: p.region }); navigate('/operations/project'); }}
                        >
                          <div style={{ fontWeight: 600, color: HBC_COLORS.navy }}>{p.jobNumber}</div>
                          <div style={{ fontSize: '14px' }}>{p.projectName}</div>
                          <div style={{ fontSize: '12px', color: HBC_COLORS.gray500, marginTop: '4px' }}>
                            {p.status} • {formatCurrencyCompact(p.financials.currentContractValue || p.financials.originalContract)}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
          
          {/* Overlay for panel */}
          {showPersonnelPanel && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.3)',
                zIndex: 999,
              }}
              onClick={() => {
                setShowPersonnelPanel(false);
                setSelectedPersonnel(null);
                clearFilters();
              }}
            />
          )}
        </div>
      </RoleGate>
    </FeatureGate>
  );
};
