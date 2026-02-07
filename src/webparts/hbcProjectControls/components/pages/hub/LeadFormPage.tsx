import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select } from '@fluentui/react-components';
import { useLeads } from '../../hooks/useLeads';
import { useAppContext } from '../../contexts/AppContext';
import { RoleGate } from '../../guards/RoleGate';
import { PageHeader } from '../../shared/PageHeader';
import { ILeadFormData, Stage, Region, Sector, Division, DepartmentOfOrigin, DeliveryMethod, RoleName } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';
import { validateLeadForm } from '../../../utils/validators';

export const LeadFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { createLead } = useLeads();
  const { currentUser } = useAppContext();
  const [formData, setFormData] = React.useState<Partial<ILeadFormData>>({
    Stage: Stage.LeadDiscovery,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  const handleChange = (field: string, value: string | number): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (): Promise<void> => {
    const validationErrors = validateLeadForm(formData);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach(e => { errorMap[e.field] = e.message; });
      setErrors(errorMap);
      return;
    }
    try {
      setIsSaving(true);
      const leadData = {
        ...formData,
        Originator: currentUser?.displayName || 'Unknown',
        OriginatorId: currentUser?.id,
        DateOfEvaluation: new Date().toISOString(),
      };
      await createLead(leadData as unknown as ILeadFormData);
      navigate('/');
    } catch (err) {
      console.error('Failed to create lead:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const fieldStyle: React.CSSProperties = { marginBottom: '16px' };
  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: HBC_COLORS.gray700,
    marginBottom: '4px',
    display: 'block',
  };

  return (
    <RoleGate
      allowedRoles={[RoleName.BDRepresentative, RoleName.ExecutiveLeadership, RoleName.EstimatingCoordinator]}
      fallback={
        <div style={{ padding: '48px', textAlign: 'center', color: HBC_COLORS.gray500 }}>
          <h3>Access Restricted</h3>
          <p>You do not have permission to create leads.</p>
          <Button appearance="secondary" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      }
    >
      <div>
        <PageHeader
          title="New Lead"
          subtitle={`Submitting as ${currentUser?.displayName || 'Unknown'}`}
          actions={
            <Button appearance="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          }
        />
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          maxWidth: '800px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Project Name *</label>
              <Input
                style={{ width: '100%' }}
                value={formData.Title || ''}
                onChange={(_, d) => handleChange('Title', d.value)}
              />
              {errors.Title && (
                <span style={{ color: HBC_COLORS.error, fontSize: '12px' }}>{errors.Title}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Client Name *</label>
              <Input
                style={{ width: '100%' }}
                value={formData.ClientName || ''}
                onChange={(_, d) => handleChange('ClientName', d.value)}
              />
              {errors.ClientName && (
                <span style={{ color: HBC_COLORS.error, fontSize: '12px' }}>{errors.ClientName}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>A/E</label>
              <Input
                style={{ width: '100%' }}
                value={formData.AE || ''}
                onChange={(_, d) => handleChange('AE', d.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Region *</label>
              <Select
                style={{ width: '100%' }}
                value={formData.Region || ''}
                onChange={(_, d) => handleChange('Region', d.value)}
              >
                <option value="">Select...</option>
                {Object.values(Region).map(r => <option key={r} value={r}>{r}</option>)}
              </Select>
              {errors.Region && (
                <span style={{ color: HBC_COLORS.error, fontSize: '12px' }}>{errors.Region}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Sector *</label>
              <Select
                style={{ width: '100%' }}
                value={formData.Sector || ''}
                onChange={(_, d) => handleChange('Sector', d.value)}
              >
                <option value="">Select...</option>
                {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
              {errors.Sector && (
                <span style={{ color: HBC_COLORS.error, fontSize: '12px' }}>{errors.Sector}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Division *</label>
              <Select
                style={{ width: '100%' }}
                value={formData.Division || ''}
                onChange={(_, d) => handleChange('Division', d.value)}
              >
                <option value="">Select...</option>
                {Object.values(Division).map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
              {errors.Division && (
                <span style={{ color: HBC_COLORS.error, fontSize: '12px' }}>{errors.Division}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Department of Origin *</label>
              <Select
                style={{ width: '100%' }}
                value={formData.DepartmentOfOrigin || ''}
                onChange={(_, d) => handleChange('DepartmentOfOrigin', d.value)}
              >
                <option value="">Select...</option>
                {Object.values(DepartmentOfOrigin).map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
              {errors.DepartmentOfOrigin && (
                <span style={{ color: HBC_COLORS.error, fontSize: '12px' }}>{errors.DepartmentOfOrigin}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Delivery Method</label>
              <Select
                style={{ width: '100%' }}
                value={formData.DeliveryMethod || ''}
                onChange={(_, d) => handleChange('DeliveryMethod', d.value)}
              >
                <option value="">Select...</option>
                {Object.values(DeliveryMethod).map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Project Value ($)</label>
              <Input
                type="number"
                style={{ width: '100%' }}
                value={String(formData.ProjectValue || '')}
                onChange={(_, d) => handleChange('ProjectValue', Number(d.value))}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Square Feet</label>
              <Input
                type="number"
                style={{ width: '100%' }}
                value={String(formData.SquareFeet || '')}
                onChange={(_, d) => handleChange('SquareFeet', Number(d.value))}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>City/Location</label>
              <Input
                style={{ width: '100%' }}
                value={formData.CityLocation || ''}
                onChange={(_, d) => handleChange('CityLocation', d.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button appearance="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button appearance="primary" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Create Lead'}
            </Button>
          </div>
        </div>
      </div>
    </RoleGate>
  );
};
