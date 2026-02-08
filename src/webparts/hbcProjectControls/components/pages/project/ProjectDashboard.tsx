import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useLeads } from '../../hooks/useLeads';
import { useStartupChecklist } from '../../hooks/useStartupChecklist';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { StageBadge } from '../../shared/StageBadge';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { ILead, Stage } from '../../../models';
import { PERMISSIONS } from '../../../utils/permissions';
import { HBC_COLORS } from '../../../theme/tokens';
import { formatCurrency, formatDate, formatSquareFeet } from '../../../utils/formatters';

const ACTIVE_STAGES: string[] = [Stage.ActiveConstruction, Stage.Closeout];

const quickActionCardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  cursor: 'pointer',
  transition: 'box-shadow 0.15s, transform 0.15s',
  border: `1px solid ${HBC_COLORS.gray200}`,
};

export const ProjectDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { siteContext, hasPermission } = useAppContext();
  const { leads, isLoading, fetchLeads } = useLeads();
  const { items: checklistItems, fetchChecklist } = useStartupChecklist();
  const [project, setProject] = React.useState<ILead | null>(null);

  React.useEffect(() => {
    fetchLeads().then(() => {}).catch(console.error);
  }, [fetchLeads]);

  React.useEffect(() => {
    if (siteContext.projectCode) {
      fetchChecklist(siteContext.projectCode).catch(console.error);
    }
  }, [siteContext.projectCode, fetchChecklist]);

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

  return (
    <div>
      <PageHeader title={project.Title} subtitle={`${project.ClientName} — ${project.CityLocation || ''}, ${project.Region}`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <KPICard title="Project Value" value={project.ProjectValue ? formatCurrency(project.ProjectValue) : '-'} />
        <KPICard title="Square Feet" value={project.SquareFeet ? formatSquareFeet(project.SquareFeet) : '-'} />
        <KPICard title="Delivery Method" value={project.DeliveryMethod || '-'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Project Information</h3>
          <div style={fieldStyle}><span style={labelStyle}>Stage</span><StageBadge stage={project.Stage} size="medium" /></div>
          <div style={fieldStyle}><span style={labelStyle}>Project Code</span><span style={{ ...valueStyle, fontFamily: 'monospace' }}>{project.ProjectCode || '-'}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>A/E</span><span style={valueStyle}>{project.AE || '-'}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Sector</span><span style={valueStyle}>{project.Sector}{project.SubSector ? ` / ${project.SubSector}` : ''}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Division</span><span style={valueStyle}>{project.Division}</span></div>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Team & Dates</h3>
          <div style={fieldStyle}><span style={labelStyle}>Originator</span><span style={valueStyle}>{project.Originator}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Department</span><span style={valueStyle}>{project.DepartmentOfOrigin}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Date Submitted</span><span style={valueStyle}>{formatDate(project.DateOfEvaluation)}</span></div>
          {project.GoNoGoDecision && <div style={fieldStyle}><span style={labelStyle}>Go/No-Go Decision</span><span style={{ ...valueStyle, fontWeight: 700, color: project.GoNoGoDecision === 'GO' ? HBC_COLORS.success : HBC_COLORS.error }}>{project.GoNoGoDecision}</span></div>}
        </div>
      </div>

      {/* Quick Action Cards — show only for Active Construction / Closeout stages */}
      {project.Stage && ACTIVE_STAGES.includes(project.Stage) && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div
              style={quickActionCardStyle}
              onClick={() => navigate('/startup-checklist')}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: HBC_COLORS.navy, marginBottom: '6px' }}>
                Startup Checklist
              </div>
              {checklistItems.length > 0 ? (() => {
                const visible = checklistItems.filter(i => !i.isHidden);
                const responded = visible.filter(i => i.status !== 'NoResponse').length;
                const pct = visible.length > 0 ? Math.round((responded / visible.length) * 100) : 0;
                return (
                  <div>
                    <div style={{ fontSize: '12px', color: HBC_COLORS.gray500, marginBottom: '4px' }}>
                      {responded}/{visible.length} items responded ({pct}%)
                    </div>
                    <div style={{ height: '4px', backgroundColor: HBC_COLORS.gray200, borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: HBC_COLORS.success, borderRadius: '2px' }} />
                    </div>
                  </div>
                );
              })() : (
                <div style={{ fontSize: '12px', color: HBC_COLORS.gray400 }}>View project startup items</div>
              )}
            </div>

            <div
              style={quickActionCardStyle}
              onClick={() => navigate('/responsibility')}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: HBC_COLORS.navy, marginBottom: '6px' }}>
                Responsibility Matrices
              </div>
              <div style={{ fontSize: '12px', color: HBC_COLORS.gray400 }}>Internal, Owner Contract & Sub-Contract</div>
            </div>

            {(hasPermission(PERMISSIONS.PROJECT_RECORD_EDIT) || hasPermission(PERMISSIONS.PROJECT_RECORD_OPS_EDIT)) && (
              <div
                style={quickActionCardStyle}
                onClick={() => navigate('/project-record')}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, color: HBC_COLORS.navy, marginBottom: '6px' }}>
                  Project Record
                </div>
                <div style={{ fontSize: '12px', color: HBC_COLORS.gray400 }}>Marketing & project narrative</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
