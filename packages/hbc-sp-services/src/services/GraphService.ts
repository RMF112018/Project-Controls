import { ICalendarAvailability, IMeeting } from '../models/IMeeting';
import { IAuditEntry } from '../models/IAuditEntry';
import { AuditAction, EntityType } from '../models/enums';
import { graphBatchService, type IBatchResult } from './GraphBatchService';
import { bindEnforcerFeatureCheck } from './GraphBatchEnforcer';

/** Callback type for audit logging — injected from WebPart or DataService */
export type GraphAuditLogger = (entry: Partial<IAuditEntry>) => Promise<void>;

export interface IGraphService {
  getCurrentUserProfile(): Promise<{ displayName: string; email: string; id: string }>;
  getUserPhoto(email: string): Promise<string | null>;
  getGroupMembers(groupId: string): Promise<Array<{ displayName: string; email: string }>>;
  addGroupMember(groupId: string, userId: string): Promise<void>;
  batchAddGroupMembers(groupId: string, userIds: string[]): Promise<IBatchResult>;
  batchGetUserPhotos(emails: string[]): Promise<Map<string, string | null>>;
  getCalendarAvailability(emails: string[], start: string, end: string): Promise<ICalendarAvailability[]>;
  createCalendarEvent(meeting: Partial<IMeeting>): Promise<IMeeting>;
  sendEmail(to: string[], subject: string, body: string): Promise<void>;
  createTeamsChat(members: string[], message: string): Promise<string>;
}

