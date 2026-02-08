import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { HBC_COLORS } from '../../../theme/tokens';
import { useEstimating } from '../../hooks/useEstimating';

export const EstimatingKickoffList: React.FC = () => {
  const navigate = useNavigate();
  const { records, isLoading, error, fetchCurrentPursuits } = useEstimating();

  React.useEffect(() => {
    fetchCurrentPursuits().catch(console.error);
  }, [fetchCurrentPursuits]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: HBC_COLORS.navy, margin: 0 }}>Estimating Kick-Off</h1>
        <p style={{ fontSize: 13, color: HBC_COLORS.gray500, marginTop: 4 }}>
          Active pursuits ready for kick-off checklists.
        </p>
      </div>

      {isLoading && (
        <div style={{ padding: 24, textAlign: 'center', color: HBC_COLORS.gray500 }}>Loading pursuits...</div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#FDE8E8', color: '#9B1C1C', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {!isLoading && records.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: HBC_COLORS.gray500 }}>
          No active pursuits found.
        </div>
      )}

      {records.length > 0 && (
        <div style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px', padding: '10px 16px', background: HBC_COLORS.gray50, borderBottom: `1px solid ${HBC_COLORS.gray200}`, fontSize: 11, fontWeight: 700, color: HBC_COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <span>Project</span>
            <span>Project Code</span>
            <span>Lead Estimator</span>
            <span></span>
          </div>
          {records.map(record => (
            <div key={record.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px', padding: '12px 16px', alignItems: 'center', borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
              <div style={{ fontWeight: 600, color: HBC_COLORS.navy }}>{record.Title}</div>
              <div style={{ color: HBC_COLORS.gray600 }}>{record.ProjectCode}</div>
              <div style={{ color: HBC_COLORS.gray500 }}>{record.LeadEstimator ?? '—'}</div>
              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={() => navigate(`/kickoff/${record.ProjectCode}`)}
                  style={{ padding: '6px 12px', background: HBC_COLORS.orange, color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
