import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { useMarketingRecord } from '../../hooks/useMarketingRecord';
import {
  buildBreadcrumbs,
  IMarketingProjectRecord,
  RoleName,
  formatCurrency,
  formatDate,
  formatPercent
} from '@hbc/sp-services';
import { RoleGate } from '../../guards/RoleGate';
import { FeatureGate } from '../../guards/FeatureGate';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { KPICard } from '../../shared/KPICard';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { ExportButtons } from '../../shared/ExportButtons';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';
import { HbcTanStackTable } from '../../../tanstack/table/HbcTanStackTable';
import type { IHbcTanStackTableColumn } from '../../../tanstack/table/types';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const cardStyle: React.CSSProperties = {
  backgroundColor: HBC_COLORS.white,
  borderRadius: '8px',
  boxShadow: ELEVATION.level1,
  padding: '24px',
  marginBottom: '16px',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: `1px solid ${HBC_COLORS.gray300}`,
  borderRadius: '4px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: HBC_COLORS.gray500,
  display: 'block',
  marginBottom: '4px',
};

// ---------------------------------------------------------------------------
// Case study field keys
// ---------------------------------------------------------------------------
const CS_FIELDS: (keyof IMarketingProjectRecord)[] = [
  'CS_Conflicts', 'CS_CostControl', 'CS_ValueEngineering', 'CS_QualityControl',
  'CS_Schedule', 'CS_Team', 'CS_Safety', 'CS_LEED', 'CS_SupplierDiversity',
  'CS_Challenges', 'CS_InnovativeSolutions', 'CS_ProductsSystems',
  'CS_ClientService', 'CS_LessonsLearned',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function completionColor(pct: number): string {
  if (pct > 75) return HBC_COLORS.success;
  if (pct > 50) return HBC_COLORS.warning;
  return HBC_COLORS.error;
}

function hasCaseStudyData(record: IMarketingProjectRecord): boolean {
  return CS_FIELDS.some(f => {
    const val = (record as unknown as Record<string, unknown>)[f];
    return val !== null && val !== undefined && val !== '';
  });
}

// ---------------------------------------------------------------------------
// Completion bar sub-component
// ---------------------------------------------------------------------------
const CompletionBar: React.FC<{ pct: number }> = ({ pct }) => {
  const color = completionColor(pct);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '8px', backgroundColor: HBC_COLORS.gray200, borderRadius: '4px', overflow: 'hidden', minWidth: '60px' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color, whiteSpace: 'nowrap' }}>{pct}%</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Inline detail panel
