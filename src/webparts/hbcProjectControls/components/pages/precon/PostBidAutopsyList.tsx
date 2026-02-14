import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePostBidAutopsy } from '../../hooks/usePostBidAutopsy';
import { useLeads } from '../../hooks/useLeads';
import { useAppContext } from '../../contexts/AppContext';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { buildBreadcrumbs, ILead, Stage, PERMISSIONS } from '@hbc/sp-services';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';

export const PostBidAutopsyList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { hasPermission } = useAppContext();
  const { allAutopsies, isLoading: autopsyLoading, fetchAllAutopsies } = usePostBidAutopsy();
  const { leads, fetchLeads, isLoading: leadsLoading } = useLeads();
  const [showLeadSelector, setShowLeadSelector] = React.useState(false);

  React.useEffect(() => {
    fetchAllAutopsies().catch(console.error);
    fetchLeads().catch(console.error);
  }, [fetchAllAutopsies, fetchLeads]);

  const isLoading = autopsyLoading || leadsLoading;

  // Get all leads with ArchivedLoss stage
  const lostLeads = React.useMemo(() =>
    leads.filter(l => l.Stage === Stage.ArchivedLoss),
    [leads]
  );

  // Map leads to their autopsy status
  const rows = React.useMemo(() => {
    return lostLeads.map(lead => {
      const autopsy = allAutopsies.find(a => a.leadId === lead.id);
      return {
        lead,
        autopsy,
        status: autopsy?.isFinalized ? 'Finalized' : autopsy ? 'In Progress' : 'Pending',
        processScore: autopsy?.processScore ?? null,
        overallRating: autopsy?.overallRating ?? null,
      };
    });
  }, [lostLeads, allAutopsies]);

  // Leads eligible for a new autopsy (ArchivedLoss without existing autopsy)
  const eligibleLeads = React.useMemo(() =>
    rows.filter(r => r.status === 'Pending').map(r => r.lead),
    [rows]
  );

  const canCreate = hasPermission(PERMISSIONS.AUTOPSY_CREATE);

  if (isLoading) return <SkeletonLoader variant="table" rows={6} columns={4} />;

  return (
    <div>
      <PageHeader
        title="Post-Bid Autopsies"
        subtitle={`${rows.length} lost projects — ${rows.filter(r => r.status === 'Finalized').length} finalized`}
        breadcrumb={<Breadcrumb items={breadcrumbs} />}
        actions={canCreate ? (
          <button
            onClick={() => setShowLeadSelector(prev => !prev)}
            disabled={eligibleLeads.length === 0}
            title={eligibleLeads.length === 0 ? 'All lost projects already have autopsy reports' : undefined}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: eligibleLeads.length === 0 ? HBC_COLORS.gray300 : HBC_COLORS.orange,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: eligibleLeads.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Create New Autopsy Report
          </button>
        ) : undefined}
      />

      {/* Inline lead selector */}
      {showLeadSelector && eligibleLeads.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          marginBottom: 16,
          backgroundColor: HBC_COLORS.gray50,
          borderRadius: 8,
          border: `1px solid ${HBC_COLORS.gray200}`,
        }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: HBC_COLORS.navy, whiteSpace: 'nowrap' }}>
            Select project:
          </label>
          <select
            defaultValue=""
            onChange={e => {
              if (e.target.value) {
                navigate(`/preconstruction/pursuit/${e.target.value}/autopsy-form`);
                setShowLeadSelector(false);
              }
            }}
            style={{
              flex: 1,
              maxWidth: 400,
              padding: '6px 10px',
              borderRadius: 6,
              border: `1px solid ${HBC_COLORS.gray200}`,
              fontSize: 13,
              backgroundColor: '#fff',
              color: HBC_COLORS.gray800,
            }}
          >
            <option value="">Select a lost project...</option>
            {eligibleLeads.map(lead => (
              <option key={lead.id} value={lead.id}>
                {lead.Title} — {lead.ClientName}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowLeadSelector(false)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: `1px solid ${HBC_COLORS.gray300}`,
              backgroundColor: '#fff',
              fontSize: 13,
              color: HBC_COLORS.gray600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {rows.length === 0 && (
        <div style={emptyStyle}>
          No lost projects found. Autopsies will appear here when a project is marked as a loss.
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {rows.map(row => (
          <div
            key={row.lead.id}
            onClick={() => navigate(`/preconstruction/pursuit/${row.lead.id}/autopsy-form`)}
            style={rowStyle}
            onMouseEnter={e => (e.currentTarget.style.borderColor = HBC_COLORS.orange)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = HBC_COLORS.gray200)}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: HBC_COLORS.navy }}>
                {row.lead.Title}
              </div>
              <div style={{ fontSize: 13, color: HBC_COLORS.gray500, marginTop: 2 }}>
                {row.lead.ClientName}
                {row.lead.LossCompetitor && ` — Lost to: ${row.lead.LossCompetitor}`}
              </div>
              {row.lead.LossReason && (
                <div style={{ fontSize: 12, color: HBC_COLORS.gray400, marginTop: 4 }}>
                  Reasons: {Array.isArray(row.lead.LossReason) ? row.lead.LossReason.join(', ') : row.lead.LossReason}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {row.processScore !== null && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: HBC_COLORS.gray400, textTransform: 'uppercase' as const }}>Score</div>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: row.processScore >= 70 ? '#10B981' : row.processScore >= 50 ? '#F59E0B' : '#EF4444',
                  }}>
                    {row.processScore}%
                  </div>
                </div>
              )}

              {row.overallRating !== null && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: HBC_COLORS.gray400, textTransform: 'uppercase' as const }}>Rating</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: HBC_COLORS.navy }}>
                    {row.overallRating}/10
                  </div>
                </div>
              )}

              <div style={{
                padding: '4px 12px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: row.status === 'Finalized' ? '#D1FAE5' : row.status === 'In Progress' ? '#FEF3C7' : '#FDE8E8',
                color: row.status === 'Finalized' ? '#065F46' : row.status === 'In Progress' ? '#92400E' : '#9B1C1C',
                minWidth: 80,
                textAlign: 'center' as const,
              }}>
                {row.status}
              </div>

              <button
                onClick={e => {
                  e.stopPropagation();
                  navigate(`/preconstruction/pursuit/${row.lead.id}/autopsy-form`);
                }}
                style={{
                  padding: '6px 16px',
                  backgroundColor: HBC_COLORS.navy,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {row.status === 'Finalized' ? 'View' : 'Open'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '16px 20px',
  backgroundColor: '#fff',
  borderRadius: 8,
  border: `1px solid ${HBC_COLORS.gray200}`,
  cursor: 'pointer',
  transition: 'border-color 0.15s',
  boxShadow: ELEVATION.level1,
};

const emptyStyle: React.CSSProperties = {
  padding: 48,
  textAlign: 'center',
  color: HBC_COLORS.gray500,
  backgroundColor: '#fff',
  borderRadius: 8,
  border: `1px solid ${HBC_COLORS.gray200}`,
};
