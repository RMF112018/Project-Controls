import { ICalendarAvailability, IMeeting } from '../models/IMeeting';

export interface IGraphService {
  getCurrentUserProfile(): Promise<{ displayName: string; email: string; id: string }>;
  getUserPhoto(email: string): Promise<string | null>;
  getGroupMembers(groupId: string): Promise<Array<{ displayName: string; email: string }>>;
  getCalendarAvailability(emails: string[], start: string, end: string): Promise<ICalendarAvailability[]>;
  createCalendarEvent(meeting: Partial<IMeeting>): Promise<IMeeting>;
  sendEmail(to: string[], subject: string, body: string): Promise<void>;
  createTeamsChat(members: string[], message: string): Promise<string>;
}

export class GraphService implements IGraphService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private graphClient: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialize(graphClient: any): void {
    this.graphClient = graphClient;
  }

  async getCurrentUserProfile(): Promise<{ displayName: string; email: string; id: string }> {
    if (!this.graphClient) throw new Error('Graph client not initialized');
    const me = await this.graphClient.api('/me').select('displayName,mail,id').get();
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
    const result = await this.graphClient.api(`/groups/${groupId}/members`).select('displayName,mail').get();
    return result.value.map((m: { displayName: string; mail: string }) => ({
      displayName: m.displayName,
      email: m.mail,
    }));
  }

  async getCalendarAvailability(emails: string[], start: string, end: string): Promise<ICalendarAvailability[]> {
    if (!this.graphClient) throw new Error('Graph client not initialized');
    const result = await this.graphClient.api('/me/calendar/getSchedule').post({
      schedules: emails,
      startTime: { dateTime: start, timeZone: 'Eastern Standard Time' },
      endTime: { dateTime: end, timeZone: 'Eastern Standard Time' },
      availabilityViewInterval: 60,
    });
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
    const event = await this.graphClient.api('/me/events').post({
      subject: meeting.subject,
      start: { dateTime: meeting.startTime, timeZone: 'Eastern Standard Time' },
      end: { dateTime: meeting.endTime, timeZone: 'Eastern Standard Time' },
      attendees: meeting.attendees?.map(email => ({
        emailAddress: { address: email },
        type: 'required',
      })),
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
    });
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
    await this.graphClient.api('/me/sendMail').post({
      message: {
        subject,
        body: { contentType: 'HTML', content: body },
        toRecipients: to.map(email => ({ emailAddress: { address: email } })),
      },
    });
  }

  async createTeamsChat(members: string[], message: string): Promise<string> {
    if (!this.graphClient) throw new Error('Graph client not initialized');
    const chat = await this.graphClient.api('/chats').post({
      chatType: 'group',
      members: members.map(email => ({
        '@odata.type': '#microsoft.graph.aadUserConversationMember',
        roles: ['owner'],
        'user@odata.bind': `https://graph.microsoft.com/v1.0/users/${email}`,
      })),
    });
    await this.graphClient.api(`/chats/${chat.id}/messages`).post({
      body: { content: message },
    });
    return chat.id;
  }
}

export const graphService = new GraphService();