// ---------------------------------------------------------------------------
const InlineDetail: React.FC<{ record: IMarketingProjectRecord }> = ({ record }) => {
  const sections = [
    { label: 'Contract Type', value: (record.contractType || []).join(', ') || '-' },
    { label: 'Delivery Method', value: record.deliveryMethod || '-' },
    { label: 'Architect', value: record.architect || '-' },
    { label: 'Engineer', value: record.engineer || '-' },
    { label: 'Contract Budget', value: formatCurrency(record.contractBudget) },
    { label: 'Contract Final Cost', value: formatCurrency(record.contractFinalCost) },
    { label: 'Budget Variance', value: formatCurrency(record.totalBudgetVariance) },
    { label: 'On Schedule', value: record.onSchedule || '-' },
    { label: 'LEED Designation', value: record.leedDesignation || '-' },
    { label: 'Rendering URLs', value: record.renderingUrls?.length ? `${record.renderingUrls.length} file(s)` : '-' },
    { label: 'Final Photos', value: record.finalPhotoUrls?.length ? `${record.finalPhotoUrls.length} file(s)` : '-' },
    { label: 'Has Case Study', value: hasCaseStudyData(record) ? 'Yes' : 'No' },
  ];

  return (
    <div style={{ padding: '16px 24px', backgroundColor: HBC_COLORS.gray50, borderBottom: `1px solid ${HBC_COLORS.gray200}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {sections.map(s => (
          <div key={s.label}>
            <span style={labelStyle}>{s.label}</span>
            <span style={{ fontSize: '13px', color: HBC_COLORS.gray800 }}>{s.value}</span>
          </div>
        ))}
      </div>
      {record.projectDescription && (
        <div style={{ marginTop: '12px' }}>
          <span style={labelStyle}>Description</span>
          <p style={{ fontSize: '13px', color: HBC_COLORS.gray700, margin: '4px 0 0', lineHeight: '1.5' }}>
            {record.projectDescription.length > 300 ? `${record.projectDescription.substring(0, 300)}...` : record.projectDescription}
          </p>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const MarketingDashboard: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { allRecords, isLoading, fetchAllRecords } = useMarketingRecord();

  const [searchText, setSearchText] = React.useState('');
  const [completionFilter, setCompletionFilter] = React.useState('All');
  const [expandedCode, setExpandedCode] = React.useState<string | null>(null);
  const [sortField, setSortField] = React.useState<string>('');
  const [sortAsc, setSortAsc] = React.useState(true);

  // Fetch on mount
  React.useEffect(() => {
    fetchAllRecords().catch(console.error);
  }, [fetchAllRecords]);

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------
  const filteredRecords = React.useMemo(() => {
    let result = [...allRecords];

    // Text search
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(r =>
        r.projectName.toLowerCase().includes(q) ||
        r.projectCode.toLowerCase().includes(q) ||
        (r.projectDescription || '').toLowerCase().includes(q)
      );
    }

    // Completion range
    if (completionFilter !== 'All') {
      result = result.filter(r => {
        const pct = r.overallCompletion || 0;
        switch (completionFilter) {
          case '<25': return pct < 25;
          case '25-50': return pct >= 25 && pct < 50;
          case '50-75': return pct >= 50 && pct < 75;
          case '>75': return pct >= 75;
          default: return true;
        }
      });
    }

    return result;
  }, [allRecords, searchText, completionFilter]);

  // ---------------------------------------------------------------------------
  // KPI calculations
  // ---------------------------------------------------------------------------
  const totalProjects = allRecords.length;

  const avgCompletion = React.useMemo(() => {
    if (allRecords.length === 0) return 0;
    const sum = allRecords.reduce((acc, r) => acc + (r.overallCompletion || 0), 0);
    return Math.round(sum / allRecords.length);
  }, [allRecords]);

  const projectsWithPhotos = React.useMemo(() =>
    allRecords.filter(r => r.finalPhotoUrls && r.finalPhotoUrls.length > 0).length,
    [allRecords]
  );

  const projectsWithCaseStudy = React.useMemo(() =>
    allRecords.filter(r => hasCaseStudyData(r)).length,
    [allRecords]
  );

  // ---------------------------------------------------------------------------
  // Sort handler
  // ---------------------------------------------------------------------------
  const handleSort = (field: string): void => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Sort filtered records
  const sortedRecords = React.useMemo(() => {
    if (!sortField) return filteredRecords;
    const sorted = [...filteredRecords].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField];
      const bVal = (b as unknown as Record<string, unknown>)[sortField];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal;
      return String(aVal).localeCompare(String(bVal));
    });
    return sortAsc ? sorted : sorted.reverse();
  }, [filteredRecords, sortField, sortAsc]);

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------
  const columns: IHbcTanStackTableColumn<IMarketingProjectRecord>[] = [
    {
      key: 'projectName',
      header: 'Project Name',
      sortable: true,
      render: (item) => (
        <span style={{ fontWeight: 600, color: HBC_COLORS.navy }}>{item.projectName}</span>
      ),
    },
    {
      key: 'projectCode',
      header: 'Project Code',
      sortable: true,
      width: '120px',
      hideOnMobile: true,
      render: (item) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.projectCode}</span>
      ),
    },
    {
      key: 'contractType',
      header: 'Contract Type',
      hideOnMobile: true,
      render: (item) => (
        <span style={{ fontSize: '12px' }}>{(item.contractType || []).join(', ') || '-'}</span>
      ),
    },
    {
      key: 'contractBudget',
      header: 'Contract Value',
      sortable: true,
      width: '130px',
      hideOnMobile: true,
      render: (item) => (
        <span>{formatCurrency(item.contractBudget)}</span>
      ),
    },
    {
      key: 'overallCompletion',
      header: 'Completion %',
      sortable: true,
      width: '140px',
      render: (item) => <CompletionBar pct={item.overallCompletion || 0} />,
    },
    {
      key: 'lastUpdatedAt',
      header: 'Last Updated',
      sortable: true,
      width: '120px',
      hideOnMobile: true,
      render: (item) => (
        <span style={{ fontSize: '12px', color: HBC_COLORS.gray500 }}>{formatDate(item.lastUpdatedAt)}</span>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Row click handler
  // ---------------------------------------------------------------------------
  const handleRowClick = (item: IMarketingProjectRecord): void => {
    setExpandedCode(prev => prev === item.projectCode ? null : item.projectCode);
  };

  // ---------------------------------------------------------------------------
  // Inline details are rendered below the table for the selected record.
  // ---------------------------------------------------------------------------

  if (isLoading) return (<div><SkeletonLoader variant="kpi-grid" columns={4} style={{ marginBottom: '24px' }} /><SkeletonLoader variant="table" rows={6} columns={5} /></div>);

  return (
    <RoleGate allowedRoles={[RoleName.Marketing, RoleName.ExecutiveLeadership, RoleName.DepartmentDirector]}>
      <FeatureGate featureName="MarketingProjectRecord">
        <div>
          <PageHeader
            title="Marketing Project Records"
            subtitle={`${totalProjects} project${totalProjects !== 1 ? 's' : ''} tracked`}
            breadcrumb={<Breadcrumb items={breadcrumbs} />}
            actions={
              <ExportButtons
                data={allRecords.map(r => r as unknown as Record<string, unknown>)}
                filename="MarketingProjectRecords"
                title="Marketing Project Records"
              />
            }
          />

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <KPICard
              title="Total Projects with Records"
              value={totalProjects}
            />
            <KPICard
              title="Average Completion %"
              value={formatPercent(avgCompletion)}
              subtitle={avgCompletion > 75 ? 'On track' : avgCompletion > 50 ? 'In progress' : 'Needs attention'}
            />
            <KPICard
              title="Projects with Final Photos"
              value={projectsWithPhotos}
              subtitle={totalProjects > 0 ? `${Math.round((projectsWithPhotos / totalProjects) * 100)}% of total` : '-'}
            />
            <KPICard
              title="Projects with Case Study"
              value={projectsWithCaseStudy}
              subtitle={totalProjects > 0 ? `${Math.round((projectsWithCaseStudy / totalProjects) * 100)}% of total` : '-'}
            />
          </div>

          {/* Filters Row */}
          <div style={{ ...cardStyle, display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={labelStyle}>Search</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="Search by name, code, or description..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
            </div>
            <div style={{ minWidth: '160px' }}>
              <label style={labelStyle}>Completion %</label>
              <select
                style={inputStyle}
                value={completionFilter}
                onChange={e => setCompletionFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="<25">Less than 25%</option>
                <option value="25-50">25% - 50%</option>
                <option value="50-75">50% - 75%</option>
                <option value=">75">Greater than 75%</option>
              </select>
            </div>
          </div>

          {/* Data Table with custom expand */}
          <div style={{ backgroundColor: HBC_COLORS.white, borderRadius: '8px', boxShadow: ELEVATION.level1, overflow: 'hidden' }}>
            <HbcTanStackTable<IMarketingProjectRecord>
              columns={columns}
              items={sortedRecords}
              keyExtractor={r => r.projectCode}
              isLoading={isLoading}
              emptyTitle="No project records"
              emptyDescription="No marketing project records have been created yet."
              onRowClick={handleRowClick}
              sortField={sortField}
              sortAsc={sortAsc}
              onSort={handleSort}
              ariaLabel="Marketing project records table"
            />
          </div>

          {/* Inline detail panels rendered below the table for the expanded record */}
          {expandedCode && (() => {
            const expandedRecord = sortedRecords.find(r => r.projectCode === expandedCode);
            if (!expandedRecord) return null;
            return (
              <div style={{ marginTop: '-8px', marginBottom: '16px', borderRadius: '0 0 8px 8px', overflow: 'hidden', boxShadow: ELEVATION.level1 }}>
                <div style={{ padding: '8px 16px', backgroundColor: HBC_COLORS.navy, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: HBC_COLORS.white }}>
                    {expandedRecord.projectName} ({expandedRecord.projectCode})
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedCode(null)}
                    style={{ background: 'none', border: 'none', color: HBC_COLORS.white, cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}
                  >
                    X
                  </button>
                </div>
                <InlineDetail record={expandedRecord} />
              </div>
            );
          })()}

          {/* Result count */}
          {searchText || completionFilter !== 'All' ? (
            <div style={{ fontSize: '13px', color: HBC_COLORS.gray500, marginTop: '8px' }}>
              Showing {filteredRecords.length} of {allRecords.length} records
            </div>
          ) : null}
        </div>
      </FeatureGate>
    </RoleGate>
  );
};
