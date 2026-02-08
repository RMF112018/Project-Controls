import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostBidAutopsy } from '../../hooks/usePostBidAutopsy';
import { useLeads } from '../../hooks/useLeads';
import { PageHeader } from '../../shared/PageHeader';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { ILead, Stage } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';

export const PostBidAutopsyList: React.FC = () => {
  const navigate = useNavigate();
  const { allAutopsies, isLoading: autopsyLoading, fetchAllAutopsies } = usePostBidAutopsy();
  const { leads, fetchLeads, isLoading: leadsLoading } = useLeads();

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

  if (isLoading) return <LoadingSpinner label="Loading autopsies..." />;

  return (
    <div>
      <PageHeader
        title="Post-Bid Autopsies"
        subtitle={`${rows.length} lost projects — ${rows.filter(r => r.status === 'Finalized').length} finalized`}
      />

      {rows.length === 0 && (
        <div style={emptyStyle}>
          No lost projects found. Autopsies will appear here when a project is marked as a loss.
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {rows.map(row => (
          <div
            key={row.lead.id}
            onClick={() => navigate(`/autopsy/${row.lead.id}`)}
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
                  navigate(`/autopsy/${row.lead.id}`);
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
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

const emptyStyle: React.CSSProperties = {
  padding: 48,
  textAlign: 'center',
  color: HBC_COLORS.gray500,
  backgroundColor: '#fff',
  borderRadius: 8,
  border: `1px solid ${HBC_COLORS.gray200}`,
};
