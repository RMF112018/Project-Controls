import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useLeads } from '../../hooks/useLeads';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { StageBadge } from '../../shared/StageBadge';
import { StageIndicator } from '../../shared/StageIndicator';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { ILead } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';
import { formatCurrency, formatDate, formatSquareFeet } from '../../../utils/formatters';
import { getStageScreens, getStageLabel } from '../../../utils/stageEngine';

const SCREEN_META: Record<string, { label: string; path: string; description: string; color: string }> = {
  kickoff: { label: 'Precon Kickoff', path: '/kickoff', description: 'Team, dates, and kickoff meeting', color: '#3B82F6' },
  deliverables: { label: 'Deliverables', path: '/deliverables', description: 'Track preconstruction deliverables', color: '#8B5CF6' },
  interview: { label: 'Interview Prep', path: '/interview', description: 'Presentation and interview preparation', color: '#6366F1' },
  winloss: { label: 'Win/Loss', path: '/winloss', description: 'Record award outcome', color: '#F59E0B' },
  autopsy: { label: 'Loss Autopsy', path: '/autopsy', description: 'Post-loss review and analysis', color: '#EF4444' },
  contract: { label: 'Contract', path: '/contract', description: 'Contract administration and execution', color: '#10B981' },
  turnover: { label: 'Turnover', path: '/turnover', description: 'Handoff from precon to operations', color: '#059669' },
  closeout: { label: 'Closeout', path: '/closeout', description: 'Project closeout checklist', color: '#6B7280' },
};

export const ProjectDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { siteContext } = useAppContext();
  const { leads, isLoading, fetchLeads } = useLeads();
  const [project, setProject] = React.useState<ILead | null>(null);

  React.useEffect(() => {
    fetchLeads().then(() => {}).catch(console.error);
  }, [fetchLeads]);

  React.useEffect(() => {
    if (leads.length > 0 && siteContext.projectCode) {
      const found = leads.find(l => l.ProjectCode === siteContext.projectCode);
      setProject(found || null);
    }
  }, [leads, siteContext.projectCode]);

  if (isLoading) return <LoadingSpinner label="Loading project..." />;

  if (!project) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <h2 style={{ color: HBC_COLORS.gray500 }}>Project not found</h2>
        <p style={{ color: HBC_COLORS.gray400 }}>No project matches code: {siteContext.projectCode || 'unknown'}</p>
      </div>
    );
  }

  const fieldStyle: React.CSSProperties = { marginBottom: '12px' };
  const labelStyle: React.CSSProperties = { fontSize: '12px', color: HBC_COLORS.gray500, display: 'block' };
  const valueStyle: React.CSSProperties = { fontSize: '14px', color: HBC_COLORS.gray800 };
  const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };

  const activeScreens = getStageScreens(project.Stage);

  return (
    <div>
      <PageHeader title={project.Title} subtitle={`${project.ClientName} — ${project.CityLocation || ''}, ${project.Region}`} />

      {/* Stage indicator */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: HBC_COLORS.navy }}>Lifecycle Progress</h3>
          <StageBadge stage={project.Stage} size="medium" />
        </div>
        <StageIndicator currentStage={project.Stage} size="medium" />
        <p style={{ margin: '8px 0 0', fontSize: 13, color: HBC_COLORS.gray500 }}>Current stage: {getStageLabel(project.Stage)}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KPICard title="Project Value" value={project.ProjectValue ? formatCurrency(project.ProjectValue) : '-'} />
        <KPICard title="Square Feet" value={project.SquareFeet ? formatSquareFeet(project.SquareFeet) : '-'} />
        <KPICard title="Delivery Method" value={project.DeliveryMethod || '-'} />
      </div>

      {/* Stage-appropriate action cards */}
      {activeScreens.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Available Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {activeScreens.map(screen => {
              const meta = SCREEN_META[screen];
              if (!meta) return null;
              return (
                <div key={screen} onClick={() => navigate(meta.path)}
                  style={{ ...cardStyle, cursor: 'pointer', borderLeft: `4px solid ${meta.color}`, transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)')}>
                  <h4 style={{ margin: '0 0 4px', color: HBC_COLORS.navy, fontSize: 15 }}>{meta.label}</h4>
                  <p style={{ margin: 0, fontSize: 13, color: HBC_COLORS.gray500 }}>{meta.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Project Information</h3>
          <div style={fieldStyle}><span style={labelStyle}>Project Code</span><span style={{ ...valueStyle, fontFamily: 'monospace' }}>{project.ProjectCode || '-'}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>A/E</span><span style={valueStyle}>{project.AE || '-'}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Sector</span><span style={valueStyle}>{project.Sector}{project.SubSector ? ` / ${project.SubSector}` : ''}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Division</span><span style={valueStyle}>{project.Division}</span></div>
        </div>
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Team & Dates</h3>
          <div style={fieldStyle}><span style={labelStyle}>Originator</span><span style={valueStyle}>{project.Originator}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Department</span><span style={valueStyle}>{project.DepartmentOfOrigin}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Date Submitted</span><span style={valueStyle}>{formatDate(project.DateOfEvaluation)}</span></div>
          {project.GoNoGoDecision && <div style={fieldStyle}><span style={labelStyle}>Go/No-Go Decision</span><span style={{ ...valueStyle, fontWeight: 700, color: project.GoNoGoDecision === 'GO' ? HBC_COLORS.success : HBC_COLORS.error }}>{project.GoNoGoDecision}</span></div>}
        </div>
      </div>
    </div>
  );
};
