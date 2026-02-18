import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, Select } from '@fluentui/react-components';
import { useLeads } from '../../hooks/useLeads';
import { useNotifications } from '../../hooks/useNotifications';
import { useAppContext } from '../../contexts/AppContext';
import { RoleGate } from '../../guards/RoleGate';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import {
  buildBreadcrumbs,
  ILeadFormData,
  Stage,
  Region,
  Sector,
  Division,
  DepartmentOfOrigin,
  DeliveryMethod,
  RoleName,
  NotificationEvent,
  AuditAction,
  EntityType,
  validateLeadForm
} from '@hbc/sp-services';
import { useSectorDefinitions } from '../../hooks/useSectorDefinitions';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';
import { useToast } from '../../shared/ToastContainer';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

export const LeadFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { createLead } = useLeads();
  const { notify } = useNotifications();
  const { currentUser, dataService, isFeatureEnabled } = useAppContext();
  const { addToast } = useToast();
  const { activeSectors } = useSectorDefinitions();
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
        CityLocation: formData.AddressCity || formData.CityLocation || '',
        Originator: currentUser?.displayName || 'Unknown',
        OriginatorId: currentUser?.id,
        DateOfEvaluation: new Date().toISOString(),
        DateSubmitted: new Date().toISOString().split('T')[0],
      };
      const newLead = await createLead(leadData as unknown as ILeadFormData);
      // Fire-and-forget audit log
      dataService.logAudit({
        Action: AuditAction.LeadCreated,
        EntityType: EntityType.Lead,
        EntityId: String(newLead.id),
        ProjectCode: newLead.ProjectCode,
        User: currentUser?.displayName || 'Unknown',
        UserId: currentUser?.id,
        Details: `Lead "${newLead.Title}" created for ${newLead.ClientName}`,
      }).catch(console.error);
      // Fire-and-forget notification
      notify(NotificationEvent.LeadSubmitted, {
        leadTitle: newLead.Title,
        leadId: newLead.id,
        clientName: newLead.ClientName,
      }).catch(console.error);
      // Fire-and-forget BD Leads folder creation
      try {
        const originatorName = currentUser?.displayName || 'Unknown';
        await dataService.createBdLeadFolder(newLead.Title, originatorName);
        dataService.logAudit({
          Action: AuditAction.LeadFolderCreated,
          EntityType: EntityType.Lead,
          EntityId: String(newLead.id),
          User: originatorName,
          Details: `BD Leads folder created for "${newLead.Title}"`,
        }).catch(console.error);
      } catch (folderErr) {
        console.error('Failed to create BD Leads folder:', folderErr);
        addToast('Lead created but folder creation failed', 'error');
      }
      addToast('Lead created successfully', 'success');
      navigate('/');
    } catch (err) {
      console.error('Failed to create lead:', err);
      addToast('Failed to create lead', 'error');
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
          breadcrumb={<Breadcrumb items={breadcrumbs} />}
          actions={
            <Button appearance="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          }
        />
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: ELEVATION.level1,
          maxWidth: '800px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <label htmlFor="lead-Title" style={labelStyle}>Project Name *</label>
              <Input
                id="lead-Title"
                style={{ width: '100%' }}
                value={formData.Title || ''}
                onChange={(_, d) => handleChange('Title', d.value)}
                aria-required={true}
                aria-invalid={!!errors.Title}
                aria-describedby={errors.Title ? 'err-Title' : undefined}
              />
              {errors.Title && (
                <span id="err-Title" style={{ color: HBC_COLORS.error, fontSize: '12px' }}>{errors.Title}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-ClientName" style={labelStyle}>Client Name *</label>
              <Input
                id="lead-ClientName"
                style={{ width: '100%' }}
                value={formData.ClientName || ''}
                onChange={(_, d) => handleChange('ClientName', d.value)}
                aria-required={true}
                aria-invalid={!!errors.ClientName}
                aria-describedby={errors.ClientName ? 'err-ClientName' : undefined}
              />
              {errors.ClientName && (
                <span id="err-ClientName" style={{ color: HBC_COLORS.error, fontSize: '12px' }}>{errors.ClientName}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-AE" style={labelStyle}>A/E</label>
              <Input
                id="lead-AE"
                style={{ width: '100%' }}
                value={formData.AE || ''}
                onChange={(_, d) => handleChange('AE', d.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-Region" style={labelStyle}>Region *</label>
              <Select
                id="lead-Region"
                style={{ width: '100%' }}
                value={formData.Region || ''}
                onChange={(_, d) => handleChange('Region', d.value)}
                aria-required={true}
                aria-invalid={!!errors.Region}
                aria-describedby={errors.Region ? 'err-Region' : undefined}
              >
                <option value="">Select...</option>
                {Object.values(Region).map(r => <option key={r} value={r}>{r}</option>)}
              </Select>
              {errors.Region && (
                <span id="err-Region" style={{ color: HBC_COLORS.error, fontSize: '12px' }}>{errors.Region}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-Sector" style={labelStyle}>Sector *</label>
              <Select
                id="lead-Sector"
                style={{ width: '100%' }}
                value={formData.Sector || ''}
                onChange={(_, d) => handleChange('Sector', d.value)}
                aria-required={true}
                aria-invalid={!!errors.Sector}
                aria-describedby={errors.Sector ? 'err-Sector' : undefined}
              >
                <option value="">Select...</option>
                {(isFeatureEnabled('PermissionEngine') && activeSectors.length > 0
                  ? activeSectors.map(s => <option key={s.label} value={s.label}>{s.label}</option>)
                  : Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)
                )}
              </Select>
              {errors.Sector && (
                <span id="err-Sector" style={{ color: HBC_COLORS.error, fontSize: '12px' }}>{errors.Sector}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-Division" style={labelStyle}>Division *</label>
              <Select
                id="lead-Division"
                style={{ width: '100%' }}
                value={formData.Division || ''}
                onChange={(_, d) => handleChange('Division', d.value)}
                aria-required={true}
                aria-invalid={!!errors.Division}
                aria-describedby={errors.Division ? 'err-Division' : undefined}
              >
                <option value="">Select...</option>
                {Object.values(Division).map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
              {errors.Division && (
                <span id="err-Division" style={{ color: HBC_COLORS.error, fontSize: '12px' }}>{errors.Division}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-DepartmentOfOrigin" style={labelStyle}>Department of Origin *</label>
              <Select
                id="lead-DepartmentOfOrigin"
                style={{ width: '100%' }}
                value={formData.DepartmentOfOrigin || ''}
                onChange={(_, d) => handleChange('DepartmentOfOrigin', d.value)}
                aria-required={true}
                aria-invalid={!!errors.DepartmentOfOrigin}
                aria-describedby={errors.DepartmentOfOrigin ? 'err-DepartmentOfOrigin' : undefined}
              >
                <option value="">Select...</option>
                {Object.values(DepartmentOfOrigin).map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
              {errors.DepartmentOfOrigin && (
                <span id="err-DepartmentOfOrigin" style={{ color: HBC_COLORS.error, fontSize: '12px' }}>{errors.DepartmentOfOrigin}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-DeliveryMethod" style={labelStyle}>Delivery Method</label>
              <Select
                id="lead-DeliveryMethod"
                style={{ width: '100%' }}
                value={formData.DeliveryMethod || ''}
                onChange={(_, d) => handleChange('DeliveryMethod', d.value)}
              >
                <option value="">Select...</option>
                {Object.values(DeliveryMethod).map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-ProjectValue" style={labelStyle}>Project Value ($)</label>
              <Input
                id="lead-ProjectValue"
                type="number"
                style={{ width: '100%' }}
                value={String(formData.ProjectValue || '')}
                onChange={(_, d) => handleChange('ProjectValue', Number(d.value))}
                contentBefore={<span style={{ color: HBC_COLORS.gray500 }}>$</span>}
              />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-SquareFeet" style={labelStyle}>Square Feet</label>
              <Input
                id="lead-SquareFeet"
                type="number"
                style={{ width: '100%' }}
                value={String(formData.SquareFeet || '')}
                onChange={(_, d) => handleChange('SquareFeet', Number(d.value))}
              />
            </div>
            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <label htmlFor="lead-AddressStreet" style={labelStyle}>Street Address</label>
              <Input
                id="lead-AddressStreet"
                style={{ width: '100%' }}
                value={formData.AddressStreet || ''}
                onChange={(_, d) => handleChange('AddressStreet', d.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-AddressCity" style={labelStyle}>City *</label>
              <Input
                id="lead-AddressCity"
                style={{ width: '100%' }}
                value={formData.AddressCity || ''}
                onChange={(_, d) => handleChange('AddressCity', d.value)}
                aria-required={true}
                aria-invalid={!!errors.AddressCity}
                aria-describedby={errors.AddressCity ? 'err-AddressCity' : undefined}
              />
              {errors.AddressCity && (
                <span id="err-AddressCity" style={{ color: HBC_COLORS.error, fontSize: '12px' }}>{errors.AddressCity}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-AddressState" style={labelStyle}>State *</label>
              <Select
                id="lead-AddressState"
                style={{ width: '100%' }}
                value={formData.AddressState || ''}
                onChange={(_, d) => handleChange('AddressState', d.value)}
                aria-required={true}
                aria-invalid={!!errors.AddressState}
                aria-describedby={errors.AddressState ? 'err-AddressState' : undefined}
              >
                <option value="">Select...</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
              {errors.AddressState && (
                <span id="err-AddressState" style={{ color: HBC_COLORS.error, fontSize: '12px' }}>{errors.AddressState}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-AddressZip" style={labelStyle}>Zip Code</label>
              <Input
                id="lead-AddressZip"
                style={{ width: '100%' }}
                value={formData.AddressZip || ''}
                onChange={(_, d) => handleChange('AddressZip', d.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-SubSector" style={labelStyle}>Sub-Sector</label>
              <Input
                id="lead-SubSector"
                style={{ width: '100%' }}
                value={formData.SubSector || ''}
                onChange={(_, d) => handleChange('SubSector', d.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-PreconDurationMonths" style={labelStyle}>Precon Duration (months)</label>
              <Input
                id="lead-PreconDurationMonths"
                type="number"
                style={{ width: '100%' }}
                value={String(formData.PreconDurationMonths || '')}
                onChange={(_, d) => handleChange('PreconDurationMonths', Number(d.value))}
              />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-ProjectStartDate" style={labelStyle}>Project Start Date</label>
              <Input
                id="lead-ProjectStartDate"
                type="date"
                style={{ width: '100%' }}
                value={formData.ProjectStartDate || ''}
                onChange={(_, d) => handleChange('ProjectStartDate', d.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-ProjectDurationMonths" style={labelStyle}>Project Duration (months)</label>
              <Input
                id="lead-ProjectDurationMonths"
                type="number"
                style={{ width: '100%' }}
                value={String(formData.ProjectDurationMonths || '')}
                onChange={(_, d) => handleChange('ProjectDurationMonths', d.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-EstimatedPursuitCost" style={labelStyle}>Estimated Pursuit Cost ($)</label>
              <Input
                id="lead-EstimatedPursuitCost"
                type="number"
                style={{ width: '100%' }}
                value={String(formData.EstimatedPursuitCost || '')}
                onChange={(_, d) => handleChange('EstimatedPursuitCost', Number(d.value))}
                contentBefore={<span style={{ color: HBC_COLORS.gray500 }}>$</span>}
              />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-EstimatedPreconBudget" style={labelStyle}>Estimated Precon Budget ($)</label>
              <Input
                id="lead-EstimatedPreconBudget"
                type="number"
                style={{ width: '100%' }}
                value={String(formData.EstimatedPreconBudget || '')}
                onChange={(_, d) => handleChange('EstimatedPreconBudget', Number(d.value))}
                contentBefore={<span style={{ color: HBC_COLORS.gray500 }}>$</span>}
              />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-AnticipatedFeePct" style={labelStyle}>Anticipated Fee (%)</label>
              <Input
                id="lead-AnticipatedFeePct"
                type="number"
                style={{ width: '100%' }}
                value={String(formData.AnticipatedFeePct || '')}
                onChange={(_, d) => handleChange('AnticipatedFeePct', Number(d.value))}
                contentAfter={<span style={{ color: HBC_COLORS.gray500 }}>%</span>}
              />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-AnticipatedGrossMargin" style={labelStyle}>Anticipated Gross Margin (%)</label>
              <Input
                id="lead-AnticipatedGrossMargin"
                type="number"
                style={{ width: '100%' }}
                value={String(formData.AnticipatedGrossMargin || '')}
                onChange={(_, d) => handleChange('AnticipatedGrossMargin', Number(d.value))}
                contentAfter={<span style={{ color: HBC_COLORS.gray500 }}>%</span>}
              />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-ProposalBidDue" style={labelStyle}>Proposal/Bid Due Date</label>
              <Input
                id="lead-ProposalBidDue"
                type="date"
                style={{ width: '100%' }}
                value={formData.ProposalBidDue || ''}
                onChange={(_, d) => handleChange('ProposalBidDue', d.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="lead-AwardDate" style={labelStyle}>Award Date</label>
              <Input
                id="lead-AwardDate"
                type="date"
                style={{ width: '100%' }}
                value={formData.AwardDate || ''}
                onChange={(_, d) => handleChange('AwardDate', d.value)}
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
