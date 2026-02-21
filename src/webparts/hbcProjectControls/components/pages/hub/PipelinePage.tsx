import * as React from 'react';
import { useNavigate, useLocation } from '@router';
import { Button, Select } from '@fluentui/react-components';
import { useLeads } from '../../hooks/useLeads';
import { useGoNoGo } from '../../hooks/useGoNoGo';
import { useDataMart } from '../../hooks/useDataMart';
import { useAppContext } from '../../contexts/AppContext';
import { useResponsive } from '../../hooks/useResponsive';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import {
  buildBreadcrumbs,
  ILead,
  IGoNoGoScorecard,
  Stage,
  Region,
  Sector,
  Division,
  GoNoGoDecision,
  ScorecardStatus,
  formatCurrencyCompact,
  formatDate,
  formatPercent,
  isActiveStage,
  PERMISSIONS
} from '@hbc/sp-services';
import { KPICard } from '../../shared/KPICard';
import { PipelineChart } from '../../shared/PipelineChart';
import { StageBadge } from '../../shared/StageBadge';
import { StatusBadge } from '../../shared/StatusBadge';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { ExportButtons } from '../../shared/ExportButtons';
import { FeatureGate } from '../../guards/FeatureGate';
import { useSectorDefinitions } from '../../hooks/useSectorDefinitions';
import { HBC_COLORS } from '../../../theme/tokens';
import { HbcTanStackTable } from '../../../tanstack/table/HbcTanStackTable';
import type { IHbcTanStackTableColumn } from '../../../tanstack/table/types';

const TAB_PATHS = ['/preconstruction/pipeline', '/preconstruction/pipeline/gonogo'];
const TAB_LABELS = ['Pipeline', 'Go/No-Go Tracker'];

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  [ScorecardStatus.BDDraft]: { color: HBC_COLORS.gray700, bg: HBC_COLORS.gray100 },
  [ScorecardStatus.AwaitingDirectorReview]: { color: '#92400E', bg: '#FEF3C7' },
  [ScorecardStatus.DirectorReturnedForRevision]: { color: '#9A3412', bg: '#FFEDD5' },
  [ScorecardStatus.AwaitingCommitteeScoring]: { color: '#1E40AF', bg: HBC_COLORS.infoLight },
  [ScorecardStatus.CommitteeReturnedForRevision]: { color: '#9A3412', bg: '#FFEDD5' },
  [ScorecardStatus.Rejected]: { color: '#991B1B', bg: HBC_COLORS.errorLight },
  [ScorecardStatus.NoGo]: { color: '#991B1B', bg: HBC_COLORS.errorLight },
  [ScorecardStatus.Go]: { color: '#065F46', bg: HBC_COLORS.successLight },
  [ScorecardStatus.Locked]: { color: HBC_COLORS.gray600, bg: HBC_COLORS.gray200 },
  [ScorecardStatus.Unlocked]: { color: '#92400E', bg: '#FEF3C7' },
};

const PENDING_STATUSES = [
  ScorecardStatus.BDDraft,
  ScorecardStatus.AwaitingDirectorReview,
  ScorecardStatus.DirectorReturnedForRevision,
  ScorecardStatus.AwaitingCommitteeScoring,
  ScorecardStatus.CommitteeReturnedForRevision,
  ScorecardStatus.Unlocked,
];

const ARCHIVE_STATUSES = [
  ScorecardStatus.Go,
  ScorecardStatus.NoGo,
  ScorecardStatus.Rejected,
  ScorecardStatus.Locked,
];

function pathToTab(pathname: string): number {
  // Support both /preconstruction/pipeline/gonogo and legacy /preconstruction/gonogo
  if (pathname === '/preconstruction/pipeline/gonogo' || pathname === '/preconstruction/gonogo') return 1;
  if (pathname === '/preconstruction/pipeline') return 0;
  return 0;
}

