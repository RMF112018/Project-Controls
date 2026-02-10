import * as React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@fluentui/react-components';
import { useLeads } from '../../hooks/useLeads';
import { useAppContext } from '../../contexts/AppContext';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { buildBreadcrumbs } from '../../../utils/breadcrumbs';
import { StageBadge } from '../../shared/StageBadge';
import { ScoreTierBadge } from '../../shared/ScoreTierBadge';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { ILead, Stage, GoNoGoDecision, AuditAction, EntityType } from '../../../models';
import { ProvisioningStatusView } from '../../shared/ProvisioningStatus';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';
import { formatCurrency, formatDate, formatSquareFeet } from '../../../utils/formatters';
import { PERMISSIONS } from '../../../utils/permissions';
import { useToast } from '../../shared/ToastContainer';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, dataService, currentUser } = useAppContext();
  const { addToast } = useToast();
  const { getLeadById, updateLead } = useLeads();
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

  const handleSave = async (): Promise<void> => {
    if (!lead) return;
    try {
      const updated = await updateLead(lead.id, editData);
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
              <span style={valueStyle}>{lead.Title}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Client</span>
              <span style={valueStyle}>{lead.ClientName}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>A/E</span>
              <span style={valueStyle}>{lead.AE || '-'}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Location</span>
              <span style={valueStyle}>{lead.CityLocation || '-'}, {lead.Region}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Sector</span>
              <span style={valueStyle}>{lead.Sector} {lead.SubSector ? `/ ${lead.SubSector}` : ''}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Division</span>
              <span style={valueStyle}>{lead.Division}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Delivery Method</span>
              <span style={valueStyle}>{lead.DeliveryMethod || '-'}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Square Feet</span>
              <span style={valueStyle}>{lead.SquareFeet ? formatSquareFeet(lead.SquareFeet) : '-'}</span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Project Value</span>
              <span style={{ ...valueStyle, fontWeight: 600 }}>
                {lead.ProjectValue ? formatCurrency(lead.ProjectValue) : '-'}
              </span>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Originator</span>
              <span style={valueStyle}>{lead.Originator}</span>
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
