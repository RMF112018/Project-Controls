import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, Input, Button } from '@fluentui/react-components';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { useActiveProjects } from '../../hooks/useActiveProjects';
import { useResponsive } from '../../hooks/useResponsive';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { DataTable, IDataTableColumn } from '../../shared/DataTable';
import { StatusBadge } from '../../shared/StatusBadge';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { ExportButtons } from '../../shared/ExportButtons';
import { FeatureGate } from '../../guards/FeatureGate';
import { RoleGate } from '../../guards/RoleGate';
import { IActiveProject, ProjectStatus, SectorType } from '../../../models/IActiveProject';
import { RoleName } from '../../../models/enums';
import { HBC_COLORS } from '../../../theme/tokens';
import { formatCurrencyCompact, formatPercent } from '../../../utils/formatters';

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

export const ActiveProjectsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
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

  const [selectedPersonnel, setSelectedPersonnel] = React.useState<string | null>(null);
  const [showPersonnelPanel, setShowPersonnelPanel] = React.useState(false);

  // Fetch data on mount
  React.useEffect(() => {
    fetchProjects().catch(console.error);
    fetchSummary().catch(console.error);
    fetchPersonnelWorkload().catch(console.error);
  }, [fetchProjects, fetchSummary, fetchPersonnelWorkload]);

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

  // Table columns
  const columns: IDataTableColumn<IActiveProject>[] = React.useMemo(() => [
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

  if (isLoading && !summary) return <LoadingSpinner label="Loading portfolio..." />;

  const kpiGridCols = isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))';
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
    <FeatureGate featureName="ActiveProjectsDashboard">
      <RoleGate
        allowedRoles={[RoleName.ExecutiveLeadership, RoleName.OperationsTeam]}
        fallback={
          <div style={{ padding: '48px', textAlign: 'center', color: HBC_COLORS.gray500 }}>
            <h3>Access Restricted</h3>
            <p>The Active Projects Dashboard is restricted to Executive Leadership and Operations Team.</p>
          </div>
        }
      >
        <div id="active-projects-dashboard">
          <PageHeader
            title="Active Projects Portfolio"
            subtitle="Real-time portfolio-wide view of financial and operational health"
            actions={
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Button
                  appearance="outline"
                  onClick={() => triggerFullSync()}
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
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <Input
              placeholder="Search projects..."
              value={filters.searchQuery || ''}
              onChange={(_, data) => setFilters({ ...filters, searchQuery: data.value })}
              style={{ minWidth: '200px' }}
            />
            <Select
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
              value={filters.sector || ''}
              onChange={(_, d) => setFilters({ ...filters, sector: d.value as SectorType || undefined })}
              style={{ minWidth: '140px' }}
            >
              <option value="">All Sectors</option>
              <option value="Commercial">Commercial</option>
              <option value="Residential">Residential</option>
            </Select>
            <Select
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
          <div style={{ display: 'grid', gridTemplateColumns: chartGridCols, gap: '16px', marginBottom: '24px' }}>
            {/* Status Distribution */}
            <div>
              {sectionTitle('Projects by Status')}
              <div style={chartCardStyle}>
                {statusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusChartData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: HBC_COLORS.gray400 }}>
                    No data
                  </div>
                )}
              </div>
            </div>

            {/* Sector Distribution */}
            <div>
              {sectionTitle('Projects by Sector')}
              <div style={chartCardStyle}>
                {sectorChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={sectorChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {sectorChartData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: HBC_COLORS.gray400 }}>
                    No data
                  </div>
                )}
              </div>
            </div>

            {/* Backlog by Region */}
            <div style={{ gridColumn: isMobile ? undefined : '1 / -1' }}>
              {sectionTitle('Backlog by Region')}
              <div style={chartCardStyle}>
                {regionBacklogData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={Math.max(200, regionBacklogData.length * 50)}>
                    <BarChart data={regionBacklogData} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 100 }}>
                      <XAxis type="number" tickFormatter={(v: number) => formatCurrencyCompact(v)} tick={{ fontSize: 11, fill: HBC_COLORS.gray500 }} />
                      <YAxis dataKey="region" type="category" tick={{ fontSize: 12, fill: HBC_COLORS.gray700 }} width={90} />
                      <Tooltip formatter={(v: number) => [formatCurrencyCompact(v), 'Backlog']} />
                      <Bar dataKey="value" fill={HBC_COLORS.navy} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: HBC_COLORS.gray400 }}>
                    No data
                  </div>
                )}
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
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      }}
                      onClick={() => navigate(`/project/${p.projectCode}`)}
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
            {sectionTitle(`All Projects (${filteredProjects.length})`)}
            <DataTable<IActiveProject>
              columns={columns}
              items={filteredProjects}
              keyExtractor={(p) => p.id}
              onRowClick={(p) => navigate(`/project/${p.projectCode}`)}
              emptyTitle="No projects found"
              emptyDescription="Try adjusting your filters"
              pageSize={20}
            />
          </div>

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
                          onClick={() => navigate(`/project/${p.projectCode}`)}
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
