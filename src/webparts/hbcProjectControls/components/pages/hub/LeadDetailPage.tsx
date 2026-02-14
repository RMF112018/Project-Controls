import * as React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, Select, Textarea } from '@fluentui/react-components';
import { useLeads } from '../../hooks/useLeads';
import { useAppContext } from '../../contexts/AppContext';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import {
  buildBreadcrumbs,
  ILead,
  Stage,
  Region,
  Sector,
  Division,
  DepartmentOfOrigin,
  DeliveryMethod,
  GoNoGoDecision,
  AuditAction,
  EntityType,
  formatCurrency,
  formatDate,
  formatSquareFeet,
  PERMISSIONS
} from '@hbc/sp-services';
import { StageBadge } from '../../shared/StageBadge';
import { ScoreTierBadge } from '../../shared/ScoreTierBadge';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { useSectorDefinitions } from '../../hooks/useSectorDefinitions';
import { ProvisioningStatusView } from '../../shared/ProvisioningStatus';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';
import { useToast } from '../../shared/ToastContainer';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, dataService, currentUser, isFeatureEnabled } = useAppContext();
  const { addToast } = useToast();
  const { getLeadById, updateLead } = useLeads();
  const { activeSectors } = useSectorDefinitions();
  const [lead, setLead] = React.useState<ILead | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editData, setEditData] = React.useState<Partial<ILead>>({});
  const breadcrumbs = buildBreadcrumbs(location.pathname, lead?.Title);

  React.useEffect(() => {
    if (id) {
      setIsLoading(true);
      getLeadById(Number(id)).then(data => {
        setLead(data);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }
  }, [id, getLeadById]);

  const handleEditChange = (field: string, value: string | number): void => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (): Promise<void> => {
    if (!lead) return;
    try {
      // Sync CityLocation from AddressCity if address was changed
      const saveData = { ...editData };
      if (saveData.AddressCity !== undefined) {
        saveData.CityLocation = saveData.AddressCity;
      }
      const updated = await updateLead(lead.id, saveData);
      // Audit log for each changed field
      for (const [field, newValue] of Object.entries(editData)) {
        const prevValue = (lead as unknown as Record<string, unknown>)[field];
        if (prevValue !== newValue) {
          dataService.logAudit({
            Action: AuditAction.LeadEdited,
            EntityType: EntityType.Lead,
            EntityId: String(lead.id),
            ProjectCode: lead.ProjectCode,
            FieldChanged: field,
            PreviousValue: prevValue != null ? String(prevValue) : '',
            NewValue: newValue != null ? String(newValue) : '',
            User: currentUser?.displayName || 'Unknown',
            UserId: currentUser?.id,
            Details: `Lead "${lead.Title}" field "${field}" updated`,
          }).catch(console.error);
        }
      }
      setLead(updated);
      setIsEditing(false);
      setEditData({});
      addToast('Lead updated', 'success');
    } catch (err) {
      console.error('Failed to save:', err);
      addToast('Failed to update lead', 'error');
    }
  };

  if (isLoading) return <SkeletonLoader variant="form" rows={8} />;
  if (!lead) return <div style={{ padding: '24px' }}>Lead not found</div>;

  const fieldStyle: React.CSSProperties = { marginBottom: '16px' };
  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: HBC_COLORS.gray500,
    marginBottom: '4px',
    display: 'block',
  };
  const valueStyle: React.CSSProperties = {
    fontSize: '14px',
    color: HBC_COLORS.gray800,
  };
  const inputWrapStyle: React.CSSProperties = { width: '100%' };

  const editVal = (field: keyof ILead): string => {
    const v = editData[field] ?? (lead as unknown as Record<string, unknown>)[field as string];
    return v != null ? String(v) : '';
  };

  return (
    <div>
      <PageHeader
        title={lead.Title}
        subtitle={`${lead.ClientName} \u2014 ${lead.Region}`}
        breadcrumb={<Breadcrumb items={breadcrumbs} />}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button appearance="secondary" onClick={() => navigate(-1)}>Back</Button>
            {hasPermission(PERMISSIONS.GONOGO_READ) && (
              lead.GoNoGoDecision
                ? <Button appearance="subtle" onClick={() => navigate(`/lead/${lead.id}/gonogo/detail`)}>View Scorecard</Button>
                : <Button appearance="primary" style={{ backgroundColor: '#F59E0B' }} onClick={() => navigate(`/lead/${lead.id}/gonogo`)}>Go/No-Go Scorecard</Button>
            )}
            {hasPermission(PERMISSIONS.MEETING_SCHEDULE) && lead.Stage === Stage.GoNoGoPending && (
              <Button appearance="primary" onClick={() => navigate(`/lead/${lead.id}/schedule-gonogo`)}>
                Schedule Go/No-Go
              </Button>
            )}
            {hasPermission(PERMISSIONS.LEAD_EDIT) && !isEditing && (
              <Button appearance="primary" onClick={() => { setIsEditing(true); setEditData({}); }}>
                Edit
              </Button>
            )}
            {isEditing && (
              <>
                <Button appearance="secondary" onClick={() => { setIsEditing(false); setEditData({}); }}>
                  Cancel
                </Button>
                <Button appearance="primary" onClick={handleSave}>Save</Button>
              </>
            )}
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: ELEVATION.level1,
        }}>
          <h3 style={{ margin: '0 0 16px', color: HBC_COLORS.navy }}>Project Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={fieldStyle}>
              <span style={labelStyle}>Project Name</span>
              {isEditing ? (
                <Input style={inputWrapStyle} value={editVal('Title')} onChange={(_, d) => handleEditChange('Title', d.value)} />
              ) : (
                <span style={valueStyle}>{lead.Title}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Client</span>
              {isEditing ? (
                <Input style={inputWrapStyle} value={editVal('ClientName')} onChange={(_, d) => handleEditChange('ClientName', d.value)} />
              ) : (
                <span style={valueStyle}>{lead.ClientName}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>A/E</span>
              {isEditing ? (
                <Input style={inputWrapStyle} value={editVal('AE')} onChange={(_, d) => handleEditChange('AE', d.value)} />
              ) : (
                <span style={valueStyle}>{lead.AE || '-'}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Region</span>
              {isEditing ? (
                <Select style={inputWrapStyle} value={editVal('Region')} onChange={(_, d) => handleEditChange('Region', d.value)}>
                  {Object.values(Region).map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
              ) : (
                <span style={valueStyle}>{lead.Region}</span>
              )}
            </div>

            {/* Address fields */}
            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <span style={labelStyle}>Street Address</span>
              {isEditing ? (
                <Input style={inputWrapStyle} value={editVal('AddressStreet')} onChange={(_, d) => handleEditChange('AddressStreet', d.value)} />
              ) : (
                <span style={valueStyle}>{lead.AddressStreet || '-'}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>City</span>
              {isEditing ? (
                <Input style={inputWrapStyle} value={editVal('AddressCity')} onChange={(_, d) => handleEditChange('AddressCity', d.value)} />
              ) : (
                <span style={valueStyle}>{lead.AddressCity || lead.CityLocation || '-'}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>State</span>
              {isEditing ? (
                <Select style={inputWrapStyle} value={editVal('AddressState')} onChange={(_, d) => handleEditChange('AddressState', d.value)}>
                  <option value="">Select...</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              ) : (
                <span style={valueStyle}>{lead.AddressState || '-'}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Zip Code</span>
              {isEditing ? (
                <Input style={inputWrapStyle} value={editVal('AddressZip')} onChange={(_, d) => handleEditChange('AddressZip', d.value)} />
              ) : (
                <span style={valueStyle}>{lead.AddressZip || '-'}</span>
              )}
            </div>

            <div style={fieldStyle}>
              <span style={labelStyle}>Sector</span>
              {isEditing ? (
                <Select style={inputWrapStyle} value={editVal('Sector')} onChange={(_, d) => handleEditChange('Sector', d.value)}>
                  <option value="">Select...</option>
                  {(isFeatureEnabled('PermissionEngine') && activeSectors.length > 0
                    ? activeSectors.map(s => <option key={s.label} value={s.label}>{s.label}</option>)
                    : Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)
                  )}
                </Select>
              ) : (
                <span style={valueStyle}>{lead.Sector} {lead.SubSector ? `/ ${lead.SubSector}` : ''}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Sub-Sector</span>
              {isEditing ? (
                <Input style={inputWrapStyle} value={editVal('SubSector')} onChange={(_, d) => handleEditChange('SubSector', d.value)} />
              ) : (
                <span style={valueStyle}>{lead.SubSector || '-'}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Division</span>
              {isEditing ? (
                <Select style={inputWrapStyle} value={editVal('Division')} onChange={(_, d) => handleEditChange('Division', d.value)}>
                  {Object.values(Division).map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              ) : (
                <span style={valueStyle}>{lead.Division}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Department of Origin</span>
              {isEditing ? (
                <Select style={inputWrapStyle} value={editVal('DepartmentOfOrigin')} onChange={(_, d) => handleEditChange('DepartmentOfOrigin', d.value)}>
                  {Object.values(DepartmentOfOrigin).map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              ) : (
                <span style={valueStyle}>{lead.DepartmentOfOrigin || '-'}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Delivery Method</span>
              {isEditing ? (
                <Select style={inputWrapStyle} value={editVal('DeliveryMethod')} onChange={(_, d) => handleEditChange('DeliveryMethod', d.value)}>
                  <option value="">Select...</option>
                  {Object.values(DeliveryMethod).map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              ) : (
                <span style={valueStyle}>{lead.DeliveryMethod || '-'}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Square Feet</span>
              {isEditing ? (
                <Input type="number" style={inputWrapStyle} value={editVal('SquareFeet')} onChange={(_, d) => handleEditChange('SquareFeet', Number(d.value))} />
              ) : (
                <span style={valueStyle}>{lead.SquareFeet ? formatSquareFeet(lead.SquareFeet) : '-'}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Project Value</span>
              {isEditing ? (
                <Input type="number" style={inputWrapStyle} value={editVal('ProjectValue')} onChange={(_, d) => handleEditChange('ProjectValue', Number(d.value))} contentBefore={<span style={{ color: HBC_COLORS.gray500 }}>$</span>} />
              ) : (
                <span style={{ ...valueStyle, fontWeight: 600 }}>
                  {lead.ProjectValue ? formatCurrency(lead.ProjectValue) : '-'}
                </span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Proposal/Bid Due</span>
              {isEditing ? (
                <Input type="date" style={inputWrapStyle} value={editVal('ProposalBidDue')} onChange={(_, d) => handleEditChange('ProposalBidDue', d.value)} />
              ) : (
                <span style={valueStyle}>{lead.ProposalBidDue ? formatDate(lead.ProposalBidDue) : '-'}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Project Start Date</span>
              {isEditing ? (
                <Input type="date" style={inputWrapStyle} value={editVal('ProjectStartDate')} onChange={(_, d) => handleEditChange('ProjectStartDate', d.value)} />
              ) : (
                <span style={valueStyle}>{lead.ProjectStartDate ? formatDate(lead.ProjectStartDate) : '-'}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Anticipated Fee (%)</span>
              {isEditing ? (
                <Input type="number" style={inputWrapStyle} value={editVal('AnticipatedFeePct')} onChange={(_, d) => handleEditChange('AnticipatedFeePct', Number(d.value))} contentAfter={<span style={{ color: HBC_COLORS.gray500 }}>%</span>} />
              ) : (
                <span style={valueStyle}>{lead.AnticipatedFeePct != null ? `${lead.AnticipatedFeePct}%` : '-'}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Anticipated Gross Margin (%)</span>
              {isEditing ? (
                <Input type="number" style={inputWrapStyle} value={editVal('AnticipatedGrossMargin')} onChange={(_, d) => handleEditChange('AnticipatedGrossMargin', Number(d.value))} contentAfter={<span style={{ color: HBC_COLORS.gray500 }}>%</span>} />
              ) : (
                <span style={valueStyle}>{lead.AnticipatedGrossMargin != null ? `${lead.AnticipatedGrossMargin}%` : '-'}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Originator</span>
              <span style={valueStyle}>{lead.Originator}</span>
            </div>
            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <span style={labelStyle}>Notes</span>
              {isEditing ? (
                <Textarea style={{ width: '100%' }} rows={3} value={editVal('Notes' as keyof ILead)} onChange={(_, d) => handleEditChange('Notes', d.value)} />
              ) : (
                <span style={valueStyle}>{(lead as unknown as Record<string, unknown>).Notes as string || '-'}</span>
              )}
            </div>
          </div>
        </div>

        <div>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: ELEVATION.level1,
            marginBottom: '16px',
          }}>
            <h3 style={{ margin: '0 0 12px', color: HBC_COLORS.navy }}>Status</h3>
            <div style={fieldStyle}>
              <span style={labelStyle}>Stage</span>
              <StageBadge stage={lead.Stage} size="medium" />
            </div>
            {lead.ProjectCode && (
              <div style={fieldStyle}>
                <span style={labelStyle}>Project Code</span>
                <span style={{ ...valueStyle, fontWeight: 600, fontFamily: 'monospace' }}>
                  {lead.ProjectCode}
                </span>
              </div>
            )}
            <div style={fieldStyle}>
              <span style={labelStyle}>Date Submitted</span>
              <span style={valueStyle}>{formatDate(lead.DateOfEvaluation)}</span>
            </div>
          </div>

          {(lead.GoNoGoScore_Originator !== undefined || lead.GoNoGoScore_Committee !== undefined) && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: ELEVATION.level1,
            }}>
              <h3 style={{ margin: '0 0 12px', color: HBC_COLORS.navy }}>Go/No-Go Scores</h3>
              {lead.GoNoGoScore_Originator !== undefined && (
                <div style={fieldStyle}>
                  <span style={labelStyle}>Originator Score</span>
                  <ScoreTierBadge score={lead.GoNoGoScore_Originator} showLabel />
                </div>
              )}
              {lead.GoNoGoScore_Committee !== undefined && (
                <div style={fieldStyle}>
                  <span style={labelStyle}>Committee Score</span>
                  <ScoreTierBadge score={lead.GoNoGoScore_Committee} showLabel />
                </div>
              )}
              {lead.GoNoGoDecision && (
                <div style={fieldStyle}>
                  <span style={labelStyle}>Decision</span>
                  <span style={{
                    ...valueStyle,
                    fontWeight: 700,
                    color: lead.GoNoGoDecision === GoNoGoDecision.Go
                      ? HBC_COLORS.success
                      : lead.GoNoGoDecision === GoNoGoDecision.NoGo
                        ? HBC_COLORS.error
                        : HBC_COLORS.warning,
                  }}>
                    {lead.GoNoGoDecision}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Provisioning Status — shown after GO decision */}
          {lead.GoNoGoDecision === GoNoGoDecision.Go && lead.ProjectCode && (
            <div style={{ marginTop: '16px' }}>
              {lead.ProjectSiteURL ? (
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  padding: '24px',
                  boxShadow: ELEVATION.level1,
                }}>
                  <h3 style={{ margin: '0 0 12px', color: HBC_COLORS.navy }}>Project Site</h3>
                  <a
                    href={lead.ProjectSiteURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: HBC_COLORS.navy, fontWeight: 600, fontSize: '14px' }}
                  >
                    {lead.ProjectSiteURL}
                  </a>
                </div>
              ) : (
                <ProvisioningStatusView projectCode={lead.ProjectCode} compact pollInterval={1000} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
