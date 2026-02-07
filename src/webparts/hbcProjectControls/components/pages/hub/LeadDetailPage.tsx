import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@fluentui/react-components';
import { useLeads } from '../../hooks/useLeads';
import { useAppContext } from '../../contexts/AppContext';
import { PageHeader } from '../../shared/PageHeader';
import { StageBadge } from '../../shared/StageBadge';
import { ScoreTierBadge } from '../../shared/ScoreTierBadge';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { ILead, Stage } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';
import { formatCurrency, formatDate, formatSquareFeet } from '../../../utils/formatters';
import { PERMISSIONS } from '../../../utils/permissions';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAppContext();
  const { getLeadById, updateLead } = useLeads();
  const [lead, setLead] = React.useState<ILead | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editData, setEditData] = React.useState<Partial<ILead>>({});

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
      setLead(updated);
      setIsEditing(false);
      setEditData({});
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  if (isLoading) return <LoadingSpinner />;
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
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
                    color: lead.GoNoGoDecision === 'GO'
                      ? HBC_COLORS.success
                      : lead.GoNoGoDecision === 'NO GO'
                        ? HBC_COLORS.error
                        : HBC_COLORS.warning,
                  }}>
                    {lead.GoNoGoDecision}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