export const PipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = pathToTab(location.pathname);
  const breadcrumbs = React.useMemo(() => buildBreadcrumbs(location.pathname), [location.pathname]);
  const { hasPermission, isFeatureEnabled } = useAppContext();
  const { activeSectors } = useSectorDefinitions();
  const { leads, totalCount, isLoading } = useLeads();
  const { healthDistribution } = useDataMart();
  const { isMobile } = useResponsive();

  // Pipeline tab state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [chartMode, setChartMode] = React.useState<'count' | 'value'>('count');
  const [stageFilter, setStageFilter] = React.useState<string>('all');
  const [regionFilter, setRegionFilter] = React.useState<string>('all');
  const [sectorFilter, setSectorFilter] = React.useState<string>('all');
  const [divisionFilter, setDivisionFilter] = React.useState<string>('all');
  const [sortField, setSortField] = React.useState<string>('DateSubmitted');
  const [sortAsc, setSortAsc] = React.useState(false);

  // Go/No-Go tab state
  const { scorecards } = useGoNoGo();
  const [gonogoSubTab, setGonogoSubTab] = React.useState<'pending' | 'archive'>('pending');
  const [gonogoRegionFilter, setGonogoRegionFilter] = React.useState('All');
  const [gonogoSectorFilter, setGonogoSectorFilter] = React.useState('All');
  const [gonogoBdRepFilter, setGonogoBdRepFilter] = React.useState('All');
  const [gonogoStatusFilter, setGonogoStatusFilter] = React.useState<string[]>([]);
  const [gonogoSortField, setGonogoSortField] = React.useState<string>('');
  const [gonogoSortAsc, setGonogoSortAsc] = React.useState(true);

  const handleSort = (field: string): void => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleGonogoSort = React.useCallback((field: string) => {
    setGonogoSortField(prev => {
      if (prev === field) { setGonogoSortAsc(a => !a); return field; }
      setGonogoSortAsc(true);
      return field;
    });
  }, []);

  // --- Pipeline tab data ---
  const filteredLeads = React.useMemo(() => {
    let result = [...leads];
    if (stageFilter !== 'all') result = result.filter(l => l.Stage === stageFilter);
    if (regionFilter !== 'all') result = result.filter(l => l.Region === regionFilter);
    if (sectorFilter !== 'all') result = result.filter(l => l.Sector === sectorFilter);
    if (divisionFilter !== 'all') result = result.filter(l => l.Division === divisionFilter);

    result.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField];
      const bVal = (b as unknown as Record<string, unknown>)[sortField];
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [leads, stageFilter, regionFilter, sectorFilter, divisionFilter, sortField, sortAsc]);

  const exportData = React.useMemo(() =>
    filteredLeads.map(l => ({
      Project: l.Title,
      Client: l.ClientName,
      Region: l.Region,
      Sector: l.Sector,
      Division: l.Division,
      Value: l.ProjectValue || '',
      Stage: l.Stage,
      Originator: l.Originator,
      Score: l.GoNoGoScore_Originator ?? '',
    })),
  [filteredLeads]);

  const columns: IHbcTanStackTableColumn<ILead>[] = React.useMemo(() => [
    {
      key: 'Title',
      header: 'Project',
      sortable: true,
      render: (lead) => <span style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{lead.Title}</span>,
    },
    {
      key: 'ClientName',
      header: 'Client',
      sortable: true,
      render: (lead) => lead.ClientName,
    },
    {
      key: 'Region',
      header: 'Region',
      sortable: true,
      render: (lead) => lead.Region,
    },
    {
      key: 'Sector',
      header: 'Sector',
      sortable: true,
      render: (lead) => lead.Sector,
    },
    {
      key: 'Division',
      header: 'Division',
      sortable: true,
      render: (lead) => lead.Division,
      hideOnMobile: true,
    },
    {
      key: 'ProjectValue',
      header: 'Value',
      sortable: true,
      render: (lead) => lead.ProjectValue ? formatCurrencyCompact(lead.ProjectValue) : '-',
    },
    {
      key: 'ProposalBidDue',
      header: 'Due Date',
      sortable: true,
      render: (lead) => lead.ProposalBidDue ? formatDate(lead.ProposalBidDue) : '-',
      hideOnMobile: true,
    },
    {
      key: 'Stage',
      header: 'Stage',
      sortable: true,
      render: (lead) => <StageBadge stage={lead.Stage} />,
    },
    {
      key: 'Originator',
      header: 'Originator',
      sortable: true,
      render: (lead) => lead.Originator,
    },
    {
      key: 'DateSubmitted',
      header: 'Created',
      sortable: true,
      hideOnMobile: true,
      render: (lead) => lead.DateSubmitted ? formatDate(lead.DateSubmitted) : '-',
    },
    {
      key: 'GoNoGoScore_Originator',
      header: 'Score',
      sortable: true,
      render: (lead) => <>{lead.GoNoGoScore_Originator ?? '-'}</>,
    },
  ], []);

  const kpis = React.useMemo(() => {
    const active = filteredLeads.filter(l => isActiveStage(l.Stage));
    const totalPipelineValue = active.reduce((sum, l) => sum + (l.ProjectValue || 0), 0);
    const activePursuits = active.length;
    const now = new Date();
    const thisMonth = filteredLeads.filter(l => {
      if (!l.DateOfEvaluation) return false;
      const d = new Date(l.DateOfEvaluation);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    const won = filteredLeads.filter(l => l.GoNoGoDecision === GoNoGoDecision.Go && l.Stage !== Stage.ArchivedNoGo).length;
    const lost = filteredLeads.filter(l => l.Stage === Stage.ArchivedLoss || l.Stage === Stage.ArchivedNoGo).length;
    const winRate = won + lost > 0 ? (won / (won + lost)) * 100 : 0;
    return { totalPipelineValue, activePursuits, thisMonth, winRate };
  }, [filteredLeads]);

  const hasActiveFilters = stageFilter !== 'all' || regionFilter !== 'all' || sectorFilter !== 'all' || divisionFilter !== 'all';

  const clearFilters = (): void => {
    setStageFilter('all');
    setRegionFilter('all');
    setSectorFilter('all');
    setDivisionFilter('all');
  };

  // --- Go/No-Go tab data ---

  // Join scorecards with leads
  interface IScorecardRow {
    scorecard: IGoNoGoScorecard;
    lead: ILead | null;
    id: number;
    title: string;
    originator: string;
    region: string;
    sector: string;
    status: string;
    lastDate: string;
  }

  const allScorecardRows = React.useMemo((): IScorecardRow[] => {
    const leadMap = new Map(leads.map(l => [l.id, l]));
    return scorecards.map(sc => {
      const lead = leadMap.get(sc.LeadID) || null;
      return {
        scorecard: sc,
        lead,
        id: sc.id,
        title: lead?.Title || `Lead #${sc.LeadID}`,
        originator: lead?.Originator || '',
        region: lead?.Region || '',
        sector: lead?.Sector || '',
        status: sc.scorecardStatus || ScorecardStatus.BDDraft,
        lastDate: sc.DecisionDate || sc.finalDecisionDate || sc.committeeScoresEnteredDate || '',
      };
    });
  }, [scorecards, leads]);

  const pendingRows = React.useMemo(
    () => allScorecardRows.filter(r => !r.scorecard.isArchived && PENDING_STATUSES.includes(r.status as ScorecardStatus)),
    [allScorecardRows]
  );

  const archiveRows = React.useMemo(
    () => allScorecardRows.filter(r =>
      r.scorecard.isArchived || ARCHIVE_STATUSES.includes(r.status as ScorecardStatus)
    ),
    [allScorecardRows]
  );

  const activeGonogoRows = gonogoSubTab === 'pending' ? pendingRows : archiveRows;

  // Filter options from data
  const gonogoRegions = React.useMemo(() => {
    const r = new Set<string>();
    activeGonogoRows.forEach(row => { if (row.region) r.add(row.region); });
    return ['All', ...Array.from(r).sort()];
  }, [activeGonogoRows]);

  const gonogoSectors = React.useMemo(() => {
    const s = new Set<string>();
    activeGonogoRows.forEach(row => { if (row.sector) s.add(row.sector); });
    return ['All', ...Array.from(s).sort()];
  }, [activeGonogoRows]);

  const gonogoBdReps = React.useMemo(() => {
    const b = new Set<string>();
    activeGonogoRows.forEach(row => { if (row.originator) b.add(row.originator); });
    return ['All', ...Array.from(b).sort()];
  }, [activeGonogoRows]);

  const gonogoStatusOptions = gonogoSubTab === 'pending' ? PENDING_STATUSES : ARCHIVE_STATUSES;

  // Apply filters
  const gonogoFiltered = React.useMemo(() => {
    let result = activeGonogoRows;
    if (gonogoRegionFilter !== 'All') result = result.filter(r => r.region === gonogoRegionFilter);
    if (gonogoSectorFilter !== 'All') result = result.filter(r => r.sector === gonogoSectorFilter);
    if (gonogoBdRepFilter !== 'All') result = result.filter(r => r.originator === gonogoBdRepFilter);
    if (gonogoStatusFilter.length > 0) result = result.filter(r => gonogoStatusFilter.includes(r.status));
    return result;
  }, [activeGonogoRows, gonogoRegionFilter, gonogoSectorFilter, gonogoBdRepFilter, gonogoStatusFilter]);

  const gonogoColumns: IHbcTanStackTableColumn<IScorecardRow>[] = React.useMemo(() => [
    { key: 'title', header: 'Lead Title', sortable: true,
      render: (r) => (
        <span
          style={{ fontWeight: 500, color: HBC_COLORS.navy, cursor: 'pointer', textDecoration: 'underline' }}
          onClick={(e) => { e.stopPropagation(); if (r.lead) navigate(`/lead/${r.lead.id}/gonogo`); }}
        >
          {r.title}
        </span>
      ),
    },
    { key: 'originator', header: 'BD Rep', sortable: true, render: (r) => r.originator, hideOnMobile: true },
    { key: 'region', header: 'Region', sortable: true, width: '120px', render: (r) => r.region },
    { key: 'sector', header: 'Sector', sortable: true, width: '120px', render: (r) => r.sector, hideOnMobile: true },
    { key: 'status', header: 'Status', sortable: true, width: '180px',
      render: (r) => {
        const colors = STATUS_COLORS[r.status] || { color: HBC_COLORS.gray700, bg: HBC_COLORS.gray100 };
        return <StatusBadge label={r.status} color={colors.color} backgroundColor={colors.bg} />;
      },
    },
    { key: 'lastDate', header: 'Date', sortable: true, width: '100px',
      render: (r) => r.lastDate ? formatDate(r.lastDate) : '-' },
    { key: 'scores', header: 'Score (Orig / Cmte)', width: '140px',
      render: (r) => <span>{r.scorecard.TotalScore_Orig ?? '-'} / {r.scorecard.TotalScore_Cmte ?? '-'}</span> },
  ], [navigate]);

  const gonogoExportData = React.useMemo(() =>
    gonogoFiltered.map(r => ({
      'Lead Title': r.title,
      'BD Rep': r.originator,
      Region: r.region,
      Sector: r.sector,
      Status: r.status,
      Date: r.lastDate,
      'Originator Score': r.scorecard.TotalScore_Orig ?? '',
      'Committee Score': r.scorecard.TotalScore_Cmte ?? '',
    })),
  [gonogoFiltered]);

  const hasGonogoFilters = gonogoRegionFilter !== 'All' || gonogoSectorFilter !== 'All' || gonogoBdRepFilter !== 'All' || gonogoStatusFilter.length > 0;

  const clearGonogoFilters = (): void => {
    setGonogoRegionFilter('All');
    setGonogoSectorFilter('All');
    setGonogoBdRepFilter('All');
    setGonogoStatusFilter([]);
  };

  if (isLoading) return <SkeletonLoader variant="table" rows={8} columns={5} />;

  const tabStyle = (idx: number): React.CSSProperties => ({
    padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === idx ? 600 : 400,
    color: activeTab === idx ? HBC_COLORS.navy : HBC_COLORS.gray500,
    borderBottom: activeTab === idx ? `3px solid ${HBC_COLORS.orange}` : '3px solid transparent',
    transition: 'all 0.2s',
  });

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px', borderRadius: '6px', border: `1px solid ${HBC_COLORS.gray200}`,
    fontSize: '13px', backgroundColor: '#fff', color: HBC_COLORS.gray800,
  };

  return (
    <FeatureGate featureName="PipelineDashboard">
      <div id="pipeline-view">
        <PageHeader
          title={activeTab === 0 ? 'Project Pipeline' : 'Go/No-Go Tracker'}
          subtitle={activeTab === 0
            ? `${totalCount} leads across all stages`
            : `${gonogoFiltered.length} scorecards — ${gonogoSubTab === 'pending' ? 'In Progress' : 'Completed / Archived'}`}
          breadcrumb={<Breadcrumb items={breadcrumbs} />}
          actions={
            activeTab === 0 ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <ExportButtons data={exportData} filename="pipeline-export" title="Project Pipeline" />
                {hasPermission(PERMISSIONS.LEAD_CREATE) && (
                  <Button appearance="primary" onClick={() => navigate('/lead/new')}>New Lead</Button>
                )}
              </div>
            ) : (
              <ExportButtons
                data={gonogoExportData}
                pdfElementId="pipeline-view"
                filename="gonogo-tracker"
                title="Go/No-Go Tracker"
              />
            )
          }
        />

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${HBC_COLORS.gray200}`, marginBottom: '20px' }}>
          {TAB_LABELS.map((label, idx) => (
            <div
              key={idx}
              style={tabStyle(idx)}
              onClick={() => navigate(TAB_PATHS[idx])}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Tab 0: Pipeline */}
        {activeTab === 0 && (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <KPICard title="Total Pipeline Value" value={formatCurrencyCompact(kpis.totalPipelineValue)} subtitle={`${kpis.activePursuits} active projects`} />
              <KPICard title="Active Pursuits" value={kpis.activePursuits} subtitle="Across all active stages" />
              <KPICard title="Leads This Month" value={kpis.thisMonth} subtitle={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
              <KPICard title="Win Rate" value={formatPercent(kpis.winRate)} subtitle="GO / (GO + Archived)" />
            </div>

            {/* Portfolio Health Badge */}
            {(healthDistribution.Green + healthDistribution.Yellow + healthDistribution.Red) > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '12px',
                padding: '8px 16px', marginBottom: '24px',
                backgroundColor: '#fff', borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${HBC_COLORS.gray200}`,
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: HBC_COLORS.navy }}>Portfolio Health</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: HBC_COLORS.success, display: 'inline-block' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{healthDistribution.Green}</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: HBC_COLORS.warning, display: 'inline-block' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{healthDistribution.Yellow}</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: HBC_COLORS.error, display: 'inline-block' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{healthDistribution.Red}</span>
                </span>
              </div>
            )}

            {/* Pipeline Chart */}
            <div style={{ marginBottom: '24px' }}>
              <PipelineChart leads={filteredLeads} mode={chartMode} />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Select aria-label="Filter pipeline by stage" value={stageFilter} onChange={(_, data) => setStageFilter(data.value)} style={{ minWidth: '160px' }}>
                <option value="all">All Stages</option>
                {Object.values(Stage).map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Select aria-label="Filter pipeline by region" value={regionFilter} onChange={(_, data) => setRegionFilter(data.value)} style={{ minWidth: '160px' }}>
                <option value="all">All Regions</option>
                {Object.values(Region).map(r => <option key={r} value={r}>{r}</option>)}
              </Select>
              <Select aria-label="Filter pipeline by sector" value={sectorFilter} onChange={(_, data) => setSectorFilter(data.value)} style={{ minWidth: '160px' }}>
                <option value="all">All Sectors</option>
                {(isFeatureEnabled('PermissionEngine') && activeSectors.length > 0
                  ? activeSectors.map(s => <option key={s.label} value={s.label}>{s.label}</option>)
                  : Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)
                )}
              </Select>
              <Select aria-label="Filter pipeline by division" value={divisionFilter} onChange={(_, data) => setDivisionFilter(data.value)} style={{ minWidth: '160px' }}>
                <option value="all">All Divisions</option>
                {Object.values(Division).map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
              {hasActiveFilters && (
                <Button size="small" appearance="subtle" onClick={clearFilters}>Clear Filters</Button>
              )}
            </div>
            <HbcTanStackTable<ILead>
              columns={columns}
              items={filteredLeads}
              keyExtractor={(lead) => lead.id}
              onRowClick={(lead) => navigate(`/lead/${lead.id}`)}
              sortField={sortField}
              sortAsc={sortAsc}
              onSort={handleSort}
              ariaLabel="Pipeline leads table"
              emptyTitle="No leads found"
              emptyDescription={hasActiveFilters ? 'Try adjusting your filters' : 'No leads in the pipeline'}
            />
          </>
        )}

        {/* Tab 1: Go/No-Go Tracker */}
        {activeTab === 1 && (
          <>
            {/* Pending / Archive sub-tabs */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '16px' }}>
              {(['pending', 'archive'] as const).map(sub => (
                <button
                  key={sub}
                  onClick={() => { setGonogoSubTab(sub); clearGonogoFilters(); }}
                  style={{
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: gonogoSubTab === sub ? 600 : 400,
                    color: gonogoSubTab === sub ? '#fff' : HBC_COLORS.gray600,
                    backgroundColor: gonogoSubTab === sub ? HBC_COLORS.navy : HBC_COLORS.gray100,
                    border: `1px solid ${gonogoSubTab === sub ? HBC_COLORS.navy : HBC_COLORS.gray200}`,
                    borderRadius: sub === 'pending' ? '6px 0 0 6px' : '0 6px 6px 0',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {sub === 'pending' ? `Pending (${pendingRows.length})` : `Archive (${archiveRows.length})`}
                </button>
              ))}
            </div>

            {/* Advanced Filters */}
            <div style={{
              display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center',
              padding: '12px', backgroundColor: HBC_COLORS.gray50, borderRadius: '8px', border: `1px solid ${HBC_COLORS.gray200}`,
            }}>
              <select aria-label="Filter by region" style={selectStyle} value={gonogoRegionFilter} onChange={e => setGonogoRegionFilter(e.target.value)}>
                {gonogoRegions.map(r => <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>)}
              </select>
              <select aria-label="Filter by sector" style={selectStyle} value={gonogoSectorFilter} onChange={e => setGonogoSectorFilter(e.target.value)}>
                {gonogoSectors.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sectors' : s}</option>)}
              </select>
              <select aria-label="Filter by business development representative" style={selectStyle} value={gonogoBdRepFilter} onChange={e => setGonogoBdRepFilter(e.target.value)}>
                {gonogoBdReps.map(b => <option key={b} value={b}>{b === 'All' ? 'All BD Reps' : b}</option>)}
              </select>
              <select
                aria-label="Filter by scorecard status"
                style={selectStyle}
                value={gonogoStatusFilter.length === 1 ? gonogoStatusFilter[0] : ''}
                onChange={e => setGonogoStatusFilter(e.target.value ? [e.target.value] : [])}
              >
                <option value="">All Statuses</option>
                {gonogoStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {hasGonogoFilters && (
                <Button size="small" appearance="subtle" onClick={clearGonogoFilters}>Clear</Button>
              )}
            </div>

            <HbcTanStackTable<IScorecardRow>
              columns={gonogoColumns}
              items={gonogoFiltered}
              keyExtractor={r => r.id}
              sortField={gonogoSortField}
              sortAsc={gonogoSortAsc}
              onSort={handleGonogoSort}
              onRowClick={(r) => { if (r.lead) navigate(`/lead/${r.lead.id}/gonogo`); }}
              ariaLabel="Go or no-go scorecards table"
              emptyTitle={gonogoSubTab === 'pending' ? 'No pending scorecards' : 'No archived scorecards'}
              emptyDescription={hasGonogoFilters ? 'Try adjusting your filters' : (gonogoSubTab === 'pending' ? 'Scorecards in progress will appear here' : 'Completed scorecards will appear here')}
            />
          </>
        )}
      </div>
    </FeatureGate>
  );
};
