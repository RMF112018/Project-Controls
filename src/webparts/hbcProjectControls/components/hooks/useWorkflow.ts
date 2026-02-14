import {
  IDeliverable,
  ITeamMember,
  IInterviewPrep,
  IContractInfo,
  ITurnoverItem,
  ICloseoutItem,
  ILossAutopsy,
  ILead,
  IEstimatingTracker,
  Stage,
  AuditAction,
  EntityType,
  NotificationType,
  MeetingType,
  AwardStatus,
  validateTransition
} from '@hbc/sp-services';
import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
interface IUseWorkflowResult {
  // Team Members
  teamMembers: ITeamMember[];
  fetchTeamMembers: (projectCode: string) => Promise<void>;

  // Deliverables
  deliverables: IDeliverable[];
  fetchDeliverables: (projectCode: string) => Promise<void>;
  createDeliverable: (data: Partial<IDeliverable>) => Promise<IDeliverable>;
  updateDeliverable: (id: number, data: Partial<IDeliverable>) => Promise<IDeliverable>;

  // Interview Prep
  interviewPrep: IInterviewPrep | null;
  fetchInterviewPrep: (leadId: number) => Promise<void>;
  saveInterviewPrep: (data: Partial<IInterviewPrep>) => Promise<IInterviewPrep>;

  // Contract
  contractInfo: IContractInfo | null;
  fetchContractInfo: (projectCode: string) => Promise<void>;
  saveContractInfo: (data: Partial<IContractInfo>) => Promise<IContractInfo>;

  // Turnover
  turnoverItems: ITurnoverItem[];
  fetchTurnoverItems: (projectCode: string) => Promise<void>;
  updateTurnoverItem: (id: number, data: Partial<ITurnoverItem>) => Promise<ITurnoverItem>;

  // Closeout
  closeoutItems: ICloseoutItem[];
  fetchCloseoutItems: (projectCode: string) => Promise<void>;
  updateCloseoutItem: (id: number, data: Partial<ICloseoutItem>) => Promise<ICloseoutItem>;

  // Loss Autopsy
  lossAutopsy: ILossAutopsy | null;
  fetchLossAutopsy: (leadId: number) => Promise<void>;
  saveLossAutopsy: (data: Partial<ILossAutopsy>) => Promise<ILossAutopsy>;

  // Stage transition
  transitionStage: (lead: ILead, toStage: Stage, isAdmin?: boolean) => Promise<ILead>;

  // Win/Loss
  recordWin: (lead: ILead, details: { contractValue?: number; finalFeePct?: number; awardDate?: string; contractType?: string }) => Promise<ILead>;
  recordLoss: (lead: ILead, details: { lossReasons: string[]; competitor?: string; autopsyNotes?: string }) => Promise<ILead>;

  // Meeting helpers
  scheduleKickoffMeeting: (projectCode: string, leadId: number, attendees: string[]) => Promise<void>;
  scheduleRedTeamReview: (projectCode: string, leadId: number, attendees: string[]) => Promise<void>;
  scheduleTurnoverMeeting: (projectCode: string, leadId: number, attendees: string[]) => Promise<void>;
  scheduleAutopsyMeeting: (projectCode: string, leadId: number, attendees: string[]) => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;
}

