import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Select } from '@fluentui/react-components';
import { useLeads } from '../../hooks/useLeads';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { PipelineChart } from '../../shared/PipelineChart';
import { ExportButtons } from '../../shared/ExportButtons';
import { FeatureGate } from '../../guards/FeatureGate';
import { ILead, Stage, Region, Sector } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';
import { formatCurrencyCompact } from '../../../utils/formatters';
import { STAGE_COLORS } from '../../../utils/constants';
import { getStageLabel, isActiveStage, isArchived } from '../../../utils/stageEngine';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { leads, isLoading, fetchLeads } = useLeads();
  const [chartMode, setChartMode] = React.useState<'count' | 'value'>('count');
  const [regionFilter, setRegionFilter] = React.useState<string>('all');

  React.useEffect(() => {
    fetchLeads().catch(console.error);
  }, [fetchLeads]);

  const filteredLeads = React.useMemo(() => {
    if (regionFilter === 'all') return leads;
    return leads.filter(l => l.Region === regionFilter);
  }, [leads, regionFilter]);

  const metrics = React.useMemo(() => {
    const active = filteredLeads.filter(l => isActiveStage(l.Stage));
    const totalValue = active.reduce((sum, l) => sum + (l.ProjectValue || 0), 0);
    const inConstruction = filteredLeads.filter(l => l.Stage === Stage.ActiveConstruction);
    const constructionValue = inConstruction.reduce((sum, l) => sum + (l.ProjectValue || 0), 0);
    const pendingGNG = filteredLeads.filter(l => l.Stage === Stage.GoNoGoPending);
    const won = filteredLeads.filter(
      l => l.Stage === Stage.WonContractPending || l.Stage === Stage.ActiveConstruction
    );

    // Stage distribution
    const stageGroups: Record<string, ILead[]> = {};
    for (const lead of filteredLeads) {
      if (!isArchived(lead.Stage)) {
        if (!stageGroups[lead.Stage]) stageGroups[lead.Stage] = [];
        stageGroups[lead.Stage].push(lead);
      }
    }

    // Region distribution
    const regionGroups: Record<string, number> = {};
    for (const lead of active) {
      regionGroups[lead.Region] = (regionGroups[lead.Region] || 0) + 1;
    }

    // Sector distribution
    const sectorGroups: Record<string, number> = {};
    for (const lead of active) {
      sectorGroups[lead.Sector] = (sectorGroups[lead.Sector] || 0) + 1;
    }

    return { active, totalValue, inConstruction, constructionValue, pendingGNG, won, stageGroups, regionGroups, sectorGroups };
  }, [filteredLeads]);

  const exportData = React.useMemo(() =>
    filteredLeads.filter(l => isActiveStage(l.Stage)).map(l => ({
      Project: l.Title,
      Client: l.ClientName,
      Region: l.Region,
      Sector: l.Sector,
      Value: l.ProjectValue || '',
      Stage: l.Stage,
    })),
  [filteredLeads]);

  if (isLoading) return <LoadingSpinner label="Loading dashboard..." />;

  return (
    <FeatureGate featureName="PipelineDashboard">
      <div id="dashboard-view">
        <PageHeader
          title="Pipeline Dashboard"
          subtitle="Overview of all active projects"
          actions={
            <ExportButtons
              data={exportData}
              pdfElementId="dashboard-view"
              filename="dashboard-export"
              title="Pipeline Dashboard"
            />
          }
        />

        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <KPICard
            title="Active Leads"
            value={metrics.active.length}
            subtitle="Across all stages"
            onClick={() => navigate('/')}
          />
          <KPICard
            title="Total Pipeline Value"
            value={formatCurrencyCompact(metrics.totalValue)}
            subtitle={`${metrics.active.length} active projects`}
          />
          <KPICard
            title="In Construction"
            value={metrics.inConstruction.length}
            subtitle={formatCurrencyCompact(metrics.constructionValue)}
          />
          <KPICard
            title="Pending Go/No-Go"
            value={metrics.pendingGNG.length}
            subtitle="Awaiting committee review"
          />
        </div>

        {/* Pipeline Chart */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: HBC_COLORS.navy, margin: 0 }}>
              Pipeline by Stage
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Select
                size="small"
                value={regionFilter}
                onChange={(_, data) => setRegionFilter(data.value)}
                style={{ minWidth: '140px' }}
              >
                <option value="all">All Regions</option>
                {Object.values(Region).map(r => <option key={r} value={r}>{r}</option>)}
              </Select>
              <Button
                size="small"
                appearance={chartMode === 'count' ? 'primary' : 'subtle'}
                onClick={() => setChartMode('count')}
              >
                Count
              </Button>
              <Button
                size="small"
                appearance={chartMode === 'value' ? 'primary' : 'subtle'}
                onClick={() => setChartMode('value')}
              >
                Value
              </Button>
            </div>
          </div>
          <PipelineChart leads={filteredLeads} mode={chartMode} />
        </div>

        {/* Distribution Panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Region Distribution */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy, margin: '0 0 16px 0' }}>
              By Region
            </h3>
            {Object.entries(metrics.regionGroups)
              .sort(([, a], [, b]) => b - a)
              .map(([region, count]) => {
                const maxVal = Math.max(...Object.values(metrics.regionGroups));
                const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;
                return (
                  <div key={region} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: HBC_COLORS.gray700 }}>{region}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: HBC_COLORS.gray800 }}>{count}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: HBC_COLORS.gray100, borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: HBC_COLORS.navy, borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Sector Distribution */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy, margin: '0 0 16px 0' }}>
              By Sector
            </h3>
            {Object.entries(metrics.sectorGroups)
              .sort(([, a], [, b]) => b - a)
              .map(([sector, count]) => {
                const maxVal = Math.max(...Object.values(metrics.sectorGroups));
                const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;
                return (
                  <div key={sector} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: HBC_COLORS.gray700 }}>{sector}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: HBC_COLORS.gray800 }}>{count}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: HBC_COLORS.gray100, borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: HBC_COLORS.orange, borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Stage Distribution Detail */}
        <div style={{ marginTop: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: HBC_COLORS.navy, marginBottom: '12px' }}>
            Stage Distribution
          </h2>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            {Object.entries(metrics.stageGroups).map(([stage, stageLeads]) => {
              const maxValue = Math.max(...Object.values(metrics.stageGroups).map(g => g.length));
              const pct = maxValue > 0 ? (stageLeads.length / maxValue) * 100 : 0;
              const stageValue = stageLeads.reduce((sum, l) => sum + (l.ProjectValue || 0), 0);
              return (
                <div key={stage} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: HBC_COLORS.gray700 }}>
                      {getStageLabel(stage as Stage)}
                    </span>
                    <span style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>
                      <strong style={{ color: HBC_COLORS.gray800 }}>{stageLeads.length}</strong>
                      {stageValue > 0 && ` — ${formatCurrencyCompact(stageValue)}`}
                    </span>
                  </div>
                  <div style={{
                    height: '8px',
                    backgroundColor: HBC_COLORS.gray100,
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: STAGE_COLORS[stage] || HBC_COLORS.gray400,
                      borderRadius: '4px',
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};
