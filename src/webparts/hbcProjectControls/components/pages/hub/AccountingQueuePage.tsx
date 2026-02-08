import * as React from 'react';
import { HBC_COLORS } from '../../../theme/tokens';
import { useAppContext } from '../../contexts/AppContext';
import { useJobNumberRequest } from '../../hooks/useJobNumberRequest';
import { useLeads } from '../../hooks/useLeads';
import { RoleGate } from '../../guards/RoleGate';
import { RoleName, NotificationEvent } from '../../../models/enums';
import { IJobNumberRequest, JobNumberRequestStatus } from '../../../models/IJobNumberRequest';
import { ILead } from '../../../models/ILead';
import { NotificationService } from '../../../services/NotificationService';
import { ProvisioningService } from '../../../services/ProvisioningService';

const PROJECT_CODE_REGEX = /^\d{2}-\d{3}-\d{2}$/;

export const AccountingQueuePage: React.FC = () => {
  return (
    <RoleGate
      allowedRoles={[RoleName.AccountingManager, RoleName.ExecutiveLeadership]}
      fallback={<div style={{ padding: 40, textAlign: 'center', color: HBC_COLORS.gray500 }}>You do not have permission to view the Accounting Queue.</div>}
    >
      <AccountingQueueContent />
    </RoleGate>
  );
};