export function useWorkflow(): IUseWorkflowResult {
  const { dataService } = useAppContext();
  const [teamMembers, setTeamMembers] = React.useState<ITeamMember[]>([]);
  const [deliverables, setDeliverables] = React.useState<IDeliverable[]>([]);
  const [interviewPrep, setInterviewPrep] = React.useState<IInterviewPrep | null>(null);
  const [contractInfo, setContractInfo] = React.useState<IContractInfo | null>(null);
  const [turnoverItems, setTurnoverItems] = React.useState<ITurnoverItem[]>([]);
  const [closeoutItems, setCloseoutItems] = React.useState<ICloseoutItem[]>([]);
  const [lossAutopsy, setLossAutopsy] = React.useState<ILossAutopsy | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Team Members
  const fetchTeamMembers = React.useCallback(async (projectCode: string) => {
    try { setIsLoading(true); setError(null);
      const items = await dataService.getTeamMembers(projectCode);
      setTeamMembers(items);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to fetch team members');
    } finally { setIsLoading(false); }
  }, [dataService]);

  // Deliverables
  const fetchDeliverables = React.useCallback(async (projectCode: string) => {
    try { setIsLoading(true); setError(null);
      const items = await dataService.getDeliverables(projectCode);
      setDeliverables(items);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to fetch deliverables');
    } finally { setIsLoading(false); }
  }, [dataService]);

  const createDeliverable = React.useCallback(async (data: Partial<IDeliverable>) => {
    const item = await dataService.createDeliverable(data);
    setDeliverables(prev => [...prev, item]);
    return item;
  }, [dataService]);

  const updateDeliverable = React.useCallback(async (id: number, data: Partial<IDeliverable>) => {
    const updated = await dataService.updateDeliverable(id, data);
    setDeliverables(prev => prev.map(d => d.id === id ? updated : d));
    return updated;
  }, [dataService]);

  // Interview Prep
  const fetchInterviewPrep = React.useCallback(async (leadId: number) => {
    try { setIsLoading(true); setError(null);
      const item = await dataService.getInterviewPrep(leadId);
      setInterviewPrep(item);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to fetch interview prep');
    } finally { setIsLoading(false); }
  }, [dataService]);

  const saveInterviewPrepFn = React.useCallback(async (data: Partial<IInterviewPrep>) => {
    const saved = await dataService.saveInterviewPrep(data);
    setInterviewPrep(saved);
    return saved;
  }, [dataService]);

  // Contract
  const fetchContractInfo = React.useCallback(async (projectCode: string) => {
    try { setIsLoading(true); setError(null);
      const item = await dataService.getContractInfo(projectCode);
      setContractInfo(item);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to fetch contract info');
    } finally { setIsLoading(false); }
  }, [dataService]);

  const saveContractInfoFn = React.useCallback(async (data: Partial<IContractInfo>) => {
    const saved = await dataService.saveContractInfo(data);
    setContractInfo(saved);
    return saved;
  }, [dataService]);

  // Turnover
  const fetchTurnoverItems = React.useCallback(async (projectCode: string) => {
    try { setIsLoading(true); setError(null);
      const items = await dataService.getTurnoverItems(projectCode);
      setTurnoverItems(items);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to fetch turnover items');
    } finally { setIsLoading(false); }
  }, [dataService]);

  const updateTurnoverItemFn = React.useCallback(async (id: number, data: Partial<ITurnoverItem>) => {
    const updated = await dataService.updateTurnoverItem(id, data);
    setTurnoverItems(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  }, [dataService]);

  // Closeout
  const fetchCloseoutItems = React.useCallback(async (projectCode: string) => {
    try { setIsLoading(true); setError(null);
      const items = await dataService.getCloseoutItems(projectCode);
      setCloseoutItems(items);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to fetch closeout items');
    } finally { setIsLoading(false); }
  }, [dataService]);

  const updateCloseoutItemFn = React.useCallback(async (id: number, data: Partial<ICloseoutItem>) => {
    const updated = await dataService.updateCloseoutItem(id, data);
    setCloseoutItems(prev => prev.map(c => c.id === id ? updated : c));
    return updated;
  }, [dataService]);

  // Loss Autopsy
  const fetchLossAutopsy = React.useCallback(async (leadId: number) => {
    try { setIsLoading(true); setError(null);
      const item = await dataService.getLossAutopsy(leadId);
      setLossAutopsy(item);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to fetch loss autopsy');
    } finally { setIsLoading(false); }
  }, [dataService]);

  const saveLossAutopsyFn = React.useCallback(async (data: Partial<ILossAutopsy>) => {
    const saved = await dataService.saveLossAutopsy(data);
    setLossAutopsy(saved);
    return saved;
  }, [dataService]);

  // Stage transition with enforcement
  const transitionStage = React.useCallback(async (lead: ILead, toStage: Stage, isAdmin?: boolean): Promise<ILead> => {
    const err = validateTransition(lead.Stage, toStage, isAdmin);
    if (err) throw new Error(err);
    const updated = await dataService.updateLead(lead.id, { Stage: toStage });
    await dataService.logAudit({
      Action: AuditAction.LeadEdited,
      EntityType: EntityType.Lead,
      EntityId: String(lead.id),
      ProjectCode: lead.ProjectCode,
      FieldChanged: 'Stage',
      PreviousValue: lead.Stage,
      NewValue: toStage,
      Details: `Stage transitioned from ${lead.Stage} to ${toStage}`,
    });
    return updated;
  }, [dataService]);

  // Win/Loss recording
  const recordWin = React.useCallback(async (lead: ILead, details: { contractValue?: number; finalFeePct?: number; awardDate?: string; contractType?: string }): Promise<ILead> => {
    const updated = await dataService.updateLead(lead.id, {
      WinLossDecision: 'Win' as ILead['WinLossDecision'],
      WinLossDate: new Date().toISOString().split('T')[0],
      Stage: Stage.WonContractPending,
      ProjectValue: details.contractValue ?? lead.ProjectValue,
      AnticipatedFeePct: details.finalFeePct ?? lead.AnticipatedFeePct,
      AwardDate: details.awardDate,
    });

    // Sync with estimating tracker
    const estRecord = await dataService.getEstimatingByLeadId(lead.id);
    if (estRecord) {
      const hadPrecon = estRecord.PreconFee !== undefined && estRecord.PreconFee !== null && estRecord.PreconFee > 0;
      await dataService.updateEstimatingRecord(estRecord.id, {
        AwardStatus: (hadPrecon ? AwardStatus.AwardedWithPrecon : AwardStatus.AwardedWithoutPrecon) as IEstimatingTracker['AwardStatus'],
      });
    }

    // Initialize contract info
    await dataService.saveContractInfo({
      leadId: lead.id,
      projectCode: lead.ProjectCode ?? '',
      contractStatus: 'Draft',
      contractType: details.contractType,
      contractValue: details.contractValue,
    });

    // Notification
    await dataService.sendNotification({
      type: NotificationType.Both,
      subject: `Win Recorded: ${lead.Title}`,
      body: `${lead.Title} has been awarded. Contract value: $${details.contractValue?.toLocaleString() ?? 'TBD'}`,
      recipients: ['exec@hedrickbrothers.com', 'bd@hedrickbrothers.com', 'legal@hedrickbrothers.com', 'accounting@hedrickbrothers.com'],
      projectCode: lead.ProjectCode,
      relatedEntityType: 'Lead',
      relatedEntityId: String(lead.id),
    });

    await dataService.logAudit({
      Action: AuditAction.LossRecorded, // reusing closest audit action
      EntityType: EntityType.Lead,
      EntityId: String(lead.id),
      ProjectCode: lead.ProjectCode,
      Details: `Win recorded for ${lead.Title}. Contract value: ${details.contractValue}`,
    });

    return updated;
  }, [dataService]);

  const recordLoss = React.useCallback(async (lead: ILead, details: { lossReasons: string[]; competitor?: string; autopsyNotes?: string }): Promise<ILead> => {
    const updated = await dataService.updateLead(lead.id, {
      WinLossDecision: 'Loss' as ILead['WinLossDecision'],
      WinLossDate: new Date().toISOString().split('T')[0],
      Stage: Stage.ArchivedLoss,
      LossReason: details.lossReasons as ILead['LossReason'],
      LossCompetitor: details.competitor,
      LossAutopsyNotes: details.autopsyNotes,
    });

    // Sync with estimating tracker
    const estRecord = await dataService.getEstimatingByLeadId(lead.id);
    if (estRecord) {
      await dataService.updateEstimatingRecord(estRecord.id, {
        AwardStatus: AwardStatus.NotAwarded as IEstimatingTracker['AwardStatus'],
      });
    }

    // Notification
    await dataService.sendNotification({
      type: NotificationType.Both,
      subject: `Loss Recorded: ${lead.Title}`,
      body: `${lead.Title} was not awarded. Reasons: ${details.lossReasons.join(', ')}`,
      recipients: ['exec@hedrickbrothers.com', 'bd@hedrickbrothers.com'],
      projectCode: lead.ProjectCode,
      relatedEntityType: 'Lead',
      relatedEntityId: String(lead.id),
    });

    await dataService.logAudit({
      Action: AuditAction.LossRecorded,
      EntityType: EntityType.Lead,
      EntityId: String(lead.id),
      ProjectCode: lead.ProjectCode,
      Details: `Loss recorded for ${lead.Title}. Reasons: ${details.lossReasons.join(', ')}`,
    });

    return updated;
  }, [dataService]);

  // Meeting schedulers
  const scheduleMeeting = React.useCallback(async (
    type: MeetingType,
    subject: string,
    projectCode: string,
    leadId: number,
    attendees: string[],
    notificationSubject: string,
  ): Promise<void> => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const endTime = new Date(tomorrow);
    endTime.setHours(11, 0, 0, 0);

    await dataService.createMeeting({
      type,
      subject,
      startTime: tomorrow.toISOString(),
      endTime: endTime.toISOString(),
      attendees,
      projectCode,
      leadId,
    });

    await dataService.sendNotification({
      type: NotificationType.Both,
      subject: notificationSubject,
      body: `${subject} has been scheduled for ${tomorrow.toLocaleDateString()}.`,
      recipients: attendees,
      projectCode,
      relatedEntityType: 'Meeting',
      relatedEntityId: String(leadId),
    });

    await dataService.logAudit({
      Action: AuditAction.MeetingScheduled,
      EntityType: EntityType.Project,
      EntityId: projectCode,
      ProjectCode: projectCode,
      Details: `${subject} scheduled with ${attendees.length} attendees`,
    });
  }, [dataService]);

  const scheduleKickoffMeeting = React.useCallback(async (projectCode: string, leadId: number, attendees: string[]) => {
    await scheduleMeeting(MeetingType.PreconKickoff, 'Preconstruction Kickoff Meeting', projectCode, leadId, attendees, 'Kickoff Meeting Scheduled');
  }, [scheduleMeeting]);

  const scheduleRedTeamReview = React.useCallback(async (projectCode: string, leadId: number, attendees: string[]) => {
    await scheduleMeeting(MeetingType.WinStrategy, 'Red Team Review', projectCode, leadId, attendees, 'Red Team Review Scheduled');
  }, [scheduleMeeting]);

  const scheduleTurnoverMeeting = React.useCallback(async (projectCode: string, leadId: number, attendees: string[]) => {
    await scheduleMeeting(MeetingType.Turnover, 'Turnover Meeting', projectCode, leadId, attendees, 'Turnover Meeting Scheduled');
  }, [scheduleMeeting]);

  const scheduleAutopsyMeeting = React.useCallback(async (projectCode: string, leadId: number, attendees: string[]) => {
    await scheduleMeeting(MeetingType.LossAutopsy, 'Loss Autopsy Meeting', projectCode, leadId, attendees, 'Loss Autopsy Meeting Scheduled');
  }, [scheduleMeeting]);

  return {
    teamMembers, fetchTeamMembers,
    deliverables, fetchDeliverables, createDeliverable, updateDeliverable,
    interviewPrep, fetchInterviewPrep, saveInterviewPrep: saveInterviewPrepFn,
    contractInfo, fetchContractInfo, saveContractInfo: saveContractInfoFn,
    turnoverItems, fetchTurnoverItems, updateTurnoverItem: updateTurnoverItemFn,
    closeoutItems, fetchCloseoutItems, updateCloseoutItem: updateCloseoutItemFn,
    lossAutopsy, fetchLossAutopsy, saveLossAutopsy: saveLossAutopsyFn,
    transitionStage, recordWin, recordLoss,
    scheduleKickoffMeeting, scheduleRedTeamReview, scheduleTurnoverMeeting, scheduleAutopsyMeeting,
    isLoading, error,
  };
}
