import * as React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useLeads } from '../../hooks/useLeads';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { StageBadge } from '../../shared/StageBadge';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { ILead } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';
import { formatCurrency, formatDate, formatSquareFeet } from '../../../utils/formatters';

export const ProjectDashboard: React.FC = () => {
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
    </div>
  );
};
