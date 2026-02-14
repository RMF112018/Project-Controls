import * as React from 'react';
import { MeetingType, ICalendarAvailability, ITimeSlot } from '@hbc/sp-services';
import { useMeetings } from '../hooks/useMeetings';
import { useAppContext } from '../contexts/AppContext';
import { HBC_COLORS } from '../../theme/tokens';

interface IKickoffMeetingSchedulerProps {
  attendeeEmails: string[];
  leadId?: number;
  projectCode?: string;
  onScheduled?: (meetingId: string, start: string, end: string) => void;
  onCancel?: () => void;
}

type Slot = { start: string; end: string };

export const KickoffMeetingScheduler: React.FC<IKickoffMeetingSchedulerProps> = ({
  attendeeEmails,
  leadId,
  projectCode,
  onScheduled,
  onCancel,
}) => {
  const { currentUser } = useAppContext();
  const { availability, isLoading, error, fetchAvailability, createMeeting } = useMeetings();
  const [slots, setSlots] = React.useState<Slot[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);

  React.useEffect(() => {
    if (attendeeEmails.length === 0) return;
    const now = new Date();
    const end = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    fetchAvailability(attendeeEmails, now.toISOString(), end.toISOString()).catch(console.error);
  }, [attendeeEmails, fetchAvailability]);

  React.useEffect(() => {
    if (availability.length === 0) return;
    const common = findCommonSlots(availability).slice(0, 3);
    setSlots(common);
  }, [availability]);

  const handleSelect = async (slot: Slot): Promise<void> => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const meeting = await createMeeting({
        subject: `Estimating Kick-Off${projectCode ? `: ${projectCode}` : ''}`,
        type: MeetingType.Kickoff,
        startTime: slot.start,
        endTime: slot.end,
        attendees: attendeeEmails,
        leadId,
        projectCode,
        createdBy: currentUser?.displayName ?? 'Estimating Coordinator',
        createdAt: new Date().toISOString(),
      });
      onScheduled?.(meeting.id, slot.start, slot.end);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>Schedule Estimating Kick-Off</h3>
      <p style={subtitleStyle}>
        Select one of the next available 1-hour slots within 48 hours.
      </p>

      {isLoading && <div style={loadingStyle}>Checking availability...</div>}
      {error && <div style={errorStyle}>{error}</div>}

      {!isLoading && slots.length === 0 && (
        <div style={emptyStyle}>No common availability found in the next 48 hours.</div>
      )}

      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
        {slots.map(slot => (
          <button
            key={slot.start}
            onClick={() => handleSelect(slot)}
            disabled={isCreating}
            style={slotButtonStyle}
          >
            {formatSlot(slot)}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        {onCancel && (
          <button onClick={onCancel} style={cancelButtonStyle} disabled={isCreating}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

const findCommonSlots = (availability: ICalendarAvailability[]): Slot[] => {
  if (availability.length === 0) return [];
  const slotMap = new Map<string, { end: string; count: number }>();

  availability.forEach(person => {
    person.slots.forEach((slot: ITimeSlot) => {
      if (!slot.available) return;
      const key = slot.start;
      const current = slotMap.get(key);
      if (current) {
        current.count += 1;
      } else {
        slotMap.set(key, { end: slot.end, count: 1 });
      }
    });
  });

  const requiredCount = availability.length;
  return Array.from(slotMap.entries())
    .filter(([, value]) => value.count === requiredCount)
    .map(([start, value]) => ({ start, end: value.end }))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
};

const formatSlot = (slot: Slot): string => {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const containerStyle: React.CSSProperties = {
  padding: 16,
  border: `1px solid ${HBC_COLORS.gray200}`,
  borderRadius: 8,
  background: '#fff',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: HBC_COLORS.navy,
};

const subtitleStyle: React.CSSProperties = {
  margin: '6px 0 12px',
  fontSize: 12,
  color: HBC_COLORS.gray500,
};

const loadingStyle: React.CSSProperties = {
  fontSize: 12,
  color: HBC_COLORS.gray500,
};

const errorStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: '#FDE8E8',
  color: '#9B1C1C',
  borderRadius: 6,
  fontSize: 12,
};

const emptyStyle: React.CSSProperties = {
  fontSize: 12,
  color: HBC_COLORS.gray500,
};

const slotButtonStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: '#F3F4F6',
  border: `1px solid ${HBC_COLORS.gray200}`,
  borderRadius: 6,
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  color: HBC_COLORS.navy,
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: 'transparent',
  border: `1px solid ${HBC_COLORS.gray300}`,
  borderRadius: 6,
  fontSize: 12,
  cursor: 'pointer',
  color: HBC_COLORS.gray600,
};
