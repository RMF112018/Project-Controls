import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Select } from '@fluentui/react-components';
import { useLeads } from '../../hooks/useLeads';
import { useAppContext } from '../../contexts/AppContext';
import { useResponsive } from '../../hooks/useResponsive';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { PipelineChart } from '../../shared/PipelineChart';
import { StageBadge } from '../../shared/StageBadge';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { DataTable, IDataTableColumn } from '../../shared/DataTable';
import { ExportButtons } from '../../shared/ExportButtons';
import { FeatureGate } from '../../guards/FeatureGate';
import { ILead, Stage, Region, Sector, Division, AwardStatus } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';
import { formatCurrencyCompact, formatDate, formatPercent } from '../../../utils/formatters';
import { isActiveStage } from '../../../utils/stageEngine';
import { PERMISSIONS } from '../../../utils/permissions';

export const PipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAppContext();
  const { leads, totalCount, isLoading, fetchLeads } = useLeads();
  const { isMobile } = useResponsive();
  const [chartMode, setChartMode] = React.useState<'count' | 'value'>('count');
  const [stageFilter, setStageFilter] = React.useState<string>('all');
  const [regionFilter, setRegionFilter] = React.useState<string>('all');
  const [sectorFilter, setSectorFilter] = React.useState<string>('all');
  const [divisionFilter, setDivisionFilter] = React.useState<string>('all');
  const [sortField, setSortField] = React.useState<string>('Title');
  const [sortAsc, setSortAsc] = React.useState(true);

  React.useEffect(() => {
    fetchLeads().catch(console.error);
  }, [fetchLeads]);

  const handleSort = (field: string): void => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

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

  const columns: IDataTableColumn<ILead>[] = React.useMemo(() => [
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
      key: 'GoNoGoScore_Originator',
      header: 'Score',
      sortable: true,
      render: (lead) => <>{lead.GoNoGoScore_Originator ?? '-'}</>,
    },
  ], []);

  // KPI calculations
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
    const won = filteredLeads.filter(l => l.GoNoGoDecision === 'GO' && l.Stage !== Stage.ArchivedNoGo).length;
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

  if (isLoading) return <LoadingSpinner label="Loading pipeline..." />;

  return (
    <FeatureGate featureName="PipelineDashboard">
      <div id="pipeline-view">
        <PageHeader
          title="Project Pipeline"
          subtitle={`${totalCount} leads across all stages`}
          actions={
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <ExportButtons data={exportData} filename="pipeline-export" title="Project Pipeline" />
              {hasPermission(PERMISSIONS.LEAD_CREATE) && (
                <Button appearance="primary" onClick={() => navigate('/lead/new')}>New Lead</Button>
              )}
            </div>
          }
        />
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <KPICard title="Total Pipeline Value" value={formatCurrencyCompact(kpis.totalPipelineValue)} subtitle={`${kpis.activePursuits} active projects`} />
          <KPICard title="Active Pursuits" value={kpis.activePursuits} subtitle="Across all active stages" />
          <KPICard title="Leads This Month" value={kpis.thisMonth} subtitle={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
          <KPICard title="Win Rate" value={formatPercent(kpis.winRate)} subtitle="GO / (GO + Archived)" />
        </div>

        {/* Pipeline Chart */}
        <div style={{ marginBottom: '24px' }}>
          <PipelineChart leads={filteredLeads} mode={chartMode} />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Select value={stageFilter} onChange={(_, data) => setStageFilter(data.value)} style={{ minWidth: '160px' }}>
            <option value="all">All Stages</option>
            {Object.values(Stage).map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={regionFilter} onChange={(_, data) => setRegionFilter(data.value)} style={{ minWidth: '160px' }}>
            <option value="all">All Regions</option>
            {Object.values(Region).map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Select value={sectorFilter} onChange={(_, data) => setSectorFilter(data.value)} style={{ minWidth: '160px' }}>
            <option value="all">All Sectors</option>
            {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={divisionFilter} onChange={(_, data) => setDivisionFilter(data.value)} style={{ minWidth: '160px' }}>
            <option value="all">All Divisions</option>
            {Object.values(Division).map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
          {hasActiveFilters && (
            <Button size="small" appearance="subtle" onClick={clearFilters}>Clear Filters</Button>
          )}
        </div>
        <DataTable<ILead>
          columns={columns}
          items={filteredLeads}
          keyExtractor={(lead) => lead.id}
          onRowClick={(lead) => navigate(`/lead/${lead.id}`)}
          sortField={sortField}
          sortAsc={sortAsc}
          onSort={handleSort}
          emptyTitle="No leads found"
          emptyDescription={hasActiveFilters ? 'Try adjusting your filters' : 'No leads in the pipeline'}
        />
      </div>
    </FeatureGate>
  );
};