export class GraphService implements IGraphService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private graphClient: any;
  private auditLogger: GraphAuditLogger | null = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialize(graphClient: any, isFeatureEnabled?: (flag: string) => boolean): void {
    this.graphClient = graphClient;
    // Phase 5D: bind the real feature flag accessor for the enforcer
    if (isFeatureEnabled) {
      bindEnforcerFeatureCheck(isFeatureEnabled);
    }
  }

  /** Set the audit logger callback — called from WebPart after dataService is created */
  setAuditLogger(logger: GraphAuditLogger): void {
    this.auditLogger = logger;
  }

  /** Fire-and-forget audit log for Graph API calls */
  private logGraphCall(
    action: AuditAction,
    endpoint: string,
    details: string,
    user?: string
  ): void {
    if (!this.auditLogger) return;
    this.auditLogger({
      Action: action,
      EntityType: EntityType.GraphApi,
      EntityId: endpoint,
      User: user || 'system',
      Details: details,
    }).catch(() => { /* audit is non-blocking */ });
  }

  // Stage 4 (sub-task 3): Harden Graph calls with bounded retry/backoff and
  // a single auth-refresh retry path for 401/403-style transient auth errors.
  private getGraphStatusCode(err: unknown): number | undefined {
    if (!err || typeof err !== 'object') return undefined;
    const maybe = err as { statusCode?: number; status?: number; code?: string };
    if (typeof maybe.statusCode === 'number') return maybe.statusCode;
    if (typeof maybe.status === 'number') return maybe.status;
    if (maybe.code === 'Unauthorized') return 401;
    return undefined;
  }

  private isTransientStatus(status: number | undefined): boolean {
    if (!status) return false;
    return status === 408 || status === 429 || (status >= 500 && status <= 599);
  }

  private isAuthRetryableStatus(status: number | undefined): boolean {
    return status === 401 || status === 403;
  }

  private async delay(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  private async executeGraphCall<T>(
    endpoint: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const maxTransientRetries = 2;
    let attempt = 0;
    let authRetryUsed = false;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await fn();
      } catch (err) {
        const status = this.getGraphStatusCode(err);
        const transient = this.isTransientStatus(status);
        const authRetryable = this.isAuthRetryableStatus(status);
        const canRetryTransient = transient && attempt < maxTransientRetries;
        const canRetryAuth = authRetryable && !authRetryUsed;

        if (canRetryAuth) {
          authRetryUsed = true;
          await this.delay(300);
          continue;
        }

        if (canRetryTransient) {
          attempt += 1;
          const backoffMs = 200 * Math.pow(2, attempt);
          await this.delay(backoffMs);
          continue;
        }

        this.logGraphCall(
          AuditAction.GraphApiCallFailed,
          endpoint,
          `${operation} failed${status ? ` [${status}]` : ''}: ${err instanceof Error ? err.message : String(err)}`
        );
        throw err;
      }
    }
  }

  async getCurrentUserProfile(): Promise<{ displayName: string; email: string; id: string }> {
    if (!this.graphClient) throw new Error('Graph client not initialized');
    const me = await this.executeGraphCall(
      'GET /me',
      'getCurrentUserProfile',
      async () => this.graphClient.api('/me').select('displayName,mail,id').get()
    );
    return { displayName: me.displayName, email: me.mail, id: me.id };
  }

  async getUserPhoto(email: string): Promise<string | null> {
    try {
      if (!this.graphClient) return null;
      const photo = await this.graphClient.api(`/users/${email}/photo/$value`).get();
      return URL.createObjectURL(photo);
    } catch {
      return null;
    }
  }

  async getGroupMembers(groupId: string): Promise<Array<{ displayName: string; email: string }>> {
    if (!this.graphClient) throw new Error('Graph client not initialized');
    const result = await this.executeGraphCall(
      `GET /groups/${groupId}/members`,
      'getGroupMembers',
      async () => this.graphClient.api(`/groups/${groupId}/members`).select('displayName,mail').get()
    );
    return result.value.map((m: { displayName: string; mail: string }) => ({
      displayName: m.displayName,
      email: m.mail,
    }));
  }

  async addGroupMember(groupId: string, userId: string): Promise<void> {
    if (!this.graphClient) {
      console.warn('Graph client not initialized');
      return;
    }
    await this.executeGraphCall(
      `POST /groups/${groupId}/members/$ref`,
      'addGroupMember',
      async () => this.graphClient.api(`/groups/${groupId}/members/$ref`).post({
        '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`,
      })
    );
    this.logGraphCall(
      AuditAction.GraphGroupMemberAdded,
      `POST /groups/${groupId}/members/$ref`,
      `Added user ${userId} to group ${groupId}`
    );
  }

  /**
   * Batch-add multiple members to a group via $batch API.
   * Auto-chunks at MAX_BATCH_SIZE=20 (Graph API hard limit).
   */
  async batchAddGroupMembers(groupId: string, userIds: string[]): Promise<IBatchResult> {
    if (!this.graphClient) throw new Error('Graph client not initialized');
    if (userIds.length === 0) {
      return { responses: [], succeeded: [], permanentFailures: [], transientFailures: [] };
    }

    graphBatchService.initialize(this.graphClient);
    graphBatchService.setAuditLogger(this.auditLogger!);

    const requests = userIds.map((userId, i) => ({
      id: String(i + 1),
      method: 'POST' as const,
      url: `/groups/${groupId}/members/$ref`,
      body: {
        '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`,
      },
    }));

    const result = await graphBatchService.executeBatch(requests);

    this.logGraphCall(
      result.permanentFailures.length === 0 && result.transientFailures.length === 0
        ? AuditAction.GraphApiCallSucceeded
        : AuditAction.GraphApiCallFailed,
      `BATCH POST /groups/${groupId}/members/$ref`,
      `Batch add ${userIds.length} members: ${result.succeeded.length} ok, ${result.permanentFailures.length} permanent, ${result.transientFailures.length} transient`
    );

    return result;
  }

  /**
   * Batch-fetch user photos via $batch API.
   * Returns a Map<email, dataUrl | null>.
   */
  async batchGetUserPhotos(emails: string[]): Promise<Map<string, string | null>> {
    const photoMap = new Map<string, string | null>();
    if (!this.graphClient || emails.length === 0) return photoMap;

    graphBatchService.initialize(this.graphClient);
    graphBatchService.setAuditLogger(this.auditLogger!);

    const requests = emails.map((email, i) => ({
      id: String(i + 1),
      method: 'GET' as const,
      url: `/users/${email}/photo/$value`,
    }));

    const result = await graphBatchService.executeBatch(requests);

    // Map responses back to emails by correlating sequential IDs
    for (const resp of result.responses) {
      const idx = parseInt(resp.id, 10) - 1;
      if (idx >= 0 && idx < emails.length) {
        if (resp.status >= 200 && resp.status < 300 && resp.body) {
          // Photo data returned — in real Graph $batch the body is base64
          photoMap.set(emails[idx], resp.body as string);
        } else {
          photoMap.set(emails[idx], null);
        }
      }
    }

    this.logGraphCall(
      AuditAction.GraphApiCallSucceeded,
      `BATCH GET /users/*/photo/$value`,
      `Batch photo fetch for ${emails.length} users: ${result.succeeded.length} found`
    );

    return photoMap;
  }

  async getCalendarAvailability(emails: string[], start: string, end: string): Promise<ICalendarAvailability[]> {
    if (!this.graphClient) throw new Error('Graph client not initialized');
    const result = await this.executeGraphCall(
      'POST /me/calendar/getSchedule',
      'getCalendarAvailability',
      async () => this.graphClient.api('/me/calendar/getSchedule').post({
        schedules: emails,
        startTime: { dateTime: start, timeZone: 'Eastern Standard Time' },
        endTime: { dateTime: end, timeZone: 'Eastern Standard Time' },
        availabilityViewInterval: 60,
      })
    );
    return result.value.map((schedule: { scheduleId: string; availabilityView: string }) => ({
      email: schedule.scheduleId,
      displayName: schedule.scheduleId,
      slots: this.parseAvailabilityView(schedule.availabilityView, start),
    }));
  }

  private parseAvailabilityView(view: string, startDate: string): ICalendarAvailability['slots'] {
    const slots: ICalendarAvailability['slots'] = [];
    const start = new Date(startDate);
    for (let i = 0; i < view.length; i++) {
      const slotStart = new Date(start.getTime() + i * 60 * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: view[i] === '0',
      });
    }
    return slots;
  }

  async createCalendarEvent(meeting: Partial<IMeeting>): Promise<IMeeting> {
    if (!this.graphClient) throw new Error('Graph client not initialized');
    const event = await this.executeGraphCall(
      'POST /me/events',
      'createCalendarEvent',
      async () => this.graphClient.api('/me/events').post({
        subject: meeting.subject,
        start: { dateTime: meeting.startTime, timeZone: 'Eastern Standard Time' },
        end: { dateTime: meeting.endTime, timeZone: 'Eastern Standard Time' },
        attendees: meeting.attendees?.map(email => ({
          emailAddress: { address: email },
          type: 'required',
        })),
        isOnlineMeeting: true,
        onlineMeetingProvider: 'teamsForBusiness',
      })
    );
    this.logGraphCall(
      AuditAction.GraphApiCallSucceeded,
      'POST /me/events',
      `Calendar event created: "${meeting.subject}" with ${meeting.attendees?.length || 0} attendees`
    );
    return {
      id: event.id,
      subject: event.subject,
      type: meeting.type!,
      startTime: event.start.dateTime,
      endTime: event.end.dateTime,
      attendees: meeting.attendees || [],
      teamsLink: event.onlineMeeting?.joinUrl,
      projectCode: meeting.projectCode,
      leadId: meeting.leadId,
      createdBy: '',
      createdAt: new Date().toISOString(),
    };
  }

  async sendEmail(to: string[], subject: string, body: string): Promise<void> {
    if (!this.graphClient) throw new Error('Graph client not initialized');
    await this.executeGraphCall(
      'POST /me/sendMail',
      'sendEmail',
      async () => this.graphClient.api('/me/sendMail').post({
        message: {
          subject,
          body: { contentType: 'HTML', content: body },
          toRecipients: to.map(email => ({ emailAddress: { address: email } })),
        },
      })
    );
    this.logGraphCall(
      AuditAction.GraphApiCallSucceeded,
      'POST /me/sendMail',
      `Email sent: "${subject}" to ${to.length} recipients`
    );
  }

  async createTeamsChat(members: string[], message: string): Promise<string> {
    if (!this.graphClient) throw new Error('Graph client not initialized');
    const chat = await this.executeGraphCall(
      'POST /chats',
      'createTeamsChat:createChat',
      async () => this.graphClient.api('/chats').post({
        chatType: 'group',
        members: members.map(email => ({
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['owner'],
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users/${email}`,
        })),
      })
    );
    await this.executeGraphCall(
      `POST /chats/${chat.id}/messages`,
      'createTeamsChat:postMessage',
      async () => this.graphClient.api(`/chats/${chat.id}/messages`).post({
        body: { content: message },
      })
    );
    this.logGraphCall(
      AuditAction.GraphApiCallSucceeded,
      'POST /chats',
      `Teams chat created with ${members.length} members`
    );
    return chat.id;
  }
}

export const graphService = new GraphService();
