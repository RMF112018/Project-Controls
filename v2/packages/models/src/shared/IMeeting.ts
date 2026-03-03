import { MeetingType } from './enums';

export interface IMeeting {
  id: string;
  subject: string;
  type: MeetingType;
  startTime: string;
  endTime: string;
  attendees: string[];
  location?: string;
  teamsLink?: string;
  projectCode?: string;
  leadId?: number;
  createdBy: string;
  createdAt: string;
}

export interface ITimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface ICalendarAvailability {
  email: string;
  displayName: string;
  slots: ITimeSlot[];
}
