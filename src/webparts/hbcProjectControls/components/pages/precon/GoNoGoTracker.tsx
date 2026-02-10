import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { useLeads } from '../../hooks/useLeads';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { buildBreadcrumbs } from '../../../utils/breadcrumbs';
import { DataTable, IDataTableColumn } from '../../shared/DataTable';
import { ExportButtons } from '../../shared/ExportButtons';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { ILead, GoNoGoDecision } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';
import { formatDate } from '../../../utils/formatters';

const CheckIcon: React.FC = () => (
  <span style={{ color: HBC_COLORS.success, fontSize: '16px', fontWeight: 700 }}>&#10003;</span>
);

export const GoNoGoTracker: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { leads, isLoading, fetchLeads } = useLeads();
  const [regionFilter, setRegionFilter] = React.useState('All');
  const [sortField, setSortField] = React.useState<string>('');
  const [sortAsc, setSortAsc] = React.useState(true);

  React.useEffect(() => {
    fetchLeads().catch(console.error);
  }, [fetchLeads]);

  const gonogoLeads = React.useMemo(
    () => leads.filter(l => l.GoNoGoDecision || l.GoNoGoScore_Originator),
    [leads]
  );

  const regions = React.useMemo(() => {
    const r = new Set<string>();
    gonogoLeads.forEach(l => { if (l.Region) r.add(l.Region); });
    return ['All', ...Array.from(r).sort()];
  }, [gonogoLeads]);

  const filtered = React.useMemo(
    () => regionFilter === 'All' ? gonogoLeads : gonogoLeads.filter(l => l.Region === regionFilter),
    [gonogoLeads, regionFilter]
  );

  const handleSort = React.useCallback((field: string) => {
    setSortField(prev => {
      if (prev === field) { setSortAsc(a => !a); return field; }
      setSortAsc(true);
      return field;
    });
  }, []);

  const columns: IDataTableColumn<ILead>[] = React.useMemo(() => [
    { key: 'GoNoGoDecisionDate', header: 'Date', sortable: true, width: '100px',
      render: (l) => formatDate(l.GoNoGoDecisionDate || l.DateOfEvaluation) },
    { key: 'Title', header: 'Project', sortable: true,
      render: (l) => <span style={{ fontWeight: 500, color: HBC_COLORS.navy }}>{l.Title}</span> },
    { key: 'Region', header: 'Region', sortable: true, width: '120px', render: (l) => l.Region },
    { key: 'Approved', header: 'Approved', width: '80px',
      render: (l) => l.GoNoGoDecision === GoNoGoDecision.Go ? <CheckIcon /> : null },
    { key: 'Declined', header: 'Declined', width: '80px',
      render: (l) => l.GoNoGoDecision === GoNoGoDecision.NoGo ? <CheckIcon /> : null },
    { key: 'Conditional', header: 'Conditional', width: '80px',
      render: (l) => l.GoNoGoDecision === GoNoGoDecision.ConditionalGo ? <CheckIcon /> : null },
    { key: 'Score', header: 'Score (Orig / Cmte)', width: '140px',
      render: (l) => <span>{l.GoNoGoScore_Originator ?? '-'} / {l.GoNoGoScore_Committee ?? '-'}</span> },
  ], []);

  const exportData = React.useMemo(() =>
    filtered.map(l => ({
      Date: l.GoNoGoDecisionDate || l.DateOfEvaluation,
      Project: l.Title,
      Region: l.Region,
      Decision: l.GoNoGoDecision || '',
      'Originator Score': l.GoNoGoScore_Originator ?? '',
      'Committee Score': l.GoNoGoScore_Committee ?? '',
    })),
  [filtered]);

  if (isLoading) return <SkeletonLoader variant="table" rows={8} columns={5} />;

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px', borderRadius: '6px', border: `1px solid ${HBC_COLORS.gray200}`,
    fontSize: '13px', backgroundColor: '#fff', color: HBC_COLORS.gray800,
  };

  return (
    <div id="gonogo-tracker-view">
      <PageHeader
        title="Go/No-Go Tracker"
        subtitle="All Go/No-Go decisions from Leads Master"
        breadcrumb={<Breadcrumb items={breadcrumbs} />}
        actions={
          <ExportButtons
            data={exportData}
            pdfElementId="gonogo-tracker-view"
            filename="gonogo-tracker"
            title="Go/No-Go Tracker"
          />
        }
      />

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <label style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>
          Region:
          <select style={{ ...selectStyle, marginLeft: '6px' }} value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
      </div>

      <DataTable<ILead>
        columns={columns}
        items={filtered}
        keyExtractor={l => l.id}
        sortField={sortField}
        sortAsc={sortAsc}
        onSort={handleSort}
        emptyTitle="No Go/No-Go records"
        emptyDescription="Leads with Go/No-Go scores or decisions appear here"
      />
    </div>
  );
};
