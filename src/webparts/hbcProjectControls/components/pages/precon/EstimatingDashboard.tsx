import * as React from 'react';
import { useEstimating } from '../../hooks/useEstimating';
import { PageHeader } from '../../shared/PageHeader';
import { KPICard } from '../../shared/KPICard';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { EmptyState } from '../../shared/EmptyState';
import { IEstimatingTracker } from '../../../models';
import { HBC_COLORS } from '../../../theme/tokens';
import { formatCurrencyCompact, formatDate } from '../../../utils/formatters';

export const EstimatingDashboard: React.FC = () => {
  const { records, isLoading, fetchCurrentPursuits } = useEstimating();

  React.useEffect(() => {
    fetchCurrentPursuits().catch(console.error);
  }, [fetchCurrentPursuits]);

  const metrics = React.useMemo(() => {
    const totalValue = records.reduce((sum, r) => sum + (r.EstimatedCostValue || 0), 0);
    const dueSoon = records.filter(r => {
      if (!r.DueDate_OutTheDoor) return false;
      const due = new Date(r.DueDate_OutTheDoor);
      const now = new Date();
      const days = (due.getTime() - now.getTime()) / 86400000;
      return days >= 0 && days <= 14;
    });
    return { totalValue, dueSoon };
  }, [records]);

  const checklistCount = (r: IEstimatingTracker): string => {
    const checks = [r.Chk_BidBond, r.Chk_PPBond, r.Chk_Schedule, r.Chk_Logistics, r.Chk_BIMProposal, r.Chk_PreconProposal, r.Chk_ProposalTabs, r.Chk_CoordMarketing, r.Chk_BusinessTerms];
    const done = checks.filter(Boolean).length;
    return `${done}/${checks.length}`;
  };

  if (isLoading) return <LoadingSpinner label="Loading estimating data..." />;

  const headerStyle: React.CSSProperties = { padding: '8px 12px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray500, borderBottom: `2px solid ${HBC_COLORS.gray200}` };
  const cellStyle: React.CSSProperties = { padding: '10px 12px', fontSize: '13px', borderBottom: `1px solid ${HBC_COLORS.gray100}`, color: HBC_COLORS.gray800 };

  return (
    <div>
      <PageHeader title="Estimating Dashboard" subtitle="Current pursuit and precon tracking" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <KPICard title="Active Pursuits" value={records.length} />
        <KPICard title="Total Est. Value" value={formatCurrencyCompact(metrics.totalValue)} />
        <KPICard title="Due Within 14 Days" value={metrics.dueSoon.length} subtitle="Requires immediate attention" />
      </div>

      {records.length === 0 ? (
        <EmptyState title="No active pursuits" description="Estimating records with Pending status will appear here" />
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerStyle}>Project</th>
                <th style={headerStyle}>Code</th>
                <th style={headerStyle}>Lead Estimator</th>
                <th style={headerStyle}>Due Date</th>
                <th style={headerStyle}>Est. Value</th>
                <th style={headerStyle}>Type</th>
                <th style={headerStyle}>Checklist</th>
                <th style={headerStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <tr key={record.id}>
                  <td style={{ ...cellStyle, fontWeight: 500, color: HBC_COLORS.navy }}>{record.Title}</td>
                  <td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: '12px' }}>{record.ProjectCode}</td>
                  <td style={cellStyle}>{record.LeadEstimator || '-'}</td>
                  <td style={cellStyle}>{formatDate(record.DueDate_OutTheDoor)}</td>
                  <td style={cellStyle}>{formatCurrencyCompact(record.EstimatedCostValue)}</td>
                  <td style={cellStyle}>{record.DeliverableType || '-'}</td>
                  <td style={cellStyle}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: HBC_COLORS.navy }}>{checklistCount(record)}</span>
                  </td>
                  <td style={cellStyle}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 500,
                      backgroundColor: record.AwardStatus === 'Pending' ? HBC_COLORS.warningLight : record.AwardStatus?.includes('Awarded') ? HBC_COLORS.successLight : HBC_COLORS.gray100,
                      color: record.AwardStatus === 'Pending' ? '#92400E' : record.AwardStatus?.includes('Awarded') ? '#065F46' : HBC_COLORS.gray600,
                    }}>
                      {record.AwardStatus || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