const AccountingQueueContent: React.FC = () => {
  const { dataService, currentUser } = useAppContext();
  const { requests, fetchRequests, finalizeJobNumber } = useJobNumberRequest();
  const { leads, fetchLeads, getLeadById } = useLeads();
  const [leadsMap, setLeadsMap] = React.useState<Record<number, ILead>>({});
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [jobNumberInputs, setJobNumberInputs] = React.useState<Record<number, string>>({});
  const [jobNumberErrors, setJobNumberErrors] = React.useState<Record<number, string>>({});
  const [isProcessing, setIsProcessing] = React.useState<number | null>(null);
  const [toastMessage, setToastMessage] = React.useState('');
  const [filter, setFilter] = React.useState<'pending' | 'completed' | 'all'>('pending');

  React.useEffect(() => {
    fetchRequests().catch(console.error);
    fetchLeads().catch(console.error);
  }, [fetchRequests, fetchLeads]);

  // Build lead lookup map
  React.useEffect(() => {
    const map: Record<number, ILead> = {};
    for (const l of leads) {
      map[l.id] = l;
    }
    setLeadsMap(map);
  }, [leads]);

  const filteredRequests = requests.filter(r => {
    if (filter === 'pending') return r.RequestStatus === JobNumberRequestStatus.Pending;
    if (filter === 'completed') return r.RequestStatus === JobNumberRequestStatus.Completed;
    return true;
  }).sort((a, b) => new Date(a.RequiredByDate).getTime() - new Date(b.RequiredByDate).getTime());

  const handleFinalize = async (request: IJobNumberRequest): Promise<void> => {
    const jobNumber = jobNumberInputs[request.id] || '';

    if (!PROJECT_CODE_REGEX.test(jobNumber)) {
      setJobNumberErrors(prev => ({ ...prev, [request.id]: 'Format must be yy-nnn-0m (e.g. 26-042-01)' }));
      return;
    }

    if (!currentUser) return;

    try {
      setIsProcessing(request.id);
      setJobNumberErrors(prev => ({ ...prev, [request.id]: '' }));

      // 1. Finalize the job number
      await finalizeJobNumber(request.id, jobNumber, currentUser.email);

      // 2. Re-key project code if a temp code existed
      const oldCode = request.TempProjectCode || leadsMap[request.LeadID]?.ProjectCode;
      if (oldCode && oldCode !== jobNumber) {
        await dataService.rekeyProjectCode(oldCode, jobNumber, request.LeadID);
      } else {
        // No temp code — just update the lead's project code
        await dataService.updateLead(request.LeadID, {
          ProjectCode: jobNumber,
          OfficialJobNumber: jobNumber,
          ProjectAddress: request.ProjectAddress,
          ProjectExecutive: request.ProjectExecutive,
          ProjectManager: request.ProjectManager,
        });
      }

      // 3. Update site title if site exists
      const lead = leadsMap[request.LeadID];
      if (lead?.ProjectSiteURL) {
        const provisioningService = new ProvisioningService(dataService);
        await provisioningService.updateSiteTitle(
          lead.ProjectSiteURL,
          `${jobNumber} — ${lead.Title}`
        );
      }

      // 4. If provisioning was held, trigger it now
      if (request.SiteProvisioningHeld && lead) {
        const provisioningService = new ProvisioningService(dataService);
        provisioningService.provisionSite({
          leadId: request.LeadID,
          projectCode: jobNumber,
          projectName: lead.Title,
          clientName: lead.ClientName,
          division: lead.Division,
          region: lead.Region,
          requestedBy: currentUser.email,
        }).catch(console.error);
      }

      // 5. Send notification
      const notificationService = new NotificationService(dataService);
      notificationService.notify(
        NotificationEvent.JobNumberAssigned,
        {
          leadTitle: lead?.Title ?? '',
          leadId: request.LeadID,
          clientName: lead?.ClientName ?? '',
          projectCode: jobNumber,
          jobNumber,
          assignedBy: currentUser.email,
        },
        currentUser.email
      ).catch(console.error);

      setToastMessage(`Job number ${jobNumber} assigned successfully.`);
      setTimeout(() => setToastMessage(''), 4000);

      // Refresh
      await fetchRequests();
      await fetchLeads();
    } catch (err) {
      setJobNumberErrors(prev => ({ ...prev, [request.id]: err instanceof Error ? err.message : 'Failed to finalize' }));
    } finally {
      setIsProcessing(null);
    }
  };

  const pendingCount = requests.filter(r => r.RequestStatus === JobNumberRequestStatus.Pending).length;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: HBC_COLORS.navy, margin: 0 }}>New Project Request Queue</h1>
          <p style={{ fontSize: 13, color: HBC_COLORS.gray500, margin: '4px 0 0' }}>
            {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['pending', 'completed', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: filter === f ? 'none' : `1px solid ${HBC_COLORS.gray200}`,
                background: filter === f ? HBC_COLORS.navy : 'transparent',
                color: filter === f ? '#fff' : HBC_COLORS.gray600,
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {toastMessage && (
        <div style={{ padding: '12px 16px', background: '#DEF7EC', color: '#03543F', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          {toastMessage}
        </div>
      )}

      {/* Table */}
      {filteredRequests.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: HBC_COLORS.gray400, background: HBC_COLORS.gray50, borderRadius: 8 }}>
          No {filter === 'all' ? '' : filter} requests found.
        </div>
      ) : (
        <div style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 8, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 80px', gap: 0, padding: '10px 16px', background: HBC_COLORS.gray50, borderBottom: `1px solid ${HBC_COLORS.gray200}`, fontSize: 11, fontWeight: 700, color: HBC_COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <span>Project</span>
            <span>Originator</span>
            <span>Required By</span>
            <span>Type</span>
            <span>Status</span>
            <span></span>
          </div>

          {filteredRequests.map(req => {
            const lead = leadsMap[req.LeadID];
            const isExpanded = expandedId === req.id;
            const isOverdue = req.RequestStatus === 'Pending' && new Date(req.RequiredByDate) < new Date();

            return (
              <div key={req.id} style={{ borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
                {/* Row */}
                <div
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 80px',
                    gap: 0, padding: '12px 16px', alignItems: 'center', fontSize: 13,
                    cursor: 'pointer', background: isExpanded ? HBC_COLORS.gray50 : 'transparent',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: HBC_COLORS.navy }}>{lead?.Title ?? `Lead #${req.LeadID}`}</div>
                    <div style={{ fontSize: 11, color: HBC_COLORS.gray400 }}>{lead?.ClientName ?? ''}</div>
                  </div>
                  <div style={{ color: HBC_COLORS.gray600 }}>{req.Originator}</div>
                  <div style={{ color: isOverdue ? '#DC2626' : HBC_COLORS.gray600, fontWeight: isOverdue ? 600 : 400 }}>
                    {req.RequiredByDate}
                  </div>
                  <div style={{ fontSize: 12 }}>{req.ProjectType}</div>
                  <div>
                    <span style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      background: req.RequestStatus === 'Completed' ? '#DEF7EC' : '#FEF3C7',
                      color: req.RequestStatus === 'Completed' ? '#03543F' : '#92400E',
                    }}>
                      {req.RequestStatus}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 16, color: HBC_COLORS.gray400 }}>
                    {isExpanded ? '\u25B2' : '\u25BC'}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div style={{ padding: '16px 16px 20px', background: HBC_COLORS.gray50, borderTop: `1px solid ${HBC_COLORS.gray200}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, fontSize: 13 }}>
                      <div>
                        <div style={detailLabelStyle}>Project Address</div>
                        <div style={detailValueStyle}>{req.ProjectAddress}</div>
                      </div>
                      <div>
                        <div style={detailLabelStyle}>Project Executive</div>
                        <div style={detailValueStyle}>{req.ProjectExecutive}</div>
                      </div>
                      <div>
                        <div style={detailLabelStyle}>Project Manager</div>
                        <div style={detailValueStyle}>{req.ProjectManager || '—'}</div>
                      </div>
                      <div>
                        <div style={detailLabelStyle}>Project Type</div>
                        <div style={detailValueStyle}>{req.ProjectTypeLabel}</div>
                      </div>
                      <div>
                        <div style={detailLabelStyle}>Estimating Only</div>
                        <div style={detailValueStyle}>{req.IsEstimatingOnly ? 'Yes' : 'No'}</div>
                      </div>
                      <div>
                        <div style={detailLabelStyle}>Provisioning</div>
                        <div style={detailValueStyle}>{req.SiteProvisioningHeld ? 'Held (awaiting number)' : `Created (${req.TempProjectCode ?? 'temp'})`}</div>
                      </div>
                    </div>

                    {req.RequestedCostCodes.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={detailLabelStyle}>Requested Cost Codes</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {req.RequestedCostCodes.map(c => (
                            <span key={c} style={{ padding: '2px 8px', background: HBC_COLORS.gray200, borderRadius: 10, fontSize: 11, color: HBC_COLORS.navy }}>{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {req.Notes && (
                      <div style={{ marginTop: 12 }}>
                        <div style={detailLabelStyle}>Notes</div>
                        <div style={{ ...detailValueStyle, fontStyle: 'italic' }}>{req.Notes}</div>
                      </div>
                    )}

                    {/* Finalize Section */}
                    {req.RequestStatus === 'Pending' ? (
                      <div style={{ marginTop: 20, padding: 16, background: HBC_COLORS.white, borderRadius: 6, border: `1px solid ${HBC_COLORS.gray200}` }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: HBC_COLORS.navy, marginBottom: 12 }}>Assign Official Job Number</div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <input
                              type="text"
                              placeholder="yy-nnn-0m (e.g. 26-042-01)"
                              value={jobNumberInputs[req.id] || ''}
                              onChange={e => {
                                setJobNumberInputs(prev => ({ ...prev, [req.id]: e.target.value }));
                                setJobNumberErrors(prev => ({ ...prev, [req.id]: '' }));
                              }}
                              style={{ width: '100%', padding: '8px 12px', border: `1px solid ${jobNumberErrors[req.id] ? '#DC2626' : HBC_COLORS.gray300}`, borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                            />
                            {jobNumberErrors[req.id] && <span style={{ display: 'block', fontSize: 12, color: '#DC2626', marginTop: 4 }}>{jobNumberErrors[req.id]}</span>}
                          </div>
                          <button
                            onClick={() => handleFinalize(req)}
                            disabled={isProcessing === req.id}
                            style={{
                              padding: '8px 24px', background: HBC_COLORS.orange, color: '#fff',
                              border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700,
                              cursor: isProcessing === req.id ? 'wait' : 'pointer',
                              opacity: isProcessing === req.id ? 0.7 : 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isProcessing === req.id ? 'Processing...' : 'Finalize'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 16, padding: '12px 16px', background: '#DEF7EC', borderRadius: 6, fontSize: 13, color: '#03543F' }}>
                        Assigned: <strong>{req.AssignedJobNumber}</strong> by {req.AssignedBy} on {req.AssignedDate}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: 0.3,
};

const detailValueStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#1F2937',
  marginTop: 2,
};
