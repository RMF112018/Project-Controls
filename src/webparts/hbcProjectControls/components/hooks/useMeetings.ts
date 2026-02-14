import * as React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { IMeeting, ICalendarAvailability } from '@hbc/sp-services';

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
  const { dataService } = useAppContext();
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
    return created;
  }, [dataService]);

  return { meetings, availability, isLoading, error, fetchMeetings, fetchAvailability, createMeeting };
}
