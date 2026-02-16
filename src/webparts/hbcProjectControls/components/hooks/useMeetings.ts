import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useSignalR } from './useSignalR';
import { IMeeting, ICalendarAvailability, EntityType, IEntityChangedMessage } from '@hbc/sp-services';

interface IUseMeetingsResult {
  meetings: IMeeting[];
  availability: ICalendarAvailability[];
  isLoading: boolean;
  error: string | null;
  fetchMeetings: (projectCode?: string) => Promise<void>;
  fetchAvailability: (emails: string[], startDate: string, endDate: string) => Promise<void>;
  createMeeting: (meeting: Partial<IMeeting>) => Promise<IMeeting>;
}

export function useMeetings(): IUseMeetingsResult {
  const { dataService, currentUser } = useAppContext();
  const { broadcastChange } = useSignalRContext();
  const [meetings, setMeetings] = React.useState<IMeeting[]>([]);
  const [availability, setAvailability] = React.useState<ICalendarAvailability[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchMeetings = React.useCallback(async (projectCode?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getMeetings(projectCode);
      setMeetings(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meetings');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  // SignalR: refresh on Meeting entity changes
  useSignalR({
    entityType: EntityType.Meeting,
    onEntityChanged: React.useCallback(() => { fetchMeetings(); }, [fetchMeetings]),
  });

  const broadcastMeetingChange = React.useCallback((
    meetingId: number | string,
    action: IEntityChangedMessage['action'],
    summary?: string
  ) => {
    broadcastChange({
      type: 'EntityChanged',
      entityType: EntityType.Meeting,
      entityId: String(meetingId),
      action,
      changedBy: currentUser?.email ?? 'unknown',
      changedByName: currentUser?.displayName,
      timestamp: new Date().toISOString(),
      summary,
    });
  }, [broadcastChange, currentUser]);

  const fetchAvailability = React.useCallback(async (emails: string[], startDate: string, endDate: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await dataService.getCalendarAvailability(emails, startDate, endDate);
      setAvailability(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch availability');
    } finally {
      setIsLoading(false);
    }
  }, [dataService]);

  const createMeeting = React.useCallback(async (meeting: Partial<IMeeting>): Promise<IMeeting> => {
    const created = await dataService.createMeeting(meeting);
    setMeetings(prev => [...prev, created]);
    broadcastMeetingChange(created.id, 'created', 'Meeting scheduled');
    return created;
  }, [dataService, broadcastMeetingChange]);

  return { meetings, availability, isLoading, error, fetchMeetings, fetchAvailability, createMeeting };
}
